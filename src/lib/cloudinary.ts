import "server-only";
import { createHash, createHmac } from "node:crypto";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

function assertConfigured(): void {
  if (!isCloudinaryConfigured) {
    throw new Error(
      "Cloudinary não configurado. Preencha CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET em .env.local."
    );
  }
}

export interface CloudinaryUpload {
  publicUrl: string;
  publicId: string;
  size: number;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  mime: string,
  folder: string
): Promise<CloudinaryUpload> {
  assertConfigured();

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha256")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  const fd = new FormData();
  fd.append("file", new Blob([new Uint8Array(buffer)], { type: mime }));
  fd.append("api_key", apiKey!);
  fd.append("timestamp", timestamp);
  fd.append("folder", folder);
  fd.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: fd }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    publicUrl: data.secure_url,
    publicId: data.public_id,
    size: data.bytes,
  };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  assertConfigured();

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash("sha256")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  const fd = new FormData();
  fd.append("public_id", publicId);
  fd.append("api_key", apiKey!);
  fd.append("timestamp", timestamp);
  fd.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body: fd }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary delete ${res.status}: ${text}`);
  }
}
