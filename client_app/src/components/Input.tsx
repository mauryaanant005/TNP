"use client";
import { Input as ShadCnInput } from "./ui/input";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useFormContext } from "react-hook-form";
export const Input = ({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) => {
  const form = useFormContext();
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-md font-semibold">{label}</FormLabel>
          <FormControl>
            {type === "file" ? (
              <ShadCnInput
                type="file"
                onChange={(e) => {
                  const file = e.target.files ? e.target.files[0] : null;
                  field.onChange(file); // Handle file input change
                }}
              />
            ) : (
              <ShadCnInput
                placeholder={`Enter the ${label}`}
                {...field}
                type={type}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
