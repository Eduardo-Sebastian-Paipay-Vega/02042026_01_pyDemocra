import { ReactNode } from "react";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3";
}

export function GradientText({
  children,
  className = "",
  as: Tag = "span",
}: GradientTextProps) {
  return (
    <Tag
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, #DB7052 0%, #7545E2 55%, #551BB3 100%)",
      }}
    >
      {children}
    </Tag>
  );
}
