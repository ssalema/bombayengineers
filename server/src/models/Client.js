import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    contactNumber: { type: String, trim: true, maxlength: 20, default: '' },
  },
  { timestamps: true, versionKey: false },
);

// Case-insensitive uniqueness on client name.
clientSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
clientSchema.index({ createdAt: -1, _id: -1 });

export const Client = mongoose.model('Client', clientSchema);
