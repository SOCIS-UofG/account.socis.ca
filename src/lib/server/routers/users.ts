import { Prisma } from "@/lib/prisma";
import { publicProcedure } from "../trpc";
import { z } from "zod";
import { hasPermissions } from "@/lib/utils";
import { Permission } from "@/types";
import { type User } from "next-auth";
import uploadFile from "./utils/upload";

/**
 * User router
 */
export const userRouter = {
  getAllUsers: publicProcedure.mutation(async () => {
    const users = await Prisma.getAllUsersSecure();
    return { users, success: true };
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
        return { success: false, user: null, message: "Invalid user" };
      }

      // If the user is an admin, they can update any user
      if (
        !hasPermissions(user, [Permission.ADMIN]) &&
        user.id !== input.user.id
      ) {
        return { success: false, user: null, message: "Unauthorized" };
      }

      const updatedUser = await Prisma.updateUserById(input.user.id, {
        name: input.user.name,
        permissions: input.user.permissions,
        roles: input.user.roles,
      } as User);

      return { success: true, user: updatedUser, message: "User updated" };
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
        return { message: "Internal error", user: null, success: false };
      }

      /**
       * Upload the image to the blob storage
       */
      const blob = await uploadFile(user.image, input.image);
      if (!blob) {
        return { message: "Internal error", user: null, success: false };
      }

      /**
       * Update the user with the new image url
       */
      const updatedUser = await Prisma.updateUserById(user.id, {
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
