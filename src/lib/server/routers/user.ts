import { Prisma } from "@/lib/prisma";
import { publicProcedure } from "../trpc";
import { z } from "zod";
import { hasPermissions } from "@/lib/utils";
import { Permission } from "@/types";
import { type User } from "next-auth";

/**
 * User router
 */
export const userRouter = {
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
          secret: z.string(),
          name: z.string(),
          permissions: z.array(z.string()).optional(),
          roles: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const user = await Prisma.getUserBySecret(input.accessToken);
      if (!user) {
        return { success: false, user: null };
      }

      // If the user is an admin, they can update any user
      if (hasPermissions(user, [Permission.ADMIN])) {
        const res = await Prisma.updateUserBySecret(
          user.secret,
          input.user as User
        );

        if (!res) {
          return { success: false, user: null };
        }

        return { success: true, user: input.user };
      }

      // If the user is not an admin, they can only update their own user
      if (user.secret !== input.user.secret) {
        return { success: false, user: null };
      }

      const res = await Prisma.updateUserBySecret(
        user.secret,
        input.user as User
      );

      if (!res) {
        return { success: false, user: null };
      }

      return { success: true, user: input.user };
    }),
};
