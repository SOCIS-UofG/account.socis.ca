import { trpc } from "@/lib/trpc/client";
import { type User } from "next-auth";
import { useState, type FormEvent } from "react";
import {
  Button,
  ErrorMessage,
  LoadingSpinner,
  SuccessMessage,
} from "socis-components";

export default function UpdateNameField(props: { user: User }): JSX.Element {
  /**
   * Updates the user's name in the database.
   */
  const {
    mutateAsync: updateUser,
    status,
    data,
  } = trpc.updateUser.useMutation();

  /**
   * State for the user's name.
   */
  const [name, setName] = useState(props.user.name);

  /**
   * Updates the user's name in the database.
   *
   * @param e The event that triggered the change
   */
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await updateUser({
      accessToken: props.user.secret,
      user: {
        id: props.user.id,
        name: props.user.name,
      } as User,
    });
  }

  /**
   * The component's JSX.
   */
  return (
    <div className="flex flex-col items-start justify-start w-full h-full gap-2">
      <form
        className="flex flex-row gap-3 w-full justify-end items-end"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col gap-1 w-full">
          <label className="text-white/80 font-light">Update Username</label>
          <input
            maxLength={50}
            minLength={1}
            type="text"
            name="name"
            className="rounded-lg border border-primary bg-transparent px-4 py-2 font-thin tracking-wider text-white duration-300 ease-in-out focus:outline-none"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="h-fit py-2 px-6"
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <LoadingSpinner className="h-5 w-5" />
          ) : (
            "Update"
          )}
        </Button>
      </form>

      {status === "error" ||
        (data && !data.success && (
          <ErrorMessage>Failed to update name.</ErrorMessage>
        ))}

      {status === "success" && (
        <SuccessMessage>Name updated successfully.</SuccessMessage>
      )}
    </div>
  );
}
