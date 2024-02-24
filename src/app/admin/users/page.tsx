"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { type Session, type User } from "next-auth";
import { type ChangeEvent, useEffect, useState } from "react";
import Image from "next/image";
import { BrowserView } from "react-device-detect";
import { trpc } from "@/lib/trpc/client";
import { hasPermissions } from "@/lib/utils";
import { Permission, Role, type Optional } from "@/types";
import { CustomCheckbox } from "@/components";
import {
  Button,
  CustomCursor,
  LoadingSpinner,
  LoadingSpinnerCenter,
  MainWrapper,
  Navbar,
  LinkButton,
} from "socis-components";

enum Status {
  NEEDS_FETCH,
  FETCHING,
  FETCH_SUCCESS,
  FETCH_ERROR,

  UPDATING,
  UPDATE_SUCCESS,
  UPDATE_ERROR,

  DEFAULT,
}

/**
 * Wraps the main components in a session provider for next auth.
 * @returns JSX.Element
 */
export default function ManageUsersPage(): JSX.Element {
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
  const { data: session, status: sessionStatus } = useSession();
  const { mutateAsync: updateUser } = trpc.updateUser.useMutation();
  const { mutateAsync: getAllUsers } = trpc.getAllUsers.useMutation();

  /**
   * States for the users and status.
   */
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<Status>(Status.NEEDS_FETCH);
  const [search, setSearch] = useState<string>("");
  const [userBeingEdited, setUserBeingEdited] = useState<Optional<User>>();

  useEffect(() => {
    /**
     * If the fetch status is not idle, then don't fetch the users.
     */
    if (status !== Status.NEEDS_FETCH || sessionStatus !== "authenticated") {
      return;
    }

    /**
     * Set the status to loading and fetch the users.
     */
    setStatus(Status.FETCHING);
    getAllUsers().then((res) => {
      setAllUsers(res.users);
      setStatus(res.success ? Status.FETCH_SUCCESS : Status.FETCH_ERROR);
    });
  }, [sessionStatus]);

  /**
   * Save the changes to the user.
   *
   * @param session The current session
   * @returns Promise<void>
   */
  async function saveChanges(session: Session): Promise<void> {
    setStatus(Status.UPDATING);

    if (!userBeingEdited) {
      return setStatus(Status.UPDATE_ERROR);
    }

    const newPermissions = userBeingEdited.permissions;
    const res = await updateUser({
      accessToken: session.user.secret,
      user: {
        id: userBeingEdited.id,
        name: userBeingEdited.name,
        permissions: newPermissions,
        roles: userBeingEdited.roles,
      },
    });

    if (!res.success) {
      return setStatus(Status.UPDATE_ERROR);
    }

    setAllUsers(
      allUsers.map((user) => {
        if (user.id === userBeingEdited.id) {
          return {
            ...user,
            permissions: newPermissions,
          };
        }

        return user;
      })
    );

    setUserBeingEdited(undefined);
    setStatus(Status.UPDATE_SUCCESS);
  }

  /**
   * Update the permissions for the user.
   *
   * @param e The change event
   * @param p The permission to change
   */
  function onPermissionChange(e: ChangeEvent<HTMLInputElement>, p: Permission) {
    if (!userBeingEdited) {
      return;
    }

    e.target.checked && !userBeingEdited.permissions.includes(p)
      ? userBeingEdited.permissions.push(p)
      : userBeingEdited.permissions.splice(
          userBeingEdited.permissions.indexOf(p),
          1
        );

    setUserBeingEdited(userBeingEdited);
  }

  /**
   * Update the roles for the user.
   *
   * @param e The change event
   * @param r The role to change
   */
  function onRoleChange(e: ChangeEvent<HTMLInputElement>, r: string) {
    if (!userBeingEdited) {
      return;
    }

    e.target.checked && !userBeingEdited.roles.includes(r)
      ? userBeingEdited.roles.push(r)
      : userBeingEdited.roles.splice(userBeingEdited.roles.indexOf(r), 1);

    setUserBeingEdited(userBeingEdited);
  }

  /**
   * If the user is loading, then return a loading screen.
   */
  if (sessionStatus === "loading" || status === Status.FETCHING) {
    return <LoadingSpinnerCenter />;
  }

  /**
   * Check if the user is authenticated.
   *
   * If the user is not authenticated, then return an invalid session component.
   */
  if (sessionStatus !== "authenticated") {
    return (
      <MainWrapper>
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Session
        </h1>

        <div className="flex flex-col gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            Please sign in to proceed.
          </p>
          <LinkButton href="https://auth.socis.ca/signin">Sign in</LinkButton>
        </div>
      </MainWrapper>
    );
  }

  /**
   * Check if the user has the permissions to manage users.
   *
   * If the user does not have the permissions, then return an invalid permissions component.
   */
  if (!hasPermissions(session.user, [Permission.ADMIN])) {
    return (
      <MainWrapper>
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Permissions
        </h1>

        <div className="flex flex-col gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            You do not have the permissions to manage users.
          </p>
          <LinkButton href="https://auth.socis.ca/signin">
            Switch accounts
          </LinkButton>
        </div>
      </MainWrapper>
    );
  }

  /**
   * Return the main components.
   */
  return (
    <MainWrapper className="z-40 w-full items-start justify-start gap-4 p-20 pt-52">
      <h1 className="text-center text-5xl font-bold text-white">
        Manage users
      </h1>
      <p className="text-center text-sm font-light text-white/80">
        {session.user.email ?? "user"}.
      </p>

      <input
        className="mt-2 flex w-full rounded-lg border border-primary bg-transparent px-4 py-2 text-base font-thin tracking-wider text-white duration-300 ease-in-out focus:outline-none"
        type="text"
        placeholder="Search for a user..."
        onChange={(e) => setSearch(e.target.value)}
      />

      {allUsers.map((user) => {
        // If the user doesn't match the search query, don't render them
        if (
          !user.name.toLowerCase().includes(search) &&
          !user.email.toLowerCase().includes(search)
        ) {
          return <></>;
        }

        return (
          <div
            key={user.id}
            className="flex w-full flex-col items-start justify-start gap-2 rounded-md border border-primary p-3"
          >
            <div className="flex w-full flex-row items-center justify-between">
              <div className="flex flex-row items-center justify-center gap-4">
                <Image
                  src={user.image || "/images/default-pfp.png"}
                  alt="..."
                  className="rounded-full"
                  width={50}
                  height={50}
                />

                <div className="flex flex-col items-start justify-start">
                  <h1 className="text-white">{user.name}</h1>
                  <p className="text-sm font-thin text-white">{user.email}</p>
                </div>
              </div>

              {/**
               * Button to edit the user
               */}
              <Button
                onClick={() =>
                  setUserBeingEdited(
                    userBeingEdited?.id === user.id ? undefined : user
                  )
                }
              >
                {userBeingEdited?.id === user.id ? "Cancel" : "Edit"}
              </Button>
            </div>

            {/**
             * If the user is being edited, then display the permissions
             */}
            {userBeingEdited?.id === user.id && (
              <div className="mt-4 flex w-full flex-row items-center justify-between">
                <div className="flex flex-col gap-2">
                  {/**
                   * ROLES
                   *
                   * Manage the users roles
                   */}
                  <div className="flex flex-wrap items-center justify-center gap-7">
                    <CustomCheckbox
                      onChange={(e) => onRoleChange(e, Role.MEMBER)}
                      defaultSelected={user.roles.includes(Role.MEMBER)}
                    >
                      Member
                    </CustomCheckbox>
                    <CustomCheckbox
                      onChange={(e) => onRoleChange(e, Role.PRESIDENT)}
                      defaultSelected={user.roles.includes(Role.PRESIDENT)}
                    >
                      President
                    </CustomCheckbox>
                    <CustomCheckbox
                      onChange={(e) => onRoleChange(e, Role.VICE_PRESIDENT)}
                      defaultSelected={user.roles.includes(Role.VICE_PRESIDENT)}
                    >
                      Vice President
                    </CustomCheckbox>
                    <CustomCheckbox
                      onChange={(e) => onRoleChange(e, Role.PROJECT_MANAGER)}
                      defaultSelected={user.roles.includes(
                        Role.PROJECT_MANAGER
                      )}
                    >
                      Project Manager
                    </CustomCheckbox>
                    <CustomCheckbox
                      onChange={(e) => onRoleChange(e, Role.SERM_APPROVED)}
                      defaultSelected={user.roles.includes(Role.SERM_APPROVED)}
                    >
                      SE&RM Approved
                    </CustomCheckbox>
                    <CustomCheckbox
                      onChange={(e) => onRoleChange(e, Role.TREASURER)}
                      defaultSelected={user.roles.includes(Role.TREASURER)}
                    >
                      Treasurer
                    </CustomCheckbox>
                  </div>

                  {/**
                   * PERMISSIONS
                   *
                   * Manage the users permissions
                   */}
                  <div className="flex flex-wrap items-center justify-center gap-7">
                    <CustomCheckbox
                      disabled={user.id === session.user.id}
                      onChange={(e) => onPermissionChange(e, Permission.ADMIN)}
                      defaultSelected={user.permissions.includes(
                        Permission.ADMIN
                      )}
                    >
                      Admin
                    </CustomCheckbox>
                    <CustomCheckbox
                      onChange={(e) =>
                        onPermissionChange(e, Permission.CREATE_EVENT)
                      }
                      defaultSelected={user.permissions.includes(
                        Permission.CREATE_EVENT
                      )}
                    >
                      Create Events
                    </CustomCheckbox>
                    <CustomCheckbox
                      onChange={(e) =>
                        onPermissionChange(e, Permission.EDIT_EVENT)
                      }
                      defaultSelected={user.permissions.includes(
                        Permission.EDIT_EVENT
                      )}
                    >
                      Edit Events
                    </CustomCheckbox>
                    <CustomCheckbox
                      onChange={(e) =>
                        onPermissionChange(e, Permission.DELETE_EVENT)
                      }
                      defaultSelected={user.permissions.includes(
                        Permission.DELETE_EVENT
                      )}
                    >
                      Delete Events
                    </CustomCheckbox>
                  </div>
                </div>

                {/**
                 * Button to save the changes
                 */}
                <Button
                  disabled={status === Status.UPDATING}
                  onClick={async () => await saveChanges(session)}
                >
                  {status === Status.UPDATING ? (
                    <LoadingSpinner className="h-5 w-5" />
                  ) : (
                    <p>Save changes</p>
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </MainWrapper>
  );
}
