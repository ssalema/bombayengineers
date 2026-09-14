import { z } from 'zod';
import { optionalString, phoneNumber } from '../../utils/validators.js';

export const updateSettingsSchema = z.object({
  siteName: z.string().trim().min(2, 'Site name must be at least 2 characters').max(120, 'Site name is too long'),
  tagline: optionalString(160),
  contactNumber: phoneNumber,
  email: z.preprocess(
    (v) => v ?? '',
    z.union([z.literal(''), z.string().trim().toLowerCase().max(120).email('Enter a valid email address')]),
  ),
  address: optionalString(500),
});

export const assetParamSchema = z.object({
  asset: z.enum(['logo', 'favicon']),
});
