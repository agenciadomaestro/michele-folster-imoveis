import { supabase } from "@/integrations/supabase/client";
export const PHOTO_MAX_WIDTH = 1280;
export const PHOTO_QUALITY = 0.8;
export const PHOTO_TARGET_BYTES = 250 * 1024;
export function imageDimensions(width: number, height: number) {
  const scale = Math.min(1, PHOTO_MAX_WIDTH / width);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
export async function convertPhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const size = imageDimensions(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível converter a imagem");
    ctx.drawImage(image, 0, 0, size.width, size.height);
    const encode = () =>
      new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) =>
            blob?.type === "image/webp"
              ? resolve(blob)
              : reject(new Error("Conversão WebP indisponível neste navegador")),
          "image/webp",
          PHOTO_QUALITY,
        ),
      );
    let blob = await encode();
    // Keep quality fixed at 0.80; reduce dimensions only when needed to meet the weight target.
    while (blob.size > PHOTO_TARGET_BYTES && canvas.width > 320) {
      const copy = document.createElement("canvas");
      copy.width = canvas.width;
      copy.height = canvas.height;
      copy.getContext("2d")?.drawImage(canvas, 0, 0);
      canvas.width = Math.round(canvas.width * 0.85);
      canvas.height = Math.max(1, Math.round(canvas.height * 0.85));
      ctx.drawImage(copy, 0, 0, canvas.width, canvas.height);
      blob = await encode();
    }
    if (blob.size > PHOTO_TARGET_BYTES) throw new Error("Imagem muito grande após a compressão");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function uploadPropertyPhoto(propertyId: string, file: File) {
  const blob = await convertPhoto(file);
  const path = `${propertyId}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from("property-images")
    .upload(path, blob, { contentType: "image/webp", upsert: false });
  if (error) throw new Error(error.message);
  return { storage_path: path, url: `/api/public/property-image?path=${encodeURIComponent(path)}` };
}
