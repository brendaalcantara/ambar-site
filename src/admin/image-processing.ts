export const MAX_INPUT_BYTES = 15 * 1024 * 1024;
export const MAX_INPUT_PIXELS = 40_000_000;
export const MAX_OUTPUT_SIDE = 1600;
export const OUTPUT_QUALITY = 0.82;
export const MAX_OUTPUT_BYTES = 1 * 1024 * 1024;

export type ImageValidationResult = {
  width: number;
  height: number;
};

export type CropRatio = "original" | "1:1" | "4:5" | "4:3";

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const acceptedExtensions = /\.(jpe?g|png|webp)$/i;

const isHeic = (file: File) => {
  const name = file.name.toLowerCase();
  return file.type === "image/heic" || file.type === "image/heif" || /\.(heic|heif)$/.test(name);
};

const decodeImage = async (file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> => {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Safari versions without imageOrientation support use the HTML image fallback below.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new ImageProcessingError("Não foi possível ler a imagem."));
      element.src = url;
    });
    return { source: image, width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const validateImageFile = async (file: File): Promise<ImageValidationResult> => {
  if (isHeic(file)) {
    throw new ImageProcessingError("HEIC ainda não é aceito. Exporte a foto como JPEG, PNG ou WebP antes de enviar.");
  }
  if (!acceptedTypes.has(file.type) && !acceptedExtensions.test(file.name)) {
    throw new ImageProcessingError("Use uma imagem JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageProcessingError("A imagem excede 15 MB. Reduza o arquivo antes de enviar.");
  }
  const decoded = await decodeImage(file);
  try {
    if (!decoded.width || !decoded.height || decoded.width * decoded.height > MAX_INPUT_PIXELS) {
      throw new ImageProcessingError("A imagem excede o limite de 40 megapixels.");
    }
    return { width: decoded.width, height: decoded.height };
  } finally {
    decoded.close?.();
  }
};

const ratioValue = (ratio: CropRatio, sourceRatio: number) => {
  if (ratio === "1:1") return 1;
  if (ratio === "4:5") return 4 / 5;
  if (ratio === "4:3") return 4 / 3;
  return sourceRatio;
};

const cropSource = (width: number, height: number, ratio: number, focusX: number, focusY: number) => {
  const sourceRatio = width / height;
  let cropWidth = width;
  let cropHeight = height;
  if (sourceRatio > ratio) cropWidth = height * ratio;
  if (sourceRatio < ratio) cropHeight = width / ratio;
  const maxX = width - cropWidth;
  const maxY = height - cropHeight;
  return {
    x: Math.min(maxX, Math.max(0, (focusX / 100) * width - cropWidth / 2)),
    y: Math.min(maxY, Math.max(0, (focusY / 100) * height - cropHeight / 2)),
    width: cropWidth,
    height: cropHeight,
  };
};

const blobToFile = (blob: Blob, originalName: string) => {
  const stem = originalName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "catalogo";
  const unique = typeof crypto?.randomUUID === "function" ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return new File([blob], `${stem}-${unique}.webp`, { type: "image/webp", lastModified: Date.now() });
};

export const processImageFile = async (
  file: File,
  options: { focusX?: number; focusY?: number; ratio?: CropRatio } = {},
): Promise<File> => {
  await validateImageFile(file);
  const decoded = await decodeImage(file);
  try {
    const focusX = Math.min(100, Math.max(0, options.focusX ?? 50));
    const focusY = Math.min(100, Math.max(0, options.focusY ?? 50));
    const ratio = ratioValue(options.ratio ?? "original", decoded.width / decoded.height);
    const crop = cropSource(decoded.width, decoded.height, ratio, focusX, focusY);
    const scale = Math.min(1, MAX_OUTPUT_SIDE / Math.max(crop.width, crop.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(crop.width * scale));
    canvas.height = Math.max(1, Math.round(crop.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new ImageProcessingError("O navegador não disponibilizou o processamento de imagem.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(decoded.source, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
    let blob: Blob | undefined;
    for (const quality of [OUTPUT_QUALITY, 0.72, 0.62, 0.52]) {
      const candidate = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          output => (output ? resolve(output) : reject(new ImageProcessingError("Não foi possível converter a imagem para WebP."))),
          "image/webp",
          quality,
        );
      });
      blob = candidate;
      if (candidate.size <= MAX_OUTPUT_BYTES) break;
    }
    if (!blob || blob.size > MAX_OUTPUT_BYTES) throw new ImageProcessingError("A imagem processada ainda excede 1 MB; tente uma foto menor.");
    return blobToFile(blob, file.name);
  } finally {
    decoded.close?.();
  }
};

export const fileSizeLabel = (bytes: number) => `${(bytes / 1024).toFixed(bytes < 1024 * 1024 ? 0 : 1)} KB`;
