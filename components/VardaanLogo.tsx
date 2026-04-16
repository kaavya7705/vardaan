import clsx from "clsx";

type VardaanLogoProps = {
  className?: string;
  textClassName?: string;
  compact?: boolean;
  light?: boolean;
};

export default function VardaanLogo({
  className,
  textClassName,
  compact = false,
  light = false,
}: VardaanLogoProps) {
  const textColor = light ? "text-white" : "text-slate-900";

  return (
    <div className={clsx("inline-flex items-center gap-3", className)}>
      <div className="relative h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-amber-300 via-orange-400 to-cyan-500 p-[2px] shadow-[0_10px_24px_rgba(14,116,144,0.28)]">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-slate-950">
          <div className="absolute -top-2 left-1/2 h-4 w-8 -translate-x-1/2 rounded-b-full bg-orange-300/80 blur-sm" />
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-cyan-300/30 to-transparent" />
          <span className="font-serif text-2xl font-semibold text-white">V</span>
        </div>
      </div>
      {!compact && (
        <div className={clsx("font-serif font-bold tracking-tight leading-tight", textColor, textClassName)}>
          <span className="text-2xl block">Vardaan</span>
          <span className="text-[10px] tracking-[0.15em] uppercase font-semibold opacity-70 block">Builders & Contractors</span>
        </div>
      )}
    </div>
  );
}
