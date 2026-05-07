import "server-only";
import { createHash, randomUUID } from "node:crypto";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL; // ex: https://pub-xxx.r2.dev

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && bucketName && publicUrl
);

function assertConfigured(): void {
  if (!isR2Configured) {
    throw new Error(
      "Cloudflare R2 não configurado. Preencha CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME e R2_PUBLIC_URL em .env.local."
    );
  }
}

// AWS Signature V4 para R2 (compatível com S3)
function sign(key: Buffer, msg: string): Buffer {
  const { createHmac } = require("node:crypto");
  return createHmac("sha256", key).update(msg).digest();
}

function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = sign(Buffer.from("AWS4" + key), dateStamp);
  const kRegion = sign(kDate, region);
  const kService = sign(kRegion, service);
  return sign(kService, "aws4_request");
}

export interface R2Upload {
  publicUrl: string;
  key: string;
  size: number;
}

export async function uploadToR2(
  buffer: Buffer,
  mime: string,
  folder: string
): Promise<R2Upload> {
  assertConfigured();

  const key = `${folder}/${randomUUID()}.${mime.split("/")[1] ?? "jpg"}`;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${bucketName}/${key}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";

  const { createHash: ch } = require("node:crypto");
  const payloadHash = ch("sha256").update(buffer).digest("hex");

  const canonicalHeaders =
    `content-type:${mime}\n` +
    `host:${accountId}.r2.cloudflarestorage.com\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    `/${bucketName}/${key}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    ch("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const signingKey = getSignatureKey(secretAccessKey!, dateStamp, region, service);
  const signature = sign(signingKey, stringToSign).toString("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": mime,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload ${res.status}: ${text}`);
  }

  return {
    publicUrl: `${publicUrl}/${key}`,
    key,
    size: buffer.length,
  };
}

export async function deleteFromR2(key: string): Promise<void> {
  assertConfigured();

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${bucketName}/${key}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";

  const { createHash: ch } = require("node:crypto");
  const payloadHash = ch("sha256").update("").digest("hex");

  const canonicalHeaders =
    `host:${accountId}.r2.cloudflarestorage.com\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "DELETE",
    `/${bucketName}/${key}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    ch("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const signingKey = getSignatureKey(secretAccessKey!, dateStamp, region, service);
  const signature = sign(signingKey, stringToSign).toString("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`R2 delete ${res.status}: ${text}`);
  }
}
