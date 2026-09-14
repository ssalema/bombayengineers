import { Client } from '../../models/Client.js';
import { Challan } from '../../models/Challan.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildPaginationMeta, escapeRegex, indexedSort } from '../../utils/query.js';
import { invalidateDashboard } from '../dashboard/dashboard.cache.js';

const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

function searchFilter(search) {
  if (!search) return {};
  const regex = new RegExp(escapeRegex(search), 'i');
  return { $or: [{ name: regex }, { contactNumber: regex }] };
}

/** Challan count + total amount per client, computed only for the requested ids. */
async function statsForClients(ids) {
  if (!ids.length) return new Map();
  const rows = await Challan.aggregate([
    { $match: { client: { $in: ids } } },
    { $group: { _id: '$client', challanCount: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' }, lastChallanAt: { $max: '$date' } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

export async function listClients({ page, limit, search, sort, order }) {
  const filter = searchFilter(search);
  const [items, total] = await Promise.all([
    indexedSort(Client.find(filter), { sort, order })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Client.countDocuments(filter),
  ]);

  const stats = await statsForClients(items.map((c) => c._id));
  const data = items.map((c) => {
    const s = stats.get(String(c._id));
    return { ...c, challanCount: s?.challanCount ?? 0, totalAmount: s?.totalAmount ?? 0, lastChallanAt: s?.lastChallanAt ?? null };
  });

  return { data, meta: buildPaginationMeta({ page, limit, total }) };
}

export async function clientOptions({ search }) {
  return Client.find(searchFilter(search))
    .collation(CASE_INSENSITIVE)
    .sort({ name: 1 })
    .limit(25)
    .select('name contactNumber')
    .lean();
}

export async function getClient(id) {
  const client = await Client.findById(id).lean();
  if (!client) throw ApiError.notFound('Client not found');
  const stats = (await statsForClients([client._id])).get(String(client._id));
  return { ...client, challanCount: stats?.challanCount ?? 0, totalAmount: stats?.totalAmount ?? 0, lastChallanAt: stats?.lastChallanAt ?? null };
}

async function assertUniqueName(name, excludeId) {
  const exists = await Client.findOne({ name, ...(excludeId && { _id: { $ne: excludeId } }) })
    .collation(CASE_INSENSITIVE)
    .select('_id')
    .lean();
  if (exists) {
    throw ApiError.conflict('A client with this name already exists', [{ field: 'name', message: 'Client name already exists' }]);
  }
}

export async function createClient(body) {
  await assertUniqueName(body.name);
  const client = await Client.create(body);
  invalidateDashboard();
  return { ...client.toObject(), challanCount: 0, totalAmount: 0, lastChallanAt: null };
}

export async function updateClient(id, body) {
  await assertUniqueName(body.name, id);
  const client = await Client.findByIdAndUpdate(id, body, { returnDocument: 'after', runValidators: true }).lean();
  if (!client) throw ApiError.notFound('Client not found');

  // Sync the client name snapshot on challans; only outdated ones are written.
  const { modifiedCount } = await Challan.updateMany(
    { client: client._id, clientName: { $ne: client.name } },
    { clientName: client.name },
  );
  if (modifiedCount) invalidateDashboard();
  return client;
}

export async function deleteClient(id) {
  const hasChallans = await Challan.exists({ client: id });
  if (hasChallans) {
    throw ApiError.conflict('This client has challans and cannot be deleted. Delete their challans first.');
  }
  const client = await Client.findByIdAndDelete(id).lean();
  if (!client) throw ApiError.notFound('Client not found');
  invalidateDashboard();
  return client;
}
