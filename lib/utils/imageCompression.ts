/**
 * Utility kompresi gambar client-side untuk upload cepat di perangkat mobile.
 */

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function compressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<File> {
  // Jika file bukan gambar yang didukung, kembalikan apa adanya
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return file;
  }

  // Jika ukuran sudah kecil (< 400KB), tidak perlu re-compress kecuali jika resolusi berpotensi raksasa
  if (file.size < 400 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    // Jalankan hanya di environment browser
    if (typeof window === 'undefined') {
      resolve(file);
      return;
    }

    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Hitung aspek rasio agar tidak terdistorsi
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Gambar ke canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Ekspor sebagai JPEG terkompresi
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const compressedFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          // Gunakan file yang lebih kecil
          resolve(compressedFile.size < file.size ? compressedFile : file);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
