import { Prisma } from "@/lib/prisma";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import uploadFile from "./utils/upload";
import { type User } from "next-auth";

export const uploadRouter = {
  uploadImage: publicProcedure
    .input(
      z.object({
        user: z.object({
          secret: z.string(),
          image: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      /**
       * Get the user from the database to check if they already have a image uploaded
       */
      const user = await Prisma.getUserBySecret(input.user.secret);
      if (!user) {
        return { message: "Internal error", user: null, success: false };
      }

      /**
       * Upload the image to the blob storage
       */
      const blob = await uploadFile(user.image, input.user.image);
      if (!blob) {
        return { message: "Internal error", user: null, success: false };
      }

      /**
       * Update the user with the new image url
       */
      const updatedUser = await Prisma.updateUserBySecret(input.user.secret, {
        image: blob.url,
      } as User);

      /**
       * Return the updated user
       */
      updatedUser
        ? { message: "Image uploaded", user: updatedUser, success: true }
        : { message: "Internal error", user: null, success: false };
    }),
};
