import { Prisma } from "@/lib/prisma";
import { publicProcedure } from "../trpc";
import { z } from "zod";
import { hasPermissions } from "@/lib/utils";
import { type User } from "next-auth";
import uploadFile from "./utils/upload";
import { Permission } from "@/types/global/permission";

/**
 * User router
 */
export const userRouter = {
  getAllUsers: publicProcedure.mutation(async () => {
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
      })
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

      return { user: updatedUser };
    }),

  updateUserProfileImage: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        image: z.string(),
      })
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
       */
      const blob = await uploadFile(user.image, input.image);
      if (!blob) {
        throw new Error("Error uploading image");
      }

      /**
       * Update the user with the new image url
       */
      const updatedUser = await Prisma.updateUserById(user.id, {
        image: blob.url,
      } as User);

      if (!updatedUser) {
        throw new Error("Error updating user");
      }

      return { user: updatedUser };
    }),
};
