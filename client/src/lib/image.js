// Client-side downscale + re-encode to JPEG. Re-encoding via canvas strips EXIF
// metadata (incl. GPS location) — a privacy win before the bytes ever leave the device.
export async function compressImage(file, maxDim = 1600, quality = 0.85) {
  if (!file.type.startsWith('image/')) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // fallback: upload as-is

  let { width, height } = bitmap;
  if (Math.max(width, height) > maxDim) {
    const s = maxDim / Math.max(width, height);
    width = Math.round(width * s);
    height = Math.round(height * s);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
  if (!blob) return file;
  const name = (file.name || 'photo').replace(/\.\w+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}
