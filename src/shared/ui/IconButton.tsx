import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: "standard" | "tonal";
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({
  variant = "standard",
  children,
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  const tone =
    variant === "tonal"
      ? "bg-secondary-container text-on-secondary-container"
      : "text-on-surface-variant hover:bg-on-surface/8";
  return (
    <button
      type={type}
      className={`inline-flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${tone} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
