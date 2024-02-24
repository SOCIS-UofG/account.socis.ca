"use client";

import Link from "next/link";
import Image from "next/image";
import { BrowserView } from "react-device-detect";
import { SessionProvider, useSession } from "next-auth/react";
import { UpdateProfileImage, UpdateNameField } from "@/components";
import { userConfig } from "@/lib/config";
import {
  CustomCursor,
  LinkButton,
  LoadingSpinnerCenter,
  MainWrapper,
  Navbar,
} from "socis-components";

/**
 * Wraps the main components in a session provider for next auth.
 * @returns JSX.Element
 */
export default function AccountPage() {
  return (
    <>
      <Navbar className="z-40" />

      <BrowserView>
        <CustomCursor />
      </BrowserView>

      <SessionProvider>
        <Components />
      </SessionProvider>
    </>
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
    return <LoadingSpinnerCenter />;
  }

  /**
   * If the user is not authenticated, display an error message.
   *
   * The error message includes a button for the user to properly sign in.
   */
  if (status === "unauthenticated" || !session) {
    return (
      <MainWrapper>
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Session
        </h1>

        <div className="flex flex-col gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            Please sign in to view your account.
          </p>
          <Link
            href="https://auth.socis.ca/signin"
            className="rounded-lg border border-primary px-10 py-3 text-center font-thin text-white hover:bg-emerald-900/50"
          >
            Sign in
          </Link>
        </div>
      </MainWrapper>
    );
  }

  return (
    <MainWrapper className="items-start justify-start gap-20 px-12 pb-20 pt-36 lg:px-20 lg:pt-40">
      <div className="flex flex-col justify-start items-start border-primary/20 border-2 rounded-lg p-12">
        {/**
         * USER INFO
         *
         * The user info section displays the user's name and email.
         */}
        <div className="flex flex-row items-center justify-start gap-3 w-full">
          <Image
            src={session.user.image || userConfig.default.image}
            alt="..."
            width={100}
            height={100}
            className="rounded-full"
          />
          <div className="flex flex-col items-start justify-start gap-1">
            <h1 className="text-center text-5xl font-bold text-white">
              Welcome, {session.user.name.split(" ")[0]}
            </h1>
            <p className="text-center text-sm font-light text-white/80">
              {session.user.name} -- {session.user.email}
            </p>
          </div>
        </div>

        {/**
         * Show the users permissions and roles
         */}
        <div className="flex flex-wrap gap-3 mt-2">
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
        <div className="my-4 flex flex-col items-start justify-start gap-3 w-full">
          <UpdateNameField user={session.user} />
          <UpdateProfileImage user={session.user} />
        </div>

        {/**
         * ADMIN CONSOLE
         *
         * If the user is an admin, then display the admin console. Here they can
         * see a list of routes where they can manage the website.
         */}
        <div className="mt-12 flex flex-col items-start justify-start gap-3">
          <div className="flex flex-col justify-start items-start">
            <h1 className="text-center text-2xl font-bold text-white">
              Admin Console
            </h1>
            <p className="text-center text-sm font-light text-white/80">
              Manage clubs & initiatives, users, and more.
            </p>
          </div>
          <LinkButton href="https://account.socis.ca/admin/users">
            Manage Users
          </LinkButton>
          <LinkButton href="https://clubs.socis.ca">Manage Clubs</LinkButton>
          <LinkButton href="https://initiatives.socis.ca">
            Manage Initiatives
          </LinkButton>
        </div>
      </div>
    </MainWrapper>
  );
}
