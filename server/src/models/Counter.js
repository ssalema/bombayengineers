import mongoose from 'mongoose';

/** Atomic sequence store, e.g. { _id: 'challan:FY2627', seq: 12 } (financial year 2026-27). */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false },
);

export const Counter = mongoose.model('Counter', counterSchema);
