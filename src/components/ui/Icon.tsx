import type { ReactNode } from "react";

export type IconName =
  | "truck"
  | "ship"
  | "hold"
  | "clock"
  | "doc"
  | "doc-alert"
  | "box"
  | "check"
  | "chevron-down"
  | "chevron-right"
  | "search"
  | "alert-triangle";

export type IconSize = 12 | 14 | 16 | 18 | 20;
export type IconRotate = 0 | 90 | 180;

export type IconProps = {
  name: IconName;
  size?: IconSize;
  rotate?: IconRotate;
  label?: string;
};

type IconDef = {
  sw: number;
  cap?: "round";
  join?: "round";
  body: ReactNode;
};

const docBody = (
  <>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4" />
  </>
);

const icons: Record<IconName, IconDef> = {
  truck: {
    sw: 1.8,
    join: "round",
    body: (
      <>
        <path d="M3 6h11v9H3z" />
        <path d="M14 9h4l3 3v3h-7z" />
        <circle cx="7" cy="17" r="1.8" />
        <circle cx="17" cy="17" r="1.8" />
      </>
    ),
  },
  ship: {
    sw: 1.8,
    join: "round",
    body: (
      <>
        <path d="M3.5 14.5l2 5h13l2-5z" />
        <path d="M6 14.5V9h12v5.5" />
        <path d="M10 9V5h4v4" />
      </>
    ),
  },
  hold: {
    sw: 1.9,
    join: "round",
    body: (
      <>
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
        <path d="M10 9.5v5M14 9.5v5" />
      </>
    ),
  },
  clock: {
    sw: 2,
    cap: "round",
    body: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
  },
  doc: {
    sw: 1.8,
    join: "round",
    body: docBody,
  },
  "doc-alert": {
    sw: 1.8,
    cap: "round",
    join: "round",
    body: (
      <>
        {docBody}
        <path d="M12 10.5v4.5" />
        <path d="M12 17.6v.4" />
      </>
    ),
  },
  box: {
    sw: 1.8,
    join: "round",
    body: (
      <>
        <path d="M4 7.5l8-4 8 4v9l-8 4-8-4z" />
        <path d="M4 7.5l8 4 8-4" />
        <path d="M12 11.5v9" />
      </>
    ),
  },
  check: {
    sw: 2.2,
    cap: "round",
    body: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  },
  "chevron-down": {
    sw: 2,
    cap: "round",
    body: <path d="M6 9l6 6 6-6" />,
  },
  "chevron-right": {
    sw: 2,
    body: <path d="M9 6l6 6-6 6" />,
  },
  search: {
    sw: 2,
    body: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4.5 4.5" />
      </>
    ),
  },
  "alert-triangle": {
    sw: 2,
    cap: "round",
    body: (
      <>
        <path d="M12 4l9 16H3z" />
        <path d="M12 10v4.5" />
        <path d="M12 17.5v.3" />
      </>
    ),
  },
};

const rotateClasses: Record<IconRotate, string> = {
  0: "",
  90: "rotate-90",
  180: "rotate-180",
};

export function Icon({ name, size = 16, rotate = 0, label }: IconProps) {
  const icon = icons[name];
  const a11y = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true };
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.sw}
      strokeLinecap={icon.cap}
      strokeLinejoin={icon.join}
      className={`shrink-0 transition-transform ${rotateClasses[rotate]}`}
      {...a11y}
    >
      {icon.body}
    </svg>
  );
}
