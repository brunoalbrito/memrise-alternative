import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "filled" | "tonal" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  filled:
    "bg-primary text-on-primary hover:shadow-m3-1 disabled:bg-on-surface/12 disabled:text-on-surface/38",
  tonal:
    "bg-secondary-container text-on-secondary-container hover:shadow-m3-1 disabled:bg-on-surface/12 disabled:text-on-surface/38",
  text: "text-primary hover:bg-primary/8 disabled:text-on-surface/38",
};

export function Button({
  variant = "filled",
  icon,
  children,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-6 text-label-large font-medium transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:opacity-90 disabled:cursor-not-allowed ${
        icon ? "pl-4" : ""
      } ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
