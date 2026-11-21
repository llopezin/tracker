import type { ComponentProps, ReactNode } from "react";

export type EtaFlagTone = "solid-signal" | "dashed" | "dashed-strong";

export type EtaFlagProps = Omit<
  ComponentProps<"span">,
  "className" | "style"
> & {
  tone: EtaFlagTone;
  icon?: ReactNode;
};

const baseClasses =
  "inline-flex items-center gap-1.25 whitespace-nowrap rounded-sm px-1.75";

const toneClasses: Record<EtaFlagTone, string> = {
  "solid-signal":
    "py-px font-mono tabular-nums text-meta font-bold bg-signal text-on-solid",
  dashed:
    "border border-dashed border-mid text-body font-semibold text-fg-muted",
  "dashed-strong":
    "border-[1.5px] border-dashed border-fg-muted text-note font-semibold text-fg-soft",
};

export function EtaFlag({ tone, icon, children, ...rest }: EtaFlagProps) {
  return (
    <span className={`${baseClasses} ${toneClasses[tone]}`} {...rest}>
      {icon}
      {children}
    </span>
  );
}
