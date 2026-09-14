/** Syncs schema indexes with the database. Run after schema changes: `npm run db:indexes` */
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import '../models/Challan.js';
import '../models/Client.js';
import '../models/Counter.js';
import '../models/Description.js';
import '../models/RefreshToken.js';
import '../models/Setting.js';
import '../models/User.js';

async function main() {
  await connectDatabase();
  for (const model of Object.values(mongoose.models)) {
    const dropped = await model.syncIndexes();
    console.log(`✔ ${model.collection.name}${dropped.length ? ` (dropped: ${dropped.join(', ')})` : ''}`);
  }
}

main()
  .catch((err) => {
    console.error('Index sync failed:', err);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
