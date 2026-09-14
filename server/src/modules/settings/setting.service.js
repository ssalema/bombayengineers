import { Setting } from '../../models/Setting.js';
import { env } from '../../config/env.js';
import { assertStorageEnabled, destroyImage, uploadImage } from '../../utils/cloudinaryAssets.js';

const PUBLIC_FIELDS = ['siteName', 'tagline', 'contactNumber', 'email', 'address', 'logo', 'favicon', 'updatedAt'];

const toPublic = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return Object.fromEntries(PUBLIC_FIELDS.map((k) => [k, k === 'logo' || k === 'favicon' ? { url: obj[k]?.url ?? '' } : obj[k]]));
};

export async function getSettings() {
  return toPublic(await Setting.getSingleton());
}

export async function updateSettings(body) {
  await Setting.getSingleton();
  const doc = await Setting.findOneAndUpdate({}, { $set: body }, { returnDocument: 'after', runValidators: true });
  return toPublic(doc);
}

const TRANSFORMS = {
  // Keep logos crisp for print while capping size; favicons are small squares.
  logo: [{ width: 800, height: 400, crop: 'limit' }, { quality: 'auto', fetch_format: 'png' }],
  favicon: [{ width: 128, height: 128, crop: 'pad', background: 'transparent' }, { fetch_format: 'png' }],
};

export async function uploadAsset(asset, file) {
  assertStorageEnabled();

  const settings = await Setting.getSingleton();
  const previousId = settings[asset]?.publicId;

  const result = await uploadImage(file.buffer, {
    folder: `${env.CLOUDINARY_FOLDER}/branding`,
    transformation: TRANSFORMS[asset],
  });

  settings[asset] = { url: result.secure_url, publicId: result.public_id };
  await settings.save();
  await destroyImage(previousId);

  return toPublic(settings);
}

export async function removeAsset(asset) {
  const settings = await Setting.getSingleton();
  const previousId = settings[asset]?.publicId;
  settings[asset] = { url: '', publicId: '' };
  await settings.save();
  await destroyImage(previousId);
  return toPublic(settings);
}
