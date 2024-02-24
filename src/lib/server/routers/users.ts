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
      if (
        !hasPermissions(user, [Permission.ADMIN]) &&
        user.id !== input.user.id
      ) {
        return { success: false, user: null };
      }

      const updatedUser = await Prisma.updateUserById(input.user.id, {
        name: input.user.name,
        permissions: input.user.permissions,
        roles: input.user.roles,
      } as User);

      return { success: true, user: updatedUser };
    }),
};
