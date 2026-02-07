/**
 * Compresse une image (fichier) pour envoi : redimensionnement + JPEG qualité 0.85.
 * Réduit fortement la taille (ex. 4 Mo → ~200 Ko) pour limiter la consommation data/batterie sur le terrain.
 * @param {File} file - Fichier image (image/*)
 * @param {Object} options - { maxWidth: number, maxHeight: number, quality: number }
 * @returns {Promise<string>} - Data URL JPEG (data:image/jpeg;base64,...)
 */
export function compressImageForUpload(file, options = {}) {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.85 } = options;
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Fichier image requis'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onerror = () => reject(new Error('Chargement de l’image impossible'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const r = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * r);
            height = Math.round(height * r);
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (e) {
          reject(e);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
