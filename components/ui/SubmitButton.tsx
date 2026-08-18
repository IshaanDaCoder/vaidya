"use client";

import { useFormStatus } from "react-dom";
import { buttonVariants } from "./styles";

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// A submit button that actually shows it's working — plain <button
// formAction> gives zero feedback between click and the page reloading,
// which reads as broken on anything but an instant connection.
// useFormStatus only reports pending state inside a descendant of the
// <form>, hence this being its own client component rather than a prop
// on the server-rendered pages that use it.
export function SubmitButton({
  children,
  pendingText = "Please wait…",
  formAction,
  variant = "primary",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  formAction: (formData: FormData) => void | Promise<void>;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      className={`${buttonVariants(variant, size)} ${className}`}
    >
      {pending && <Spinner />}
      {pending ? pendingText : children}
    </button>
  );
}
