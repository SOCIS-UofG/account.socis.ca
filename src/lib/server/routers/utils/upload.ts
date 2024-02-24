import { type PutBlobResult, del, put } from "@vercel/blob";
import { fileb64ToFile } from "./files";
import { v4 as uuidv4 } from "uuid";
import config from "@/lib/config/user.config";

export default async function uploadFile(
  existingFile: string | null,
  file: string
): Promise<PutBlobResult | null> {
  try {
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
    console.log(e);

    /**
     * If there is an error, return null
     */
    return null;
  }
}
