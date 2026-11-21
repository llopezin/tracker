export const detailIdOf = (shipmentId: string) => `${shipmentId}-detail`

/** An action's button unmounts once it is done; keep keyboard focus inside the row's (stable) detail container. */
export const focusDetail = (shipmentId: string) => document.getElementById(detailIdOf(shipmentId))?.focus()
