"use client";

import { trpc } from "@/lib/trpc/client";
import { hasPermissions } from "@/lib/utils/permissions";
import { type User } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Link,
  NextUIProvider,
  Spinner,
  User as UserHeader,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@nextui-org/react";
import Navbar from "@/components/ui/global/Navbar";
import { type Status } from "@/types/global/status";
import MainWrapper from "@/components/ui/global/MainWrapper";
import { Permission } from "@/types/global/permission";
import { Role } from "@/types/global/role";

/**
 * The account dashboard page
 *
 * @returns The JSX element
 */
export default function DashboardPage() {
  return (
    <NextUIProvider>
      <Navbar />

      <SessionProvider>
        <Components />
      </SessionProvider>
    </NextUIProvider>
  );
}

/**
 * The main components of the home page
 *
 * @returns The JSX element
 */
function Components(): JSX.Element {
  const { data: session, status: sessionStatus } = useSession();
  const { mutateAsync: getAllUsers } = trpc.getAllUsersSecure.useMutation();
  const { mutateAsync: updateUser } = trpc.updateUser.useMutation();
  const { mutateAsync: deleteUser } = trpc.deleteUser.useMutation();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status !== "idle") {
      return;
    }

    if (!session || sessionStatus !== "authenticated") {
      return;
    }

    setStatus("loading");

    getAllUsers()
      .then((res) => {
        setUsers(res.users);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [session, sessionStatus]);

  if (sessionStatus === "loading") {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center p-12">
        <Spinner color="primary" size="lg" />
      </MainWrapper>
    );
  }

  if (sessionStatus === "unauthenticated" || !session) {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center p-12">
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Session
        </h1>

        <div className="flex flex-col items-center justify-center gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            Please sign in to access this page.
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

  if (!hasPermissions(session.user, [Permission.ADMIN])) {
    return (
      <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-center justify-center p-12">
        <h1 className="text-center text-3xl font-bold text-white lg:text-5xl">
          Invalid Permissions
        </h1>

        <div className="flex flex-col items-center justify-center gap-5">
          <p className="text-center text-sm font-light text-white lg:text-base">
            You do not have permission to access this page (need: admin).
          </p>
          <Button as={Link} href="/" color="default" className="w-fit">
            Go Back
          </Button>
        </div>
      </MainWrapper>
    );
  }

  return (
    <MainWrapper className="relative z-40 flex min-h-screen w-screen flex-col items-start justify-start gap-7 p-12 px-7 pb-16 pt-32 lg:px-20 lg:pt-40">
      <div className="z-10 flex w-fit flex-col gap-4 text-white">
        <h1 className="text-5xl font-bold leading-tight text-white md:text-6xl">
          Manage Users
        </h1>

        <p className="w-full text-sm text-gray-200/70 sm:w-3/5">
          Manage registered users. You can search for an user below to quickly
          modify their details. Or{" "}
          <Link href="/" size="sm">
            go back
          </Link>{" "}
          to your account.
        </p>

        <Input
          className="w-full"
          type="text"
          label="Search"
          placeholder="Search for an user"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/**
       * An array of user cards
       */}
      <div className="flex w-full flex-wrap items-start justify-start gap-7">
        {users.map((user) => {
          if (
            !user.name.toLowerCase().includes(search.toLowerCase()) &&
            !user.email.toLowerCase().includes(search.toLowerCase())
          ) {
            return <></>;
          }

          /**
           * Add a permission to the user
           */
          const addPermission = async (permission: Permission) => {
            setStatus("loading");

            await updateUser({
              accessToken: session.user.secret,
              user: {
                id: user.id,
                permissions: user.permissions
                  .filter((p) => p !== permission) // remove the permission (if already exists)
                  .concat(permission), // add the permission
              },
            })
              .then((res) => {
                if (!res.user) {
                  return setStatus("error");
                }

                setUsers((prev) =>
                  prev.map((u) => (u.id === user.id ? (res.user as User) : u)),
                );

                setStatus("success");
              })
              .catch(() => setStatus("error"));
          };

          /**
           * Remove a permission from the user
           */
          const removePermission = async (permission: Permission) => {
            setStatus("loading");

            await updateUser({
              accessToken: session.user.secret,
              user: {
                id: user.id,
                permissions: user.permissions.filter((p) => p !== permission),
              },
            })
              .then((res) => {
                if (!res.user) {
                  return setStatus("error");
                }

                setUsers((prev) =>
                  prev.map((u) => (u.id === user.id ? (res.user as User) : u)),
                );

                setStatus("success");
              })
              .catch(() => setStatus("error"));
          };

          /**
           * Add a role to the user
           */
          const addRole = async (role: string) => {
            setStatus("loading");

            await updateUser({
              accessToken: session.user.secret,
              user: {
                id: user.id,
                roles: user.roles.concat(role),
              },
            })
              .then((res) => {
                if (!res.user) {
                  return setStatus("error");
                }

                setUsers((prev) =>
                  prev.map((u) => (u.id === user.id ? (res.user as User) : u)),
                );

                setStatus("success");
              })
              .catch(() => setStatus("error"));
          };

          /**
           * Remove a role from the user
           */
          const removeRole = async (role: string) => {
            setStatus("loading");

            await updateUser({
              accessToken: session.user.secret,
              user: {
                id: user.id,
                roles: user.roles.filter((r) => r !== role),
              },
            })
              .then((res) => {
                if (!res.user) {
                  return setStatus("error");
                }

                setUsers((prev) =>
                  prev.map((u) => (u.id === user.id ? (res.user as User) : u)),
                );

                setStatus("success");
              })
              .catch(() => setStatus("error"));
          };

          /**
           * Delete a user
           */
          const _deleteUser = async () => {
            setStatus("loading");

            await deleteUser({
              accessToken: session.user.secret,
              id: user.id,
            })
              .then((res) => {
                if (!res.user) {
                  return setStatus("error");
                }

                setUsers((prev) => prev.filter((u) => u.id !== user.id));

                setStatus("success");
              })
              .catch(() => setStatus("error"));
          };

          return (
            <div
              key={user.id}
              className="z-10 flex min-h-fit w-full max-w-96 flex-col items-start justify-start gap-3 rounded-md border-2 border-neutral-700/50 bg-secondary p-7 text-white"
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

              <div className="mt-4 flex w-full flex-wrap gap-2">
                <Dropdown
                  placement="bottom-end"
                  className="border-2 border-neutral-700/50 bg-secondary text-white"
                >
                  <DropdownTrigger>
                    <Button variant="solid" color="default" size="sm">
                      Manage Permissions
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Modify user permissions"
                    disabledKeys={
                      user.id === session.user.id
                        ? [Permission.ADMIN]
                        : status === "loading"
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
                  className="border-2 border-neutral-700/50 bg-secondary text-white"
                >
                  <DropdownTrigger>
                    <Button variant="solid" color="default" size="sm">
                      Manage Roles
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Modify user roles"
                    disabledKeys={status === "loading" ? user.roles : []}
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

              <Button
                color="danger"
                variant="solid"
                size="sm"
                onPress={onOpen}
                disabled={status === "loading"}
              >
                Delete User
              </Button>

              <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                  {(onClose) => (
                    <>
                      <ModalHeader className="flex flex-col gap-1">
                        Delete User
                      </ModalHeader>
                      <ModalBody>
                        <p className="text-sm text-gray-200/70">
                          Are you sure you want to delete this user? This action
                          cannot be undone.
                        </p>
                      </ModalBody>
                      <ModalFooter>
                        <Button
                          color="default"
                          onPress={onClose}
                          disabled={status === "loading"}
                          className="btn disabled:opacity-50"
                        >
                          Close
                        </Button>
                        <Button
                          color="danger"
                          onPress={onClose}
                          onClick={_deleteUser}
                          disabled={status === "loading"}
                          className="btn disabled:opacity-50"
                        >
                          Delete User
                        </Button>
                      </ModalFooter>
                    </>
                  )}
                </ModalContent>
              </Modal>
            </div>
          );
        })}
      </div>
    </MainWrapper>
  );
}
