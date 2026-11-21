export const detailIdOf = (shipmentId: string) => `${shipmentId}-detail`

/** An action's button unmounts once it is done; keep keyboard focus inside the row's (stable) detail container. */
export const focusDetail = (shipmentId: string) => document.getElementById(detailIdOf(shipmentId))?.focus()

export const aiReviewIdOf = (shipmentId: string) => `${shipmentId}-ai-review`

/** Scrolls the shipment's pending AI reading into view and moves focus to its Accept button. */
export const focusAiReview = (shipmentId: string) => {
  const el = document.getElementById(aiReviewIdOf(shipmentId))
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el?.querySelector('button')?.focus({ preventScroll: true })
}
