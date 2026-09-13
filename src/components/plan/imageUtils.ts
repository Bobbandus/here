// Läser en bildfil och skalar ner den till en JPEG data-URL innan den sparas i
// projektet (localStorage har begränsat utrymme). Allt sker lokalt i webbläsaren.

const MAX_DIM = 480;
const QUALITY = 0.82;

export function readAndResizeImage(file: File, maxDim = MAX_DIM, quality = QUALITY): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Kunde inte läsa filen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Kunde inte läsa bilden'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Kunde inte skapa canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
