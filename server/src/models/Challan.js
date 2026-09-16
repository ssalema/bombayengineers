import mongoose from 'mongoose';
import { roundMoney } from '../utils/query.js';

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 300 },
    qty: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const challanSchema = new mongoose.Schema(
  {
    challanNo: { type: String, required: true, trim: true, uppercase: true },
    date: { type: Date, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    // Client name at creation, so old challans stay accurate and searchable.
    clientName: { type: String, required: true, trim: true, maxlength: 120 },
    items: {
      type: [itemSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'At least one item is required'],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    notes: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false },
);

challanSchema.index({ challanNo: 1 }, { unique: true });
// The _id tie-breaker must be in the index, or MongoDB sorts in memory.
challanSchema.index({ date: -1, _id: -1 });
challanSchema.index({ client: 1, date: -1, _id: -1 });
challanSchema.index({ clientName: 1, _id: 1 });

// Server is the source of truth for all money calculations.
challanSchema.pre('validate', function computeTotals() {
  let total = 0;
  for (const item of this.items) {
    item.amount = roundMoney(item.qty * item.rate);
    total += item.amount;
  }
  this.totalAmount = roundMoney(total);
});

export const Challan = mongoose.model('Challan', challanSchema);
