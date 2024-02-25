"use client";

import { trpc } from "@/lib/trpc/client";
import { hasPermissions } from "@/lib/utils/permissions";
import { Permission, Role } from "@/types";
import { type User } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Button as NextUIButton,
  NextUIProvider,
  User as UserHeader,
} from "@nextui-org/react";

import {
  LinkButton,
  LoadingSpinnerCenter,
  MainWrapper,
  Navbar,
} from "socis-components";

/**
 * The account dashboard page
 *
 * @returns The JSX element
 */
export default function DashboardPage() {
  return (
    <>
      <Navbar />

      <NextUIProvider>
        <SessionProvider>
          <Components />
        </SessionProvider>
      </NextUIProvider>
    </>
  );
}

/**
 * The main components of the home page
 *
 * @returns The JSX element
 */
function Components(): JSX.Element {
  const { data: session, status: sessionStatus } = useSession();
  const { mutateAsync: getAllUsers, status: getAllUsersStatus } =
    trpc.getAllUsers.useMutation();
  const { mutateAsync: updateUser, status: updateUserStatus } =
    trpc.updateUser.useMutation();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (getAllUsersStatus === "loading" || getAllUsersStatus === "success") {
      return;
    }

    if (!session || sessionStatus !== "authenticated") {
      return;
    }

    getAllUsers().then((res) => {
      if (!res.success) {
        return;
      }

      setUsers(res.users as User[]);
    });
  }, [session, sessionStatus]);

  if (sessionStatus === "loading" || getAllUsersStatus === "loading") {
    return <LoadingSpinnerCenter />;
  }

  if (sessionStatus === "unauthenticated" || !session) {
    return (
      <MainWrapper className="relative z-10 w-full justify-start gap-2 px-12 py-40 text-center">
        <h1 className="text-7xl font-extrabold tracking-wide text-white">
          Invalid session
        </h1>
        <p className="my-4 text-gray-400">
          You need to be signed in to access this page.
        </p>
        <LinkButton href="https://auth.socis.ca/signin">Sign in</LinkButton>
      </MainWrapper>
    );
  }

  if (!hasPermissions(session.user, [Permission.ADMIN])) {
    return (
      <MainWrapper className="relative z-10 w-full justify-start gap-2 px-12 py-40 text-center">
        <h1 className="text-7xl font-extrabold tracking-wide text-white">
          Unauthorized
        </h1>
        <p className="my-4 text-gray-400">
          You do not have permission to access this page. (need: admin)
        </p>
        <LinkButton href="https://auth.socis.ca/signin">
          Switch accounts
        </LinkButton>
      </MainWrapper>
    );
  }

  return (
    <MainWrapper className="relative items-start justify-start gap-7 px-7 pb-16 pt-32 lg:px-20 lg:pt-40">
      <div className="z-10 flex w-fit flex-col gap-4 text-white">
        <h1 className="text-5xl font-bold leading-tight text-white md:text-6xl">
          Manage Users
        </h1>
        <p className="w-full sm:w-3/5 text-sm text-gray-200/70">
          Manage registered users. You can search for an user below to quickly
          modify their details. Or <Link href="/">go back</Link> to your
          account.
        </p>
        <input
          type="text"
          placeholder="Search for an user"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 rounded-md border-2 text-white bg-secondary border-primary/10 focus:border-primary/20 focus:outline-none transition-all duration-300 ease-in-out"
        />
      </div>

      {/**
       * An array of user cards
       */}
      <div className="flex w-full flex-wrap gap-7">
        {users.map((user) => {
          if (
            !user.name.toLowerCase().includes(search.toLowerCase()) &&
            !user.email.toLowerCase().includes(search.toLowerCase())
          ) {
            return null;
          }

          const addPermission = async (permission: Permission) => {
            const res = await updateUser({
              accessToken: session.user.secret,
              user: {
                id: user.id,
                permissions: user.permissions
                  .filter((p) => p !== permission) // remove the permission (if already exists)
                  .concat(permission), // add the permission
              },
            });

            if (!res.success || !res.user) {
              return;
            }

            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? (res.user as User) : u))
            );
          };

          const removePermission = async (permission: Permission) => {
            const res = await updateUser({
              accessToken: session.user.secret,
              user: {
                id: user.id,
                permissions: user.permissions.filter((p) => p !== permission),
              },
            });

            if (!res.success || !res.user) {
              return;
            }

            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? (res.user as User) : u))
            );
          };

          const addRole = async (role: string) => {
            const res = await updateUser({
              accessToken: session.user.secret,
              user: {
                id: user.id,
                roles: user.roles.concat(role),
              },
            });

            if (!res.success || !res.user) {
              return;
            }

            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? (res.user as User) : u))
            );
          };

          const removeRole = async (role: string) => {
            const res = await updateUser({
              accessToken: session.user.secret,
              user: {
                id: user.id,
                roles: user.roles.filter((r) => r !== role),
              },
            });

            if (!res.success || !res.user) {
              return;
            }

            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? (res.user as User) : u))
            );
          };

          return (
            <div
              key={user.id}
              className="z-10 flex w-fit max-w-96 flex-col items-start justify-start gap-3 rounded-md border-2 border-primary/10 bg-secondary p-7 text-white"
            >
              <UserHeader
                avatarProps={{
                  src: user.image,
                }}
                name={user.name}
                description={
                  <Link href={`mailto:${user.email}`} size="sm">
                    {user.email}
                  </Link>
                }
              />

              <div className="flex w-full flex-col items-start justify-start gap-1">
                <p className="text-sm text-gray-200/70">Permissions</p>
                <div className="flex w-full flex-wrap items-center justify-start gap-2">
                  {user.permissions.map((permission) => (
                    <p
                      key={permission}
                      className="w-fit rounded-md border border-primary bg-emerald-950/50 px-2 py-1 text-xs font-thin text-white"
                    >
                      {permission}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex w-full flex-col items-start justify-start gap-1">
                <p className="text-sm text-gray-200/70">Roles</p>
                <div className="flex w-full flex-wrap items-center justify-start gap-2">
                  {user.roles.map((role) => (
                    <p
                      key={role}
                      className="w-fit rounded-md border border-primary bg-emerald-950/50 px-2 py-1 text-xs font-thin text-white"
                    >
                      {role}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full">
                <Dropdown
                  placement="bottom-end"
                  className="border-2 border-primary/10 bg-secondary text-white"
                >
                  <DropdownTrigger>
                    <NextUIButton variant="bordered" color="primary" size="sm">
                      Manage Permissions
                    </NextUIButton>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Modify user permissions"
                    disabledKeys={
                      user.id === session.user.id
                        ? [Permission.ADMIN]
                        : updateUserStatus === "loading"
                          ? user.permissions
                          : []
                    }
                  >
                    <DropdownItem
                      key={Permission.ADMIN}
                      onClick={() => {
                        if (user.permissions.includes(Permission.ADMIN)) {
                          removePermission(Permission.ADMIN);
                        } else {
                          addPermission(Permission.ADMIN);
                        }
                      }}
                    >
                      {user.permissions.includes(Permission.ADMIN)
                        ? "Remove: Admin"
                        : "Add: Admin"}
                    </DropdownItem>
                    <DropdownItem
                      key={Permission.EDIT_EVENT}
                      onClick={() => {
                        if (user.permissions.includes(Permission.EDIT_EVENT)) {
                          removePermission(Permission.EDIT_EVENT);
                        } else {
                          addPermission(Permission.EDIT_EVENT);
                        }
                      }}
                    >
                      {user.permissions.includes(Permission.EDIT_EVENT)
                        ? "Remove: Edit Events"
                        : "Add: Edit Events"}
                    </DropdownItem>
                    <DropdownItem
                      key={Permission.DELETE_EVENT}
                      onClick={() => {
                        if (
                          user.permissions.includes(Permission.DELETE_EVENT)
                        ) {
                          removePermission(Permission.DELETE_EVENT);
                        } else {
                          addPermission(Permission.DELETE_EVENT);
                        }
                      }}
                    >
                      {user.permissions.includes(Permission.DELETE_EVENT)
                        ? "Remove: Delete Events"
                        : "Add: Delete Events"}
                    </DropdownItem>
                    <DropdownItem
                      key={Permission.CREATE_EVENT}
                      onClick={() => {
                        if (
                          user.permissions.includes(Permission.CREATE_EVENT)
                        ) {
                          removePermission(Permission.CREATE_EVENT);
                        } else {
                          addPermission(Permission.CREATE_EVENT);
                        }
                      }}
                    >
                      {user.permissions.includes(Permission.CREATE_EVENT)
                        ? "Remove: Create Events"
                        : "Add: Create Events"}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>

                {/**
                 * Add roles
                 */}
                <Dropdown
                  placement="bottom-end"
                  className="border-2 border-primary/10 bg-secondary text-white"
                >
                  <DropdownTrigger>
                    <NextUIButton variant="bordered" color="primary" size="sm">
                      Manage Roles
                    </NextUIButton>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Modify user roles"
                    disabledKeys={
                      updateUserStatus === "loading" ? user.roles : []
                    }
                  >
                    <DropdownItem
                      key={Role.TECH_TEAM}
                      onClick={() => {
                        if (user.roles.includes(Role.TECH_TEAM)) {
                          removeRole(Role.TECH_TEAM);
                        } else {
                          addRole(Role.TECH_TEAM);
                        }
                      }}
                    >
                      {user.roles.includes(Role.TECH_TEAM)
                        ? "Remove: Technology Team"
                        : "Add: Technology Team"}
                    </DropdownItem>
                    <DropdownItem
                      key={Role.EVENTS_TEAM}
                      onClick={() => {
                        if (user.roles.includes(Role.EVENTS_TEAM)) {
                          removeRole(Role.EVENTS_TEAM);
                        } else {
                          addRole(Role.EVENTS_TEAM);
                        }
                      }}
                    >
                      {user.roles.includes(Role.EVENTS_TEAM)
                        ? "Remove: Events Team"
                        : "Add: Events Team"}
                    </DropdownItem>
                    <DropdownItem
                      key={Role.MARKETING_TEAM}
                      onClick={() => {
                        if (user.roles.includes(Role.MARKETING_TEAM)) {
                          removeRole(Role.MARKETING_TEAM);
                        } else {
                          addRole(Role.MARKETING_TEAM);
                        }
                      }}
                    >
                      {user.roles.includes(Role.MARKETING_TEAM)
                        ? "Remove: Marketing Team"
                        : "Add: Marketing Team"}
                    </DropdownItem>
                    <DropdownItem
                      key={Role.PROJECT_MANAGER}
                      onClick={() => {
                        if (user.roles.includes(Role.PROJECT_MANAGER)) {
                          removeRole(Role.PROJECT_MANAGER);
                        } else {
                          addRole(Role.PROJECT_MANAGER);
                        }
                      }}
                    >
                      {user.roles.includes(Role.PROJECT_MANAGER)
                        ? "Remove: Project Manager"
                        : "Add: Project Manager"}
                    </DropdownItem>
                    <DropdownItem
                      key={Role.SERM_APPROVED}
                      onClick={() => {
                        if (user.roles.includes(Role.SERM_APPROVED)) {
                          removeRole(Role.SERM_APPROVED);
                        } else {
                          addRole(Role.SERM_APPROVED);
                        }
                      }}
                    >
                      {user.roles.includes(Role.SERM_APPROVED)
                        ? "Remove: SE&RM Approved"
                        : "Add: SE&RM Approved"}
                    </DropdownItem>
                    <DropdownItem
                      key={Role.PRESIDENT}
                      onClick={() => {
                        if (user.roles.includes(Role.PRESIDENT)) {
                          removeRole(Role.PRESIDENT);
                        } else {
                          addRole(Role.PRESIDENT);
                        }
                      }}
                    >
                      {user.roles.includes(Role.PRESIDENT)
                        ? "Remove: President"
                        : "Add: President"}
                    </DropdownItem>
                    <DropdownItem
                      key={Role.VICE_PRESIDENT_INTERNAL}
                      onClick={() => {
                        if (user.roles.includes(Role.VICE_PRESIDENT_INTERNAL)) {
                          removeRole(Role.VICE_PRESIDENT_INTERNAL);
                        } else {
                          addRole(Role.VICE_PRESIDENT_INTERNAL);
                        }
                      }}
                    >
                      {user.roles.includes(Role.VICE_PRESIDENT_INTERNAL)
                        ? "Remove: Vice-President of Internal Affairs"
                        : "Add: Vice-President of Internal Affairs"}
                    </DropdownItem>
                    <DropdownItem
                      key={Role.VICE_PRESIDENT_EXTERNAL}
                      onClick={() => {
                        if (user.roles.includes(Role.VICE_PRESIDENT_EXTERNAL)) {
                          removeRole(Role.VICE_PRESIDENT_EXTERNAL);
                        } else {
                          addRole(Role.VICE_PRESIDENT_EXTERNAL);
                        }
                      }}
                    >
                      {user.roles.includes(Role.VICE_PRESIDENT_EXTERNAL)
                        ? "Remove: Vice-President of External Affairs"
                        : "Add: Vice-President of External Affairs"}
                    </DropdownItem>
                    <DropdownItem
                      key={Role.VICE_PRESIDENT_COMM}
                      onClick={() => {
                        if (user.roles.includes(Role.VICE_PRESIDENT_COMM)) {
                          removeRole(Role.VICE_PRESIDENT_COMM);
                        } else {
                          addRole(Role.VICE_PRESIDENT_COMM);
                        }
                      }}
                    >
                      {user.roles.includes(Role.VICE_PRESIDENT_COMM)
                        ? "Remove: Vice-President of Communications"
                        : "Add: Vice-President of Communications"}
                    </DropdownItem>
                    <DropdownItem
                      key={Role.VICE_PRESIDENT_TECH}
                      onClick={() => {
                        if (user.roles.includes(Role.VICE_PRESIDENT_TECH)) {
                          removeRole(Role.VICE_PRESIDENT_TECH);
                        } else {
                          addRole(Role.VICE_PRESIDENT_TECH);
                        }
                      }}
                    >
                      {user.roles.includes(Role.VICE_PRESIDENT_TECH)
                        ? "Remove: Vice-President of Technology"
                        : "Add: Vice-President of Technology"}
                    </DropdownItem>
                    <DropdownItem
                      key={Role.VICE_PRESIDENT_FINANCIAL}
                      onClick={() => {
                        if (
                          user.roles.includes(Role.VICE_PRESIDENT_FINANCIAL)
                        ) {
                          removeRole(Role.VICE_PRESIDENT_FINANCIAL);
                        } else {
                          addRole(Role.VICE_PRESIDENT_FINANCIAL);
                        }
                      }}
                    >
                      {user.roles.includes(Role.VICE_PRESIDENT_FINANCIAL)
                        ? "Remove: Vice-President of Financial Affairs"
                        : "Add: Vice-President of Financial Affairs"}
                    </DropdownItem>
                    <DropdownItem
                      key={Role.VICE_PRESIDENT_SOCIAL}
                      onClick={() => {
                        if (user.roles.includes(Role.VICE_PRESIDENT_SOCIAL)) {
                          removeRole(Role.VICE_PRESIDENT_SOCIAL);
                        } else {
                          addRole(Role.VICE_PRESIDENT_SOCIAL);
                        }
                      }}
                    >
                      {user.roles.includes(Role.VICE_PRESIDENT_SOCIAL)
                        ? "Remove: Vice-President of Social Affairs"
                        : "Add: Vice-President of Social Affairs"}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          );
        })}
      </div>
    </MainWrapper>
  );
}
