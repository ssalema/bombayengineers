import mongoose from 'mongoose';
import { SETTINGS_KEY } from '../constants/index.js';

const assetSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  { _id: false },
);

/** Singleton document holding site-wide configuration. */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: SETTINGS_KEY, unique: true },
    siteName: { type: String, trim: true, maxlength: 120, default: '' },
    tagline: { type: String, trim: true, maxlength: 160, default: '' },
    contactNumber: { type: String, trim: true, maxlength: 40, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, default: '' },
    address: { type: String, trim: true, maxlength: 500, default: '' },
    logo: { type: assetSchema, default: () => ({}) },
    favicon: { type: assetSchema, default: () => ({}) },
  },
  { timestamps: true, versionKey: false },
);

settingSchema.statics.getSingleton = async function getSingleton() {
  return this.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
};

export const Setting = mongoose.model('Setting', settingSchema);
