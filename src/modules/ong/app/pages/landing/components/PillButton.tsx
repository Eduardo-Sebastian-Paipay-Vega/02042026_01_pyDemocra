import { ReactNode } from "react";

interface PillButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070707]",
  "active:translate-y-0 active:scale-[0.98]",
].join(" ");

export function PillButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  type = "button",
}: PillButtonProps) {
  if (variant === "primary") {
    return (
      <button
        type={type}
        onClick={onClick}
        className={[
          base,
          sizes[size],
          "text-white font-semibold",
          "shadow-[0_8px_32px_rgba(0,46,254,0.30)]",
          "hover:shadow-[0_14px_44px_rgba(0,46,254,0.40)]",
          className,
        ].join(" ")}
        style={{
          backgroundImage:
            "linear-gradient(90deg, #3D6BFF 0%, #2DBFB0 100%)",
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
      className={[
        base,
        sizes[size],
        "text-[#F5F5F5] font-medium",
        "border border-white/[0.1] bg-[#121212]/60 backdrop-blur-sm",
        "hover:border-white/[0.2] hover:bg-[#181818]/80",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
