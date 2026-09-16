const EXTENSION_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  ico: 'image/x-icon',
};

// Formats the browser can decode and re-encode on a canvas.
const RESIZABLE = ['image/png', 'image/jpeg', 'image/webp'];

/** Some Android pickers and file managers report an empty MIME type; fall back to the extension. */
function withType(file) {
  if (file.type) return file;
  const type = EXTENSION_TYPES[file.name.split('.').pop()?.toLowerCase()];
  return type ? new File([file], file.name, { type, lastModified: file.lastModified }) : file;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Normalises a picked image for upload. Phone camera photos are often 3–6 MB and several
 * thousand pixels wide, so larger images are downscaled in the browser to fit `maxBytes`.
 * PNG/WEBP stay PNG to keep transparency; JPEG stays JPEG. Other types pass through unchanged.
 */
export async function prepareImageUpload(file, { maxBytes, maxDimension }) {
  const typed = withType(file);
  if (!RESIZABLE.includes(typed.type)) return typed;

  let img;
  try {
    img = await loadImage(typed);
  } catch {
    return typed; // Undecodable here; let the server validate it.
  }
  const largestSide = Math.max(img.naturalWidth, img.naturalHeight);
  if (typed.size <= maxBytes && largestSide <= maxDimension) return typed;

  const outputType = typed.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const baseName = typed.name.replace(/\.[^.]+$/, '') || 'image';
  const extension = outputType === 'image/jpeg' ? 'jpg' : 'png';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let scale = Math.min(1, maxDimension / largestSide);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (outputType === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // eslint-disable-next-line no-await-in-loop
    const blob = await toBlob(canvas, outputType, 0.88);
    if (blob && blob.size <= maxBytes) {
      return new File([blob], `${baseName}.${extension}`, { type: outputType, lastModified: Date.now() });
    }
    scale *= 0.75;
  }
  return typed; // Could not shrink enough; the caller's size check reports it.
}
