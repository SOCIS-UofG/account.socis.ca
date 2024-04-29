import config from "@/lib/config/user.config";
import { trpc } from "@/lib/trpc/client";
import { type Status } from "@/types/global/status";
import { Button } from "@nextui-org/button";
import { Input, Spinner } from "@nextui-org/react";
import { type User } from "next-auth";
import { useState, type FormEvent } from "react";

export default function UpdateNameField(props: { user: User }) {
  const { mutateAsync: updateUser } = trpc.updateUser.useMutation();

  const [name, setName] = useState(props.user.name);
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await updateUser({
      accessToken: props.user.secret,
      user: {
        id: props.user.id,
        name,
      } as User,
    })
      .then((res) => {
        res.user ? setStatus("success") : setStatus("error");
      })
      .catch(() => setStatus("error"));
  };

  return (
    <form
      className="flex h-fit w-full flex-row items-end justify-end gap-3"
      onSubmit={onSubmit}
    >
      <Input
        className="w-full disabled:opacity-50"
        disabled={status === "loading"}
        maxLength={config.max.name}
        minLength={config.min.name}
        type="text"
        label="Name"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Button
        type="submit"
        color="default"
        className="h-full w-fit disabled:opacity-50"
        disabled={status === "loading"}
      >
        {status === "loading" ? <Spinner color="white" size="sm" /> : "Update"}
      </Button>

      {status === "success" && (
        <p className="text-sm text-green-500">Name updated successfully!</p>
      )}

      {status === "error" && (
        <p className="text-sm text-red-500">Failed to update name</p>
      )}
    </form>
  );
}
