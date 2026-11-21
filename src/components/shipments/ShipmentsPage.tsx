import { Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import type { Role } from "../../api/contracts";
import { getPersona } from "../../api/client";
import { useShipments } from "../../data/shipments";
import type { ShipmentView } from "../../domain/types";
import type { MessageKey } from "../../i18n/en";
import { t } from "../../i18n/t";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { SearchField } from "../ui/SearchField";
import { ToggleButton } from "../ui/ToggleButton";
import { CustomerNotice } from "./CustomerNotice";
import { ShipmentList } from "./ShipmentList";

type FilterKey = "delayed" | "incident" | "customs" | "stale" | "review";

/** What the list filters on; a row re-renders the page only if one of these changes. */
type ListItem = Pick<ShipmentView, "id" | "delivered" | "tags"> & { review: boolean };
const selectList = (shipments: ShipmentView[]): ListItem[] =>
  shipments.map(({ id, delivered, tags, incidents }) => ({
    id,
    delivered,
    tags,
    review: incidents.some((i) => i.type === "ai_pending"),
  }));

const FILTERS: {
  key: FilterKey;
  label: MessageKey;
  match: (v: ListItem) => boolean;
  opsOnly?: boolean;
}[] = [
  {
    key: "delayed",
    label: "ui.filter.delayed",
    match: (v) => v.tags.includes("delayed"),
  },
  {
    key: "incident",
    label: "ui.filter.incident",
    match: (v) => v.tags.includes("incident"),
  },
  {
    key: "customs",
    label: "ui.filter.customs",
    match: (v) => v.tags.includes("customs"),
  },
  {
    key: "stale",
    label: "ui.filter.stale",
    match: (v) => v.tags.includes("stale"),
  },
  {
    key: "review",
    label: "ui.filter.review",
    match: (v) => v.review,
    opsOnly: true,
  },
];

/** Shown by the role routes while their data loads. */
export function PageLoading() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-fg">
      <p className="text-ui text-fg-muted">{t("ui.loading")}</p>
    </main>
  );
}

export function ShipmentsPage({ role }: { role: Role }) {
  const { audience, email, sites = [] } = getPersona(role);
  const isOps = audience === "ops";
  const filters = FILTERS.filter((f) => isOps || !f.opsOnly);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ReadonlySet<FilterKey>>(new Set());
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [showDelivered, setShowDelivered] = useState(false);

  // The API already applied the perimeter: everything below sees only what it returned.
  const views = useShipments(role, selectList);
  const counts = Object.fromEntries(
    filters.map((f) => [f.key, views.filter((v) => !v.delivered && f.match(v)).length]),
  );

  const q = query.trim().toLowerCase();
  const visible = views.filter(
    (v) =>
      v.id.toLowerCase().includes(q) &&
      filters.every((f) => !active.has(f.key) || f.match(v)),
  );
  const activeViews = visible.filter((v) => !v.delivered);
  const deliveredViews =
    active.size === 0 ? visible.filter((v) => v.delivered) : [];
  const deliveredOpen = showDelivered || (q !== "" && deliveredViews.length > 0);

  const toggleFilter = (key: FilterKey) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  const toggleRow = useCallback((id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    }), []);
  const openFromNotice = (id: string) => {
    setQuery("");
    setActive(new Set());
    setExpanded((prev) => new Set(prev).add(id));
    requestAnimationFrame(() =>
      document
        .getElementById(`row-${id}`)
        ?.scrollIntoView({ behavior: "smooth" }),
    );
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-fg">
      <header className="flex flex-col gap-1">
        <Link
          to="/"
          className="text-note text-fg-muted underline-offset-2 hover:underline"
        >
          {t("ui.nav.switchRole")}
        </Link>
        <h1 className="text-title">
          {t(isOps ? "ui.header.ops" : "ui.header.customer")}
        </h1>
        <p className="text-note text-fg-muted">
          {isOps ? sites.join(" · ") : email}
        </p>
      </header>

      {!isOps && (
        <CustomerNotice role={role} onSelect={openFromNotice} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          label={t("ui.search.label")}
          placeholder={t("ui.search.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div
          role="group"
          aria-label={t("ui.filter.label")}
          className="flex flex-wrap gap-2"
        >
          {filters.map((f) => (
            <ToggleButton
              key={f.key}
              pressed={active.has(f.key)}
              count={counts[f.key] ?? 0}
              countTone={
                f.key === "delayed" || f.key === "review"
                  ? "signal"
                  : "neutral"
              }
              onClick={() => toggleFilter(f.key)}
            >
              {t(f.label)}
            </ToggleButton>
          ))}
        </div>
      </div>

      {activeViews.length > 0 ? (
        <ShipmentList
          ids={activeViews.map((v) => v.id)}
          role={role}
          label={t("ui.list.active")}
          expandedIds={expanded}
          onToggle={toggleRow}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-center text-ui text-fg-muted">
          {t("ui.list.empty")}
        </p>
      )}

      {deliveredViews.length > 0 && (
        <section className="flex flex-col gap-2">
          <div>
            <Button
              tone="ghost"
              aria-expanded={deliveredOpen}
              onClick={() => setShowDelivered(!deliveredOpen)}
            >
              <Icon name="chevron-right" rotate={deliveredOpen ? 90 : 0} />
              {t("ui.list.delivered", { n: deliveredViews.length })}
            </Button>
          </div>
          {deliveredOpen && (
            <ShipmentList
              ids={deliveredViews.map((v) => v.id)}
              role={role}
              label={t("ui.list.deliveredLabel")}
              expandedIds={expanded}
              onToggle={toggleRow}
            />
          )}
        </section>
      )}

    </main>
  );
}
