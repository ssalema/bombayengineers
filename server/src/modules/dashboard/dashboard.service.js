import { Challan } from '../../models/Challan.js';
import { Client } from '../../models/Client.js';
import { env } from '../../config/env.js';
import { roundMoney } from '../../utils/query.js';
import { cached } from './dashboard.cache.js';

const TZ = env.APP_TIMEZONE;
const HOURS_14 = 14 * 60 * 60 * 1000; // max timezone offset, keeps the index-friendly range safe

export function getOverview() {
  return cached('overview', async () => {
    const [totalClients, recent, yearly] = await Promise.all([
      Client.estimatedDocumentCount(),
      Challan.find()
        .sort({ date: -1, _id: -1 })
        .limit(6)
        .select('challanNo date clientName client totalAmount')
        .lean(),
      Challan.aggregate([
        { $group: { _id: { $year: { date: '$date', timezone: TZ } }, amount: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, year: '$_id', amount: 1, count: 1 } },
      ]),
    ]);

    // All-time totals are summed from the yearly buckets (one scan).
    return {
      totalAmount: roundMoney(yearly.reduce((sum, y) => sum + y.amount, 0)),
      totalChallans: yearly.reduce((sum, y) => sum + y.count, 0),
      totalClients,
      recentChallans: recent,
      yearly: yearly.map((y) => ({ ...y, amount: roundMoney(y.amount) })),
    };
  });
}

/** Amount and count for each of the 12 months of `year` (application timezone). */
export function getMonthly(year) {
  return cached(`monthly:${year}`, async () => {
    const rangeStart = new Date(Date.UTC(year, 0, 1) - HOURS_14);
    const rangeEnd = new Date(Date.UTC(year + 1, 0, 1) + HOURS_14);

    const rows = await Challan.aggregate([
      { $match: { date: { $gte: rangeStart, $lt: rangeEnd } } },
      { $addFields: { localYear: { $year: { date: '$date', timezone: TZ } }, localMonth: { $month: { date: '$date', timezone: TZ } } } },
      { $match: { localYear: year } },
      { $group: { _id: '$localMonth', amount: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);

    const byMonth = new Map(rows.map((r) => [r._id, r]));
    const months = Array.from({ length: 12 }, (_, i) => {
      const row = byMonth.get(i + 1);
      return { month: i + 1, amount: roundMoney(row?.amount ?? 0), count: row?.count ?? 0 };
    });

    return {
      year,
      months,
      totalAmount: roundMoney(months.reduce((s, m) => s + m.amount, 0)),
      totalChallans: months.reduce((s, m) => s + m.count, 0),
    };
  });
}
