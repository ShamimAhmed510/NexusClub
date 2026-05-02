import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
const apiKey = process.env["CLOUDINARY_API_KEY"];
const apiSecret = process.env["CLOUDINARY_API_SECRET"];

export const cloudinaryEnabled =
  Boolean(cloudName) && Boolean(apiKey) && Boolean(apiSecret);

if (cloudinaryEnabled) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

export async function uploadToCloudinary(
  base64DataUri: string,
  folder = "mu-portal",
): Promise<string> {
  if (!cloudinaryEnabled) throw new Error("Cloudinary is not configured");
  const result = await cloudinary.uploader.upload(base64DataUri, {
    folder,
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
  return result.secure_url;
}
