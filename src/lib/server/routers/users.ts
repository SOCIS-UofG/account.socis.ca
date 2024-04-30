import { Prisma } from "@/lib/prisma";
import { publicProcedure } from "../trpc";
import { z } from "zod";
import { hasPermissions } from "@/lib/utils";
import { type User } from "next-auth";
import uploadFile from "./utils/uploadFile";
import { Permission } from "@/types/global/permission";
import { del } from "@vercel/blob";
import config from "@/lib/config/user.config";

/**
 * User router
 */
export const userRouter = {
  getAllUsersSecure: publicProcedure.mutation(async () => {
    const users = await Prisma.getAllUsersSecure();

    return { users };
  }),

  /**
   * Update an user
   *
   * @param input - The input object
   * @param input.user - The user to update
   */
  updateUser: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        user: z.object({
          id: z.string(),
          name: z.string().optional(),
          permissions: z.array(z.string()).optional(),
          roles: z.array(z.string()).optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await Prisma.getUserBySecret(input.accessToken);
      if (!user) {
        throw new Error("Invalid user");
      }

      // If the user is an admin, they can update any user
      if (
        !hasPermissions(user, [Permission.ADMIN]) &&
        user.id !== input.user.id
      ) {
        throw new Error("Invalid permissions");
      }

      const updatedUser = await Prisma.updateUserById(input.user.id, {
        name: input.user.name,
        permissions: input.user.permissions,
        roles: input.user.roles,
      } as User);

      return { user: { ...updatedUser, password: undefined } };
    }),

  updateUserProfileImage: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        image: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      /**
       * Get the user from the database to check if they already have a image uploaded
       */
      const user = await Prisma.getUserBySecret(input.accessToken);
      if (!user) {
        throw new Error("Invalid user");
      }

      /**
       * Upload the image to the blob storage
       *
       * input.image is the image to be uploaded.
       *
       * it can be a base64 string, empty string, or the default event image (which is a relative path).
       *
       * we want to make sure that we're not uploading the default image to the blob storage.
       *
       * in the uploadFile function we also check if the image is less than 5mb.
       */
      let imageUrl = input.image;

      if (imageUrl && imageUrl !== config.default.image) {
        const blob = await uploadFile(user.image, input.image);

        if (!blob) {
          throw new Error("Error uploading image");
        }

        imageUrl = blob.url;
      } else {
        imageUrl = config.default.image;
      }

      /**
       * Update the user with the new image url
       */
      const updatedUser = await Prisma.updateUserById(user.id, {
        image: imageUrl,
      } as User);

      if (!updatedUser) {
        throw new Error("Error updating user");
      }

      return { user: { ...updatedUser, password: undefined } };
    }),

  deleteUser: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await Prisma.getUserBySecret(input.accessToken);
      if (!user) {
        throw new Error("Invalid user");
      }

      // If the user is an admin, they can delete any user
      if (!hasPermissions(user, [Permission.ADMIN])) {
        throw new Error("Invalid permissions");
      }

      const deletedUser = await Prisma.deleteUserById(input.id);
      if (!deletedUser) {
        throw new Error("Error deleting user");
      }

      // delete the user photo from the blob storage
      try {
        await del(deletedUser.image);
      } catch (error) {
        throw new Error("Error deleting user image");
      }

      return { user: { ...deletedUser, password: undefined } };
    }),
};
