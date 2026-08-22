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
          "linear-gradient(90deg, #3D6BFF 0%, #2DBFB0 100%)",
      }}
    >
      {children}
    </Tag>
  );
}

