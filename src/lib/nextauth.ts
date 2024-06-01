import NextAuth from "next-auth";
import { prisma } from "./prisma";

const { hostname } = new URL(
  process.env.NEXTAUTH_URL ?? "http://localhost:3000",
);
const ROOT_DOMAIN = hostname
  .split(".")
  .reverse()
  .splice(0, 2)
  .reverse()
  .join(".");
const IS_SECURE = process.env.NODE_ENV !== "development";

export const handler = NextAuth({
  pages: {
    signIn: "/signin",
  },

  // work across sub domains
  cookies: {
    sessionToken: {
      name: IS_SECURE
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: `.${ROOT_DOMAIN}`, // Note the dot
        secure: IS_SECURE,
      },
    },
  },

  callbacks: {
    async session({ session }) {
      const user = await prisma.user.findFirst({
        where: {
          email: session.user.email,
        },
      });

      if (!user) {
        throw new Error("Failed to fetch user");
      }

      return {
        ...session,
        user,
      };
    },
  },

  providers: [],
});
