import { ReactNode } from "react";

interface PillButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

const sizes = {
  sm: "px-5 py-2 text-[13px]",
  md: "px-6 py-2.5 text-[14px]",
  lg: "px-8 py-3.5 text-[15px]",
};

const base = [
  "inline-flex items-center justify-center rounded-full cursor-pointer",
  "transition-all duration-200 ease-out",
  "hover:-translate-y-[2px]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0055FF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070707]",
  "active:translate-y-0 active:scale-[0.98]",
  "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
].join(" ");

export function PillButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  type = "button",
  disabled = false,
}: PillButtonProps) {
  if (variant === "primary") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={[
          base,
          sizes[size],
          "text-white font-semibold",
          "shadow-[0_0_24px_rgba(0,85,255,0.3)]",
          "hover:shadow-[0_0_36px_rgba(0,85,255,0.45)]",
          className,
        ].join(" ")}
        style={{
          backgroundImage:
            "linear-gradient(135deg, #0055FF 0%, #3b82f6 100%)",
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        base,
        sizes[size],
        "text-[#F5F5F5] font-medium",
        "border border-white/[0.1] bg-white/[0.04] backdrop-blur-sm",
        "hover:border-white/[0.22] hover:bg-white/[0.08]",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

