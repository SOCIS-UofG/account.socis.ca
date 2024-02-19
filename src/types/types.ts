import { type Dispatch, type SetStateAction } from "react";

export type State<T> = Dispatch<SetStateAction<T>>;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
