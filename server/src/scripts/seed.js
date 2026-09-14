/**
 * Seeds the admin user, sample clients, descriptions and ~12 months of challans.
 * `seed:fresh` wipes sample data first (never users or settings). Needs --force in production.
 */
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { ensureAdminUser } from '../modules/auth/auth.service.js';
import { allocateChallanNo } from '../modules/challans/challanNumber.service.js';
import { Challan } from '../models/Challan.js';
import { Client } from '../models/Client.js';
import { Counter } from '../models/Counter.js';
import { Description } from '../models/Description.js';
import { Setting } from '../models/Setting.js';
import { User } from '../models/User.js';
import { CLIENTS, DEFAULT_ADMIN, DESCRIPTIONS, MANUAL_RATE_RANGE } from './seedData.js';

const args = new Set(process.argv.slice(2));
const FRESH = args.has('--fresh');
const FORCE = args.has('--force');

const MONTHS_OF_HISTORY = 12;
const CHALLANS_PER_MONTH = [6, 14];
const ITEMS_PER_CHALLAN = [1, 6];
const NAME_COLLATION = { locale: 'en', strength: 2 };
// Challan times are generated in IST (UTC+5:30), matching the default APP_TIMEZONE.
const IST_OFFSET_MS = 330 * 60 * 1000;

/** Deterministic PRNG (mulberry32) so seeds are repeatable. */
function createRandom(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min, max) => min + Math.floor(next() * (max - min + 1));
  const pick = (list) => list[Math.floor(next() * list.length)];
  const weighted = (list) => {
    let roll = next() * list.reduce((sum, entry) => sum + entry.weight, 0);
    return list.find((entry) => (roll -= entry.weight) < 0) ?? list.at(-1);
  };
  const sample = (list, count) => {
    const pool = [...list];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  };
  return { next, int, pick, weighted, sample };
}

const random = createRandom(20260914);

async function wipe() {
  const [challans, clients, descriptions, counters] = await Promise.all([
    Challan.deleteMany({}),
    Client.deleteMany({}),
    Description.deleteMany({}),
    Counter.deleteMany({ _id: /^challan:/ }),
  ]);
  console.log(
    `🧹 Removed ${challans.deletedCount} challans, ${clients.deletedCount} clients, ` +
      `${descriptions.deletedCount} descriptions, ${counters.deletedCount} counters`,
  );
}

/** Inserts records whose name doesn't exist yet (case-insensitive). */
async function upsertByName(Model, records) {
  let inserted = 0;
  for (const record of records) {
    const result = await Model.updateOne(
      { name: record.name },
      { $setOnInsert: record },
      { upsert: true, collation: NAME_COLLATION },
    );
    inserted += result.upsertedCount;
  }
  return inserted;
}

async function seedClients() {
  const inserted = await upsertByName(
    Client,
    CLIENTS.map(({ name, contactNumber }) => ({ name, contactNumber })),
  );
  console.log(`👥 Clients: ${inserted} added, ${CLIENTS.length - inserted} already present`);

  const docs = await Client.find({ name: { $in: CLIENTS.map((c) => c.name) } })
    .collation(NAME_COLLATION)
    .select('name')
    .lean();
  const byName = new Map(docs.map((doc) => [doc.name.toLowerCase(), doc]));
  return CLIENTS.map((c) => ({ ...byName.get(c.name.toLowerCase()), weight: c.weight }));
}

async function seedDescriptions() {
  const inserted = await upsertByName(
    Description,
    DESCRIPTIONS.map(({ name }) => ({ name })),
  );
  console.log(`📝 Descriptions: ${inserted} added, ${DESCRIPTIONS.length - inserted} already present`);
}

/** Ascending challan dates for the last N months, up to yesterday. */
function buildChallanDates(now = new Date()) {
  const todayIst = new Date(now.getTime() + IST_OFFSET_MS);
  const year = todayIst.getUTCFullYear();
  const month = todayIst.getUTCMonth();
  const yesterday = todayIst.getUTCDate() - 1;

  const dates = [];
  for (let offset = MONTHS_OF_HISTORY - 1; offset >= 0; offset -= 1) {
    const monthStart = new Date(Date.UTC(year, month - offset, 1));
    const daysInMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
    const lastDay = offset === 0 ? yesterday : daysInMonth;
    if (lastDay < 1) continue;

    const target = random.int(...CHALLANS_PER_MONTH);
    const count = Math.max(1, Math.round((target * lastDay) / daysInMonth));
    for (let i = 0; i < count; i += 1) {
      const istWallClock = Date.UTC(
        monthStart.getUTCFullYear(),
        monthStart.getUTCMonth(),
        random.int(1, lastDay),
        random.int(10, 18),
        random.int(0, 59),
      );
      dates.push(new Date(istWallClock - IST_OFFSET_MS));
    }
  }
  return dates.sort((a, b) => a - b);
}

function buildItems() {
  const count = random.int(...ITEMS_PER_CHALLAN);
  return random.sample(DESCRIPTIONS, count).map((d) => {
    const rate =
      d.typicalRate === null
        ? Math.round(random.int(...MANUAL_RATE_RANGE) / 50) * 50
        : // Occasionally negotiate the price a little (±10%, rounded to ₹10).
          random.next() < 0.2
          ? Math.round((d.typicalRate * (0.9 + random.next() * 0.2)) / 10) * 10
          : d.typicalRate;
    return { description: d.name, qty: random.int(1, d.maxQty), rate };
  });
}

async function seedChallans(clients, adminId) {
  const existing = await Challan.estimatedDocumentCount();
  if (existing > 0) {
    console.log(`🧾 Challans: skipped, ${existing} already exist (use npm run seed:fresh to replace)`);
    return;
  }

  const dates = buildChallanDates();
  let total = 0;
  for (const date of dates) {
    const client = random.weighted(clients);
    const challanNo = await allocateChallanNo(date);
    const challan = await Challan.create({
      challanNo,
      date,
      client: client._id,
      clientName: client.name,
      items: buildItems(),
      createdBy: adminId,
      createdAt: date,
      updatedAt: date,
    });
    total += challan.totalAmount;
  }
  console.log(
    `🧾 Challans: ${dates.length} added across ${MONTHS_OF_HISTORY} months, ` +
      `total ₹${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
  );
}

async function run() {
  if (env.isProduction && !FORCE) {
    console.error('Refusing to seed a production database. Re-run with --force if you really mean it.');
    process.exit(1);
  }

  await connectDatabase();
  try {
    if (FRESH) await wipe();
    const [adminCreated] = await Promise.all([ensureAdminUser(DEFAULT_ADMIN), Setting.getSingleton()]);

    const admin = await User.findOne().sort({ createdAt: 1 }).select('_id username').lean();
    console.log(
      adminCreated
        ? `👤 Admin user created: ${DEFAULT_ADMIN.username} / ${DEFAULT_ADMIN.password} (change it after signing in)`
        : `👤 Admin user: ${admin.username}`,
    );

    await seedDescriptions();
    const clients = await seedClients();
    await seedChallans(clients, admin._id);
    console.log('✅ Seed complete');
  } finally {
    await disconnectDatabase();
  }
}

run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
