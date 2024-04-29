"use client";

import Link from "next/link";
import Image from "next/image";
import { BrowserView } from "react-device-detect";
import { SessionProvider, useSession } from "next-auth/react";
import { userConfig } from "@/lib/config";
import Navbar from "@/components/ui/global/Navbar";
import CustomCursor from "@/components/ui/global/CustomCursor";
import { NextUIProvider } from "@nextui-org/system";
import MainWrapper from "@/components/ui/global/MainWrapper";
import { Spinner } from "@nextui-org/spinner";
import { Button } from "@nextui-org/button";
import { hasPermissions } from "@/lib/utils";
import { Permission } from "@/types/global/permission";
import UpdateNameField from "@/components/ui/UpdateNameField";
import UpdateImageField from "@/components/ui/UpdateImageField";

/**
 * Wraps the main components in a session provider for next auth.
 * @returns JSX.Element
 */
export default function AccountPage() {
  return (
    <NextUIProvider>
      <Navbar />

      <BrowserView>
        <CustomCursor />
      </BrowserView>

      <SessionProvider>
        <Components />
      </SessionProvider>
    </NextUIProvider>
  );
}

/**
 * The main components for the account page. These are to be wrapped in a session provider
 * for next auth.
 *
 * @returns JSX.Element
 */
function Components(): JSX.Element {
  const { data: session, status } = useSession();

  /**
   * If the user is currently being authenticated, display a loading spinner.
   */
  if (status === "loading") {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center p-12">
        <Spinner color="primary" size="lg" />
      </MainWrapper>
    );
  }

  /**
   * If the user is not authenticated, display an error message.
   *
   * The error message includes a button for the user to properly sign in.
   */
  if (status === "unauthenticated" || !session) {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center p-12">
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Session
        </h1>

        <div className="flex flex-col gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            Please sign in to view your account.
          </p>
          <Button
            as={Link}
            href="https://auth.socis.ca/signin"
            color="default"
            className="w-fit"
          >
            Sign In
          </Button>
        </div>
      </MainWrapper>
    );
  }

  return (
    <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center px-12 pb-20 pt-36 lg:px-20 lg:pt-40">
      <div className="flex flex-col items-start justify-start gap-4 rounded-xl border border-neutral-700/50 p-12">
        {/**
         * USER INFO
         *
         * The user info section displays the user's name and email.
         */}
        <div className="flex w-full flex-row items-center justify-start gap-2">
          <Image
            src={session.user.image || userConfig.default.image}
            alt="..."
            width={75}
            height={75}
            className="rounded-full"
          />

          <div className="flex flex-col items-start justify-start gap-1">
            <h1 className="text-left text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Welcome, {session.user.name.split(" ")[0]}
            </h1>

            <p className="text-left text-sm font-light text-white/80">
              {session.user.name} -- {session.user.email}
            </p>
          </div>
        </div>

        {/**
         * Show the users permissions and roles
         */}
        <div className="mt-2 flex w-full flex-wrap gap-3">
          {session.user.permissions.map((permission) => (
            <div className="w-fit rounded-md border border-primary bg-emerald-950/50 px-2 py-1 text-xs font-thin text-white">
              {permission}
            </div>
          ))}

          {session.user.roles.map((role) => (
            <div className="w-fit rounded-md border border-primary bg-emerald-950/50 px-2 py-1 text-xs font-thin text-white">
              {role}
            </div>
          ))}
        </div>

        {/**
         * SETTINGS
         *
         * The settings section allows the user to change their settings.
         * Anyone can access this section.
         */}
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <UpdateNameField user={session.user} />
          <UpdateImageField user={session.user} />
        </div>

        {/**
         * ADMIN CONSOLE
         *
         * If the user is an admin, then display the admin console. Here they can
         * see a list of routes where they can manage the website.
         */}
        {hasPermissions(session.user, [Permission.ADMIN]) && (
          <div className="mt-12 flex w-full flex-col items-start justify-start gap-3">
            <div className="flex w-full flex-col items-start justify-start gap-0">
              <h1 className="text-start text-2xl font-normal text-white">
                Admin Console
              </h1>
              <p className="text-start text-sm font-light text-white/80">
                Manage clubs & initiatives, users, and more.
              </p>
            </div>

            <div className="flex w-full flex-wrap items-start justify-start gap-3">
              <Button as={Link} href="/admin/users" color="default">
                Manage Users
              </Button>

              <Button as={Link} href="https://clubs.socis.ca" color="default">
                Manage Clubs
              </Button>

              <Button as={Link} href="https://events.socis.ca" color="default">
                Manage Events
              </Button>

              <Button
                as={Link}
                href="https://initiatives.socis.ca"
                color="default"
              >
                Manage Initiatives
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainWrapper>
  );
}
