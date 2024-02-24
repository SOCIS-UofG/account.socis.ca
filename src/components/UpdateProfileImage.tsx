import { trpc } from "@/lib/trpc/client";
import { useRef, type FormEvent } from "react";
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
} from "socis-components";

export default function UpdateProfileImage(props: {
  user: {
    secret: string;
  };
}) {
  const {
    mutateAsync: uploadImage,
    status,
    data,
  } = trpc.uploadImage.useMutation();
  const imageRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const file = imageRef.current?.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const image = e.target?.result;

      if (typeof image !== "string") {
        return;
      }

      await uploadImage({
        accessToken: props.user.secret,
        image,
      });
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-start justify-start w-full h-full gap-2">
      <form
        className="flex flex-row gap-3 w-full justify-end items-end"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col gap-1 w-full">
          <label className="text-white/80 font-light">Update Username</label>
          <input
            ref={imageRef} // Add ref to input
            type="file"
            className="rounded-lg border border-primary bg-transparent px-4 py-2 font-thin tracking-wider text-white duration-300 ease-in-out focus:outline-none"
            placeholder="Profile Image"
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
        (!data?.success && <ErrorMessage>Failed to update name.</ErrorMessage>)}

      {status === "success" && (
        <SuccessMessage>Name updated successfully.</SuccessMessage>
      )}
    </div>
  );
}
