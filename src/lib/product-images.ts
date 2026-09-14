// Admin-side product image uploads into the private `product-images` bucket.
// Uploaded files are served publicly through /api/public/product-image/<path>.
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "product-images";

export function isImageFile(f: File): boolean {
  return f.type.startsWith("image/");
}

function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "png";
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image";
  return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/** Uploads one image and returns its public app URL. Throws on failure. */
export async function uploadProductImage(file: File, folder = "products"): Promise<string> {
  if (!isImageFile(file)) throw new Error(`${file.name} is not an image`);
  const path = `${folder}/${safeName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || "image/png",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return `/api/public/product-image/${path}`;
}

export async function uploadProductImages(files: File[], folder = "products"): Promise<string[]> {
  const out: string[] = [];
  for (const f of files) out.push(await uploadProductImage(f, folder));
  return out;
}
