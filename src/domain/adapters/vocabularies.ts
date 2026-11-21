// Per-operator status vocabularies, keyed by operator id: exact DHL-shaped `events[].status` text → RoadTag.
// Unknown text → NOT_MAPPED.
import type { RoadTag } from '../types'

export const VOCABULARIES: Record<string, Record<string, RoadTag>> = {
  galicar: {
    'Shipment information received': 'INFO_RECEIVED',
    'Picked up': 'PICKED_UP',
    'In transit': 'IN_TRANSIT',
    'Arrived at facility': 'ARRIVED_AT_HUB',
    'Departed from facility': 'DEPARTED_HUB',
    'Out for delivery': 'OUT_FOR_DELIVERY',
    'Delivered': 'DELIVERED',
  },
  moncayo: {
    'Información recibida': 'INFO_RECEIVED',
    'Recogido': 'PICKED_UP',
    'En tránsito': 'IN_TRANSIT',
    'Llegada a plataforma': 'ARRIVED_AT_HUB',
    'Salida de plataforma': 'DEPARTED_HUB',
    'Control documental fallido': 'DOCUMENTS_MISSING',
    'En reparto': 'OUT_FOR_DELIVERY',
    'Entregado': 'DELIVERED',
  },
  transpirineo: {
    'Booking received': 'INFO_RECEIVED',
    'Collected': 'PICKED_UP',
    'On route': 'IN_TRANSIT',
    'Border crossing': 'BORDER_CROSSED',
    'Out for delivery': 'OUT_FOR_DELIVERY',
    'Delivered': 'DELIVERED',
  },
  bajio: {
    'Recolectado': 'PICKED_UP',
    'En tránsito': 'IN_TRANSIT',
    'En ruta de entrega': 'OUT_FOR_DELIVERY',
    'Entregado': 'DELIVERED',
  },
}
