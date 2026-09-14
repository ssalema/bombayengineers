import { Counter } from '../../models/Counter.js';
import { Challan } from '../../models/Challan.js';
import { CHALLAN_PREFIX, CHALLAN_SEQUENCE_LENGTH } from '../../constants/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { toFinancialYear, toYYMM } from '../../utils/timezone.js';

const MAX_SEQUENCE = 10 ** CHALLAN_SEQUENCE_LENGTH - 1;

// Format "BEYYMM00000"; the sequence runs per financial year and restarts every April.
const counterKey = (fy) => `challan:FY${fy.key}`;
const format = (yymm, seq) => `${CHALLAN_PREFIX}${yymm}${String(seq).padStart(CHALLAN_SEQUENCE_LENGTH, '0')}`;

/** Highest sequence already used in a financial year, read from the challans themselves. */
async function highestExistingSequence(fy) {
  const pattern = new RegExp(`^${CHALLAN_PREFIX}(${fy.months.join('|')})\\d{${CHALLAN_SEQUENCE_LENGTH}}$`);
  const [result] = await Challan.aggregate([
    { $match: { challanNo: pattern } },
    {
      $group: {
        _id: null,
        seq: { $max: { $toInt: { $substrCP: ['$challanNo', CHALLAN_PREFIX.length + 4, CHALLAN_SEQUENCE_LENGTH] } } },
      },
    },
  ]);
  return result?.seq ?? 0;
}

/** Raises the financial-year counter to at least the highest number already in use. */
async function syncCounter(fy) {
  const highest = await highestExistingSequence(fy);
  try {
    await Counter.updateOne({ _id: counterKey(fy) }, { $max: { seq: highest } }, { upsert: true });
  } catch (err) {
    // A concurrent request created the counter first; retry as a plain update.
    if (err?.code !== 11000) throw err;
    await Counter.updateOne({ _id: counterKey(fy) }, { $max: { seq: highest } });
  }
}

/** Preview of the next number (not reserved). The real number is allocated on save. */
export async function peekNextChallanNo(date = new Date()) {
  const fy = toFinancialYear(date);
  const counter = await Counter.findById(counterKey(fy)).lean();
  // The counter is authoritative once it exists; scan challans only for the first one of the year.
  const seq = counter ? counter.seq : await highestExistingSequence(fy);
  return format(toYYMM(date), seq + 1);
}

/** Atomically allocates the next challan number for the financial year of `date`. */
export async function allocateChallanNo(date) {
  const fy = toFinancialYear(date);

  // First challan of the year: seed the counter from existing challans so numbers are never reused.
  if (!(await Counter.exists({ _id: counterKey(fy) }))) {
    await syncCounter(fy);
  }

  const counter = await Counter.findOneAndUpdate(
    { _id: counterKey(fy) },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  ).lean();

  if (counter.seq > MAX_SEQUENCE) {
    throw ApiError.conflict(`Challan limit reached for financial year 20${fy.key.slice(0, 2)}-${fy.key.slice(2)}`);
  }
  return format(toYYMM(date), counter.seq);
}

/** Re-aligns a counter with existing data (e.g. after a restore that skipped counters). */
export async function resyncCounter(date) {
  await syncCounter(toFinancialYear(date));
}
