import mongoose from 'mongoose';
import { Challan } from '../../models/Challan.js';
import { Client } from '../../models/Client.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../config/logger.js';
import { buildPaginationMeta, escapeRegex, roundMoney } from '../../utils/query.js';
import { CHALLAN_PREFIX } from '../../constants/index.js';
import { invalidateDashboard } from '../dashboard/dashboard.cache.js';
import { allocateChallanNo, resyncCounter } from './challanNumber.service.js';

const MAX_ALLOCATION_ATTEMPTS = 3;

const CHALLAN_NO_SEARCH = new RegExp(`^${CHALLAN_PREFIX}\\d*$`, 'i');

function buildFilter({ search, from, to, client }) {
  const filter = {};
  if (client) filter.client = new mongoose.Types.ObjectId(client);
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;
  }
  if (search && CHALLAN_NO_SEARCH.test(search)) {
    // Numbers are stored uppercase, so an anchored prefix search can use the index.
    filter.challanNo = new RegExp(`^${escapeRegex(search.toUpperCase())}`);
  } else if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ challanNo: regex }, { clientName: regex }];
  }
  return filter;
}

/** Summary figures for the whole filtered set (independent of pagination). */
export async function summarizeChallans(query) {
  const [summary] = await Challan.aggregate([
    { $match: buildFilter(query) },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$totalAmount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$totalAmount' },
        highestAmount: { $max: '$totalAmount' },
        clients: { $addToSet: '$client' },
      },
    },
    { $project: { _id: 0, totalAmount: 1, count: 1, averageAmount: 1, highestAmount: 1, clientCount: { $size: '$clients' } } },
  ]);

  const result = summary ?? { totalAmount: 0, count: 0, averageAmount: 0, highestAmount: 0, clientCount: 0 };
  result.totalAmount = roundMoney(result.totalAmount);
  result.averageAmount = roundMoney(result.averageAmount ?? 0);
  return result;
}

/** One page of challans (index-backed find). The summary is optional to keep paging cheap. */
export async function listChallans(query) {
  const { page, limit, sort, order, summary: withSummary } = query;
  const direction = order === 'asc' ? 1 : -1;
  const filter = buildFilter(query);
  // challanNo is unique, so it needs no tie-breaker.
  const sortSpec = sort === 'challanNo' ? { challanNo: direction } : { [sort]: direction, _id: direction };

  const [rows, total, summary] = await Promise.all([
    Challan.find(filter)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('challanNo date client clientName totalAmount createdAt')
      .lean(),
    withSummary ? null : Challan.countDocuments(filter),
    withSummary ? summarizeChallans(query) : null,
  ]);

  const meta = buildPaginationMeta({ page, limit, total: withSummary ? summary.count : total });
  if (withSummary) meta.summary = summary;

  return { data: rows, meta };
}

export async function getChallan(id) {
  const challan = await Challan.findById(id).populate('client', 'name contactNumber').lean();
  if (!challan) throw ApiError.notFound('Challan not found');
  return challan;
}

export async function createChallan({ date, client: clientId, items }, userId) {
  const client = await Client.findById(clientId).select('name').lean();
  if (!client) throw ApiError.badRequest('Selected client does not exist', [{ field: 'client', message: 'Client not found' }]);

  for (let attempt = 1; attempt <= MAX_ALLOCATION_ATTEMPTS; attempt += 1) {
    const challanNo = await allocateChallanNo(date);
    try {
      const challan = await Challan.create({
        challanNo,
        date,
        client: client._id,
        clientName: client.name,
        items,
        createdBy: userId,
      });
      invalidateDashboard();
      logger.info('Challan created', { challanNo, totalAmount: challan.totalAmount });
      return challan.toObject();
    } catch (err) {
      const duplicateNumber = err?.code === 11000 && err?.keyPattern?.challanNo;
      if (!duplicateNumber || attempt === MAX_ALLOCATION_ATTEMPTS) throw err;
      logger.warn('Challan number collision, resyncing counter', { challanNo, attempt });
      await resyncCounter(date);
    }
  }
  throw ApiError.conflict('Could not allocate a unique challan number. Please try again.');
}

export async function deleteChallan(id) {
  const challan = await Challan.findByIdAndDelete(id).lean();
  if (!challan) throw ApiError.notFound('Challan not found');
  invalidateDashboard();
  logger.info('Challan deleted', { challanNo: challan.challanNo });
  return challan;
}
