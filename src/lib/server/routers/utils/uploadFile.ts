import { type PutBlobResult, del, put } from "@vercel/blob";
import { fileb64ToFile } from "./fileb64ToFile";
import { v4 as uuidv4 } from "uuid";
import config from "@/lib/config/user.config";

export default async function uploadFile(
  existingFile: string | null,
  file: string,
): Promise<PutBlobResult | null> {
  try {
    if (!file) {
      return null;
    }

    // verify file size is less than 5MB
    const fileSize = Buffer.byteLength(file, "base64");
    if (fileSize > 5 * 1024 * 1024) {
      return null;
    }

    /**
     * Delete the old file if it exists
     *
     * This is to prevent the blob storage from filling up with old files
     */
    if (existingFile && existingFile !== config.default.image) {
      await del(existingFile);
    }

    /**
     * Convert the base64 string to a file
     */
    const fileId = uuidv4();
    const fileObj = await fileb64ToFile(file, fileId);

    /**
     * Upload the fileObj to the blob storage
     */
    return await put(fileId, fileObj, {
      access: "public",
    });
  } catch (e) {
    return null;
  }
}
