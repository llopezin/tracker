import type { ComponentProps } from "react";

export type IconTileTone =
  | "soft-accent"
  | "solid-signal"
  | "soft-signal"
  | "dotted"
  | "dashed-strong"
  | "neutral"
  | "solid";

export type IconTileSize = "md" | "sm";

export type IconTileProps = Omit<
  ComponentProps<"span">,
  "className" | "style"
> & {
  tone: IconTileTone;
  size?: IconTileSize;
  label?: string;
};

// dotted: keep border and text in sync with Chip; dashed-strong, with EtaFlag.
const toneClasses: Record<IconTileTone, string> = {
  "soft-accent": "bg-accent-soft text-accent",
  "solid-signal": "bg-signal text-on-solid",
  "soft-signal": "border border-signal-border bg-signal-soft text-signal-fg",
  dotted: "border-[1.5px] border-dotted border-fg bg-surface-muted text-fg",
  "dashed-strong":
    "border-[1.5px] border-dashed border-fg-muted bg-surface-muted text-fg-soft",
  neutral: "border border-border bg-page text-fg-subtle",
  solid: "bg-fg text-on-solid",
};

const sizeClasses: Record<IconTileSize, string> = {
  md: "size-10 rounded-lg",
  sm: "size-8 rounded-md",
};

export function IconTile({ tone, size = "md", label, ...rest }: IconTileProps) {
  const a11y = label ? { role: "img", "aria-label": label } : {};
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${sizeClasses[size]} ${toneClasses[tone]}`}
      {...rest}
      {...a11y}
    />
  );
}
