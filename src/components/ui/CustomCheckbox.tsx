import { Checkbox, type CheckboxProps } from "@nextui-org/react";
import { cn } from "@/lib/utils/cn";
import { type FC, type JSX } from "react";

const CustomCheckbox: FC<CheckboxProps> = (props): JSX.Element => (
  <Checkbox
    {...props}
    size="lg"
    className={cn(
      "font-extralight text-white",
      props.disabled ? "opacity-50" : ""
    )}
  >
    {props.children}
  </Checkbox>
);

export default CustomCheckbox;
