import config from "@/lib/config/user.config";
import { trpc } from "@/lib/trpc/client";
import { type Status } from "@/types/global/status";
import { Button, Input, Spinner } from "@nextui-org/react";
import { type User } from "next-auth";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

export default function UpdateImageField(props: { user: User }) {
  const { mutateAsync: updateUserProfileImage } =
    trpc.updateUserProfileImage.useMutation();

  const imageRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>("idle");

  const router = useRouter();

  /**
   * When the form is submitted, update the user's profile image.
   */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setStatus("loading");

    const file = imageRef.current?.files?.[0];
    if (!file) {
      /**
       * If there's no file, then just use the default image.
       */
      await updateUserProfileImage({
        accessToken: props.user.secret,
        image: config.default.image,
      })
        .then((res) => {
          res.user ? setStatus("success") : setStatus("error");

          router.refresh();
        })
        .catch(() => setStatus("error"));

      return;
    }

    // make sure file is less than 5mb
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5mb");
      return setStatus("error");
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const image = e.target?.result;

      if (typeof image !== "string") {
        return;
      }

      await updateUserProfileImage({
        accessToken: props.user.secret,
        image,
      })
        .then((res) => {
          res.user ? setStatus("success") : setStatus("error");

          router.refresh();
        })
        .catch(() => setStatus("error"));
    };

    reader.readAsDataURL(file);
  };

  return (
    <form
      className="flex h-fit w-full flex-row items-end justify-end gap-2"
      onSubmit={onSubmit}
    >
      <Input
        className="w-full disabled:opacity-50"
        ref={imageRef}
        type="file"
        disabled={status === "loading"}
        label="Profile Image"
        placeholder="Profile Image"
      />

      <Button
        type="submit"
        className="w-fit disabled:opacity-50"
        disabled={status === "loading"}
        color="default"
      >
        {status === "loading" ? <Spinner color="white" size="sm" /> : "Update"}
      </Button>

      {status === "success" && (
        <p className="text-sm text-green-500">Image updated successfully!</p>
      )}

      {status === "error" && (
        <p className="text-sm text-red-500">Failed to update image</p>
      )}
    </form>
  );
}
