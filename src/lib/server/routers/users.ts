import { prisma } from "@/lib/prisma";
import { publicProcedure } from "../trpc";
import { z } from "zod";
import { hasPermissions } from "@/lib/utils";
import uploadFile from "./utils/uploadFile";
import { Permission } from "@/types/global/permission";
import { del } from "@vercel/blob";
import config from "@/lib/config/user.config";
import { type PrismaClient } from "@prisma/client";
import { type User } from "next-auth";

/**
 * User router
 */
export const userRouter = {
  getAllUsersSecure: publicProcedure.mutation(async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        permissions: true,
        roles: true,

        // ignore password
        password: false,
        secret: false,
      },
    });

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
          image: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findFirst({
        where: {
          secret: input.accessToken,
        },
      });
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
      let updatedUser: User | undefined;

      await prisma.$transaction(async (prisma: PrismaClient) => {
        let imageUrl = input.user.image;

        if (imageUrl && imageUrl !== config.default.image) {
          const blob = await uploadFile(user.image, imageUrl);

          if (!blob) {
            throw new Error("Error uploading image");
          }

          imageUrl = blob.url;
        } else {
          imageUrl = config.default.image;
        }

        // Update the user
        updatedUser = await prisma.user.update({
          where: {
            id: input.user.id,
          },
          data: {
            name: input.user.name,
            permissions: {
              set: input.user.permissions,
            },
            roles: {
              set: input.user.roles,
            },
            image: imageUrl,
          },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            permissions: true,
            roles: true,

            // ignore password
            password: false,
            secret: false,
          },
        });

        if (!updatedUser) {
          throw new Error("Error updating user");
        }
      });

      return { user: updatedUser };
    }),

  deleteUser: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await prisma.user.findFirst({
        where: {
          secret: input.accessToken,
        },
      });

      if (!user) {
        throw new Error("Invalid user");
      }

      // If the user is an admin, they can delete any user
      if (!hasPermissions(user, [Permission.ADMIN])) {
        throw new Error("Invalid permissions");
      }

      prisma.$transaction(async (prisma: PrismaClient) => {
        const deletedUser = await prisma.user.delete({
          where: {
            id: input.id,
          },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            permissions: true,
            roles: true,

            // ignore password
            password: false,
            secret: false,
          },
        });

        if (!deletedUser) {
          throw new Error("Error deleting user");
        }

        // delete the user photo from the blob storage
        try {
          await del(deletedUser.image);
        } catch (error) {
          throw new Error("Error deleting user image");
        }
      });

      return {
        user: {
          id: input.id,
        },
      };
    }),
};
