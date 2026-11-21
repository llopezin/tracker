// Per-leg state machine. Dates are compared with Date.parse on ISO strings.
import type { Mode, OrderResult, RoadTag, SeaTag, StatusUpdate } from "./types";

type Tag = RoadTag | SeaTag;

export type LegEvent = Pick<
  StatusUpdate<Tag>,
  "tag" | "occurredAt" | "confidence"
>;

export interface LegState {
  mode: Mode;
  status?: Tag; // undefined until the first ACT milestone
  statusAt?: number; // ms of the event that set `status`
  seen: readonly { tag: Tag; at: number }[]; // recorded ACT events only
  closed: boolean; // final state, CANCELLED, or closed by the next leg
}

const ROAD_RANK = {
  INFO_RECEIVED: 0,
  PICKED_UP: 1,
  IN_TRANSIT: 2,
  ARRIVED_AT_HUB: 2,
  DEPARTED_HUB: 2,
  BORDER_CROSSED: 2,
  CUSTOMS_IN_PROGRESS: 2,
  CUSTOMS_HOLD: 2,
  CUSTOMS_RELEASED: 2,
  OUT_FOR_DELIVERY: 3,
  ARRIVED_AT_DELIVERY: 3,
  READY_FOR_PICKUP: 3,
  DELIVERED: 4,
} satisfies Partial<Record<RoadTag, number>>;

const SEA_RANK = {
  BOOKING_CONFIRMED: 0,
  EMPTY_DISPATCHED: 0,
  GATE_IN_ORIGIN: 1,
  LOADED_ON_VESSEL: 2,
  VESSEL_DEPARTED: 3,
  AT_SEA: 3,
  VESSEL_ARRIVED: 4,
  DISCHARGED: 5,
  CUSTOMS_HOLD: 6,
  CUSTOMS_RELEASED: 6,
  READY_FOR_PICKUP: 6,
  GATE_OUT_DESTINATION: 7,
} satisfies Partial<Record<SeaTag, number>>;

const FINAL: Record<Mode, Tag> = {
  road: "DELIVERED",
  sea: "GATE_OUT_DESTINATION",
};

function rankOf(mode: Mode, tag: Tag): number | undefined {
  const table: Partial<Record<Tag, number>> =
    mode === "road" ? ROAD_RANK : SEA_RANK;
  return table[tag];
}

export function initialLegState(mode: Mode): LegState {
  return { mode, seen: [], closed: false };
}

export function applyEvent(
  state: LegState,
  event: LegEvent,
): { state: LegState; result: OrderResult } {
  // EST/PLN and NOT_MAPPED never enter the machine and are not recorded in `seen`.
  if (event.confidence !== "ACTUAL" || event.tag === "NOT_MAPPED")
    return { state, result: "history" };

  const tag = event.tag;
  const at = Date.parse(event.occurredAt);
  if (state.seen.some((s) => s.tag === tag && s.at === at))
    return { state, result: "duplicate" };

  const seen = [...state.seen, { tag, at }];

  if (state.closed) {
    // A closed leg applies nothing; EMPTY_RETURNED is still recorded.
    return tag === "EMPTY_RETURNED"
      ? { state: { ...state, seen }, result: "applied" }
      : { state, result: "history" };
  }

  if (tag === "CANCELLED")
    return {
      state: { ...state, status: tag, statusAt: at, seen, closed: true },
      result: "applied",
    };

  const rank = rankOf(state.mode, tag);
  // Rankless (DOCUMENTS_MISSING, BREAKDOWN, DELAYED, EXCEPTION, DELIVERY_FAILED, EMPTY_RETURNED before final,
  // or a tag outside this mode's table): recorded as a live step, status unchanged.
  if (rank === undefined)
    return { state: { ...state, seen }, result: "applied" };

  const current =
    state.status === undefined ? undefined : rankOf(state.mode, state.status);
  if (current === undefined || rank >= current) {
    const closed = tag === FINAL[state.mode];
    return {
      state: { ...state, status: tag, statusAt: at, seen, closed },
      result: "applied",
    };
  }

  const later = state.statusAt !== undefined && at > state.statusAt;
  if (!later && !state.seen.some((s) => s.tag === tag))
    return { state: { ...state, seen }, result: "history" };
  return { state, result: "rejected" };
}

/**
 * Applies an event to legs[legIndex]. An applied ACT event closes every earlier leg (their missing
 * milestones stay unreported). currentLegIndex = last leg with a status.
 */
export function applyToShipment(
  legs: readonly LegState[],
  legIndex: number,
  event: LegEvent,
): { legs: LegState[]; result: OrderResult; currentLegIndex: number } {
  const { state, result } = applyEvent(legs[legIndex], event);
  // Only an event that set the status (ranked tag or CANCELLED) closes earlier legs; rankless ones don't.
  const closePrevious = result === "applied" && state.status === event.tag;
  const next = legs.map((leg, i) => {
    if (i === legIndex) return state;
    if (i < legIndex && closePrevious && !leg.closed)
      return { ...leg, closed: true };
    return leg;
  });
  return { legs: next, result, currentLegIndex: currentLegIndex(next) };
}

export function currentLegIndex(legs: readonly LegState[]): number {
  for (let i = legs.length - 1; i >= 0; i--)
    if (legs[i].status !== undefined) return i;
  return 0;
}
