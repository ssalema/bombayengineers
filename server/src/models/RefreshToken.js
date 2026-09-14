import mongoose from 'mongoose';

/**
 * One document per login session. Only the token's SHA-256 hash is stored.
 * Tokens rotate on every refresh.
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
    userAgent: { type: String, maxlength: 300 },
    ip: { type: String, maxlength: 60 },
  },
  { timestamps: true },
);

// TTL index: MongoDB removes expired sessions automatically.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
