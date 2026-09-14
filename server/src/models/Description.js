import mongoose from 'mongoose';

const descriptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },  },
  { timestamps: true, versionKey: false },
);

descriptionSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
descriptionSchema.index({ createdAt: -1, _id: -1 });

export const Description = mongoose.model('Description', descriptionSchema);
