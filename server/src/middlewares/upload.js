import multer from 'multer';
import { UPLOAD } from '../constants/index.js';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.memoryStorage();

const imageUpload = multer({
  storage,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!UPLOAD.IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Only PNG, JPG, WEBP or ICO images are allowed', [
        { field: file.fieldname, message: 'Unsupported file type' },
      ]));
    }
    return cb(null, true);
  },
});

/** Magic-byte signatures: MIME types from the browser can be spoofed. */
const SIGNATURES = [
  { mime: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'ico', bytes: [0x00, 0x00, 0x01, 0x00] },
];

function hasValidSignature(buffer) {
  if (!buffer || buffer.length < 12) return false;
  const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (isWebp) return true;
  return SIGNATURES.some(({ bytes }) => bytes.every((b, i) => buffer[i] === b));
}

/** Accepts a single image under `fieldName` and verifies its binary signature. */
export const singleImage = (fieldName) => [
  imageUpload.single(fieldName),
  (req, _res, next) => {
    if (!req.file) {
      return next(ApiError.badRequest('Please select an image to upload', [{ field: fieldName, message: 'File is required' }]));
    }
    if (!hasValidSignature(req.file.buffer)) {
      return next(ApiError.badRequest('The uploaded file is not a valid image', [{ field: fieldName, message: 'Invalid image file' }]));
    }
    return next();
  },
];
