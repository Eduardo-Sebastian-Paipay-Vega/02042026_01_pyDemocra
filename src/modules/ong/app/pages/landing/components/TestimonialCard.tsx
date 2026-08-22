import { GlassCard } from "./GlassCard";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
}

export function TestimonialCard({ quote, name, role }: TestimonialCardProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <GlassCard hover className="flex flex-col justify-between p-8">
      {/* Quotation mark */}
      <svg
        aria-hidden="true"
        className="mb-5 h-7 w-7 text-[#3D6BFF]/50 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>

      <blockquote className="flex-1 text-[#F5F5F5]/90 leading-[1.7]">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="mt-7 flex items-center gap-3 border-t border-white/[0.06] pt-6">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            background:
              "linear-gradient(135deg, #3D6BFF 0%, #2DBFB0 100%)",
          }}
        >
          <span className="text-[11px] font-bold tracking-wide text-white">
            {initials}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#F5F5F5]">
            {name}
          </p>
          <span className="mt-0.5 inline-block rounded-full bg-[#3D6BFF]/12 px-2.5 py-[3px] text-[11px] font-medium text-[#3D6BFF]">
            {role}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}

