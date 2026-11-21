// 7 synthetic shipments (PRD §6). Timeline built backwards from NOW = 2026-11-22T10:40+01:00.
// Raw payloads use the shapes in docs/api-responses.md. All names and numbers are invented.
import type { Place } from "../../domain/types";
import type { ShipmentPayload } from "../../api/contracts";

export const ACCOUNTS = {
  acmeMexico: "acc-acme-mexico",
  finalClient: "acc-final-client",
} as const;

const ZARAGOZA_PLANT: Place = {
  name: "Zaragoza Plant",
  unlocode: "ESZAZ",
  countryCode: "ES",
};
const VALENCIA_WAREHOUSE: Place = {
  name: "Valencia Warehouse",
  unlocode: "ESVLC",
  countryCode: "ES",
};
const BILBAO_PLANT: Place = {
  name: "Bilbao Plant",
  unlocode: "ESBIO",
  countryCode: "ES",
};
const VALENCIA_PORT: Place = {
  name: "Valencia, Muelle Sur Terminal",
  unlocode: "ESVLC",
  countryCode: "ES",
};
const VERACRUZ_PORT: Place = {
  name: "Veracruz, Terminal Golfo",
  unlocode: "MXVER",
  countryCode: "MX",
};
const ROTTERDAM_PORT: Place = {
  name: "Rotterdam",
  unlocode: "NLRTM",
  countryCode: "NL",
};
const LYON: Place = { name: "Lyon", unlocode: "FRLYS", countryCode: "FR" };
const MADRID: Place = { name: "Madrid", unlocode: "ESMAD", countryCode: "ES" };
const STUTTGART: Place = {
  name: "Stuttgart",
  unlocode: "DESTR",
  countryCode: "DE",
};
const EINDHOVEN: Place = {
  name: "Eindhoven",
  unlocode: "NLEIN",
  countryCode: "NL",
};
const QUERETARO: Place = {
  name: "Querétaro",
  unlocode: "MXQRO",
  countryCode: "MX",
};

const addr = (addressLocality: string, countryCode: string) => ({
  address: { addressLocality, countryCode },
});
// DCSA transport calls: port + voyage + vessel.
const call = (UNLocationCode: string, locationName: string, carrierVoyageNumber: string, vesselName: string) => ({
  UNLocationCode,
  location: { locationName },
  carrierVoyageNumber,
  vessel: { vesselName },
});
const VLC_MERIDIA = call("ESVLC", "Valencia", "112N", "MERIDIA STAR");
const RTM_MERIDIA = call("NLRTM", "Rotterdam", "112N", "MERIDIA STAR");
const VLC_NDH_044 = call("ESVLC", "Valencia", "044W", "NORDHAVEN AURORA");
const VER_NDH_044 = call("MXVER", "Veracruz", "044W", "NORDHAVEN AURORA");
const VLC_NDH_047 = call("ESVLC", "Valencia", "047W", "NORDHAVEN BOREALIS");
const VER_NDH_047 = call("MXVER", "Veracruz", "047W", "NORDHAVEN BOREALIS");

// ── ACM-24812 · Galicar · on time, ETA window, one unknown status ──
const acm24812: ShipmentPayload = {
  record: {
    id: "ACM-24812",
    description: "Centrifugal pump housings (12 pallets)",
    po: "PO-MP-55120",
    customerAccount: "acc-millenium-pompes",
    customerName: "Millénium Pompes SAS",
    originSite: ZARAGOZA_PLANT,
    destination: LYON,
    plannedDelivery: "2026-11-23T18:00:00+01:00",
    legs: [
      {
        mode: "road",
        operatorId: "galicar",
        from: ZARAGOZA_PLANT,
        to: LYON,
        plan: {
          PICKED_UP: "2026-11-21T15:00:00+01:00",
          DELIVERED: "2026-11-23T18:00:00+01:00",
        },
      },
    ],
    documents: [{ key: "cmr", name: "e-CMR", status: "ok" }],
  },
  rawUpdates: [
    {
      emailIds: [],
      raw: [
        {
          format: "dhl",
          data: {
            id: "JD014600006281230704",
            service: "freight",
            origin: addr("Zaragoza", "ES"),
            destination: {
              address: {
                addressLocality: "Lyon",
                postalCode: "69007",
                countryCode: "FR",
              },
            },
            status: {
              timestamp: "2026-11-22T09:40:00+01:00",
              statusCode: "transit",
              status: "Departed from facility",
              description: "The shipment has left the facility",
              location: addr("Barcelona", "ES"),
            },
            agreedDeliveryDate: "2026-11-23T18:00:00+01:00",
            estimatedDeliveryTimeFrame: {
              estimatedFrom: "2026-11-23T12:00:00+01:00",
              estimatedThrough: "2026-11-23T16:00:00+01:00",
            },
            estimatedTimeOfDeliveryRemark: "Delivery expected in the afternoon",
            events: [
              {
                timestamp: "2026-11-22T09:40:00+01:00",
                statusCode: "transit",
                status: "Departed from facility",
                location: addr("Barcelona", "ES"),
              },
              {
                timestamp: "2026-11-21T22:30:00+01:00",
                statusCode: "transit",
                status: "Linehaul manifest closed",
                location: addr("Barcelona", "ES"),
              },
              {
                timestamp: "2026-11-21T16:10:00+01:00",
                statusCode: "transit",
                status: "Picked up",
                location: addr("Zaragoza", "ES"),
              },
            ],
          },
        },
      ],
    },
  ],
};

// ── ACM-24801 · Moncayo · not departed, DeCA missing ──
const acm24801: ShipmentPayload = {
  record: {
    id: "ACM-24801",
    description: "Gearbox assemblies (6 crates)",
    po: "PO-TE-20931",
    customerAccount: "acc-talleres-ebro",
    customerName: "Talleres Ebro S.L.",
    originSite: ZARAGOZA_PLANT,
    destination: MADRID,
    plannedDelivery: "2026-11-24T12:00:00+01:00",
    legs: [
      {
        mode: "road",
        operatorId: "moncayo",
        from: ZARAGOZA_PLANT,
        to: MADRID,
        plan: {
          PICKED_UP: "2026-11-23T08:00:00+01:00",
          DELIVERED: "2026-11-24T12:00:00+01:00",
        },
      },
    ],
    documents: [
      {
        key: "deca",
        name: "DeCA",
        status: "missing",
        note: "Required for contracted domestic road transport",
      },
    ],
  },
  rawUpdates: [
    {
      emailIds: [],
      raw: [
        {
          format: "dhl",
          data: {
            id: "MCY-2611-04417",
            service: "freight",
            origin: addr("Zaragoza", "ES"),
            destination: addr("Madrid", "ES"),
            status: {
              timestamp: "2026-11-21T12:00:00+01:00",
              statusCode: "pre-transit",
              status: "Información recibida",
              location: addr("Zaragoza", "ES"),
            },
            events: [
              {
                timestamp: "2026-11-21T12:00:00+01:00",
                statusCode: "pre-transit",
                status: "Información recibida",
                location: addr("Zaragoza", "ES"),
              },
            ],
          },
        },
      ],
    },
  ],
};

// ── ACM-24790 · TransPirineo · JSON in transit + breakdown email (AI pending) ──
const acm24790: ShipmentPayload = {
  record: {
    id: "ACM-24790",
    description: "Hydraulic valve blocks (8 pallets)",
    po: "PO-FC-7781",
    customerAccount: ACCOUNTS.finalClient,
    customerName: "Final client",
    originSite: VALENCIA_WAREHOUSE,
    destination: STUTTGART,
    plannedDelivery: "2026-11-23T17:00:00+01:00",
    legs: [
      {
        mode: "road",
        operatorId: "transpirineo",
        from: VALENCIA_WAREHOUSE,
        to: STUTTGART,
        plan: {
          PICKED_UP: "2026-11-20T14:00:00+01:00",
          DELIVERED: "2026-11-23T17:00:00+01:00",
        },
      },
    ],
    documents: [{ key: "cmr", name: "e-CMR", status: "ok" }],
  },
  rawUpdates: [
    {
      emailIds: ["email-transpirineo-24790"],
      raw: [
        {
          format: "dhl",
          data: {
            id: "TP-88213",
            service: "freight",
            origin: addr("Valencia", "ES"),
            destination: addr("Stuttgart", "DE"),
            status: {
              timestamp: "2026-11-21T21:30:00+01:00",
              statusCode: "transit",
              status: "On route",
              location: addr("Montélimar", "FR"),
            },
            estimatedDeliveryTimeFrame: { estimatedFrom: "2026-11-23T15:00:00+01:00" },
            events: [
              {
                timestamp: "2026-11-21T21:30:00+01:00",
                statusCode: "transit",
                status: "On route",
                location: addr("Montélimar", "FR"),
              },
              {
                timestamp: "2026-11-21T11:05:00+01:00",
                statusCode: "transit",
                status: "Border crossing",
                location: addr("Le Perthus", "FR"),
              },
              {
                timestamp: "2026-11-20T15:20:00+01:00",
                statusCode: "transit",
                status: "Collected",
                location: addr("Valencia", "ES"),
              },
            ],
          },
        },
      ],
    },
  ],
};

// ── ACM-24755 · Meridia · sea + road, stale: last event 2026-11-18T18:40+01:00 (88 h) ──
const acm24755: ShipmentPayload = {
  record: {
    id: "ACM-24755",
    description: "Industrial compressors (1×40HC)",
    po: "PO-AB-3302",
    customerAccount: "acc-acme-benelux",
    customerName: "Acme Benelux B.V.",
    originSite: VALENCIA_WAREHOUSE,
    destination: EINDHOVEN,
    plannedDelivery: "2026-11-27T12:00:00+01:00",
    legs: [
      {
        mode: "sea",
        operatorId: "meridia",
        from: VALENCIA_PORT,
        to: ROTTERDAM_PORT,
        plan: {
          VESSEL_DEPARTED: "2026-11-18T12:00:00+01:00",
          VESSEL_ARRIVED: "2026-11-24T12:00:00+01:00",
        },
      },
      {
        mode: "road",
        operatorId: "meridia",
        from: ROTTERDAM_PORT,
        to: EINDHOVEN,
        plan: { DELIVERED: "2026-11-27T12:00:00+01:00" },
      },
    ],
    documents: [{ key: "bl", name: "Bill of lading", status: "ok" }],
  },
  rawUpdates: [
    {
      emailIds: [],
      raw: [
        {
          format: "dcsa",
          data: [
            { eventID: "mrd-24755-01", eventType: "EQUIPMENT", eventTypeCode: "GTIN", eventClassifierCode: "ACT", eventDateTime: "2026-11-16T09:15:00Z", eventCreatedDateTime: "2026-11-16T09:15:00Z", transportCall: VLC_MERIDIA, equipmentReference: "MSKU4471230" },
            { eventID: "mrd-24755-02", eventType: "EQUIPMENT", eventTypeCode: "LOAD", eventClassifierCode: "ACT", eventDateTime: "2026-11-17T23:30:00Z", eventCreatedDateTime: "2026-11-17T23:30:00Z", transportCall: VLC_MERIDIA, equipmentReference: "MSKU4471230" },
            { eventID: "mrd-24755-03", eventType: "TRANSPORT", eventTypeCode: "DEPA", eventClassifierCode: "ACT", eventDateTime: "2026-11-18T17:40:00Z", eventCreatedDateTime: "2026-11-18T17:40:00Z", transportCall: VLC_MERIDIA },
            { eventID: "mrd-24755-04", eventType: "TRANSPORT", eventTypeCode: "ARRI", eventClassifierCode: "EST", eventDateTime: "2026-11-24T08:00:00Z", eventCreatedDateTime: "2026-11-18T17:40:00Z", transportCall: RTM_MERIDIA },
          ],
        },
      ],
    },
    // Carrier haulage leg: no feed yet (Meridia is the only operator listed for this shipment).
    { emailIds: [], raw: [{ format: "dhl", data: { id: "MRD-CH-3302", events: [] } }] },
  ],
};

// ── ACM-24817 · Moncayo → Nordhaven → Terminal Golfo (hold) → Logística Bajío ──
// Arrival planned 16 Nov, actual 18 Nov (plan missed). Hold seen by Terminal API (checked 22 Nov) and Aduanas Golfo email (accepted).
const ARRIVED_24817 = "2026-11-18T06:20:00Z"; // same string in DCSA ARRI ACT and Terminal49 pod_arrived_at
const acm24817: ShipmentPayload = {
  record: {
    id: "ACM-24817",
    description: "Spare parts for assembly line (1×40HC)",
    po: "PO-AMX-1188",
    customerAccount: ACCOUNTS.acmeMexico,
    customerName: "Acme México",
    originSite: ZARAGOZA_PLANT,
    destination: QUERETARO,
    plannedDelivery: "2026-11-25T18:00:00-06:00",
    legs: [
      {
        mode: "road",
        operatorId: "moncayo",
        from: ZARAGOZA_PLANT,
        to: VALENCIA_PORT,
        plan: {
          PICKED_UP: "2026-10-31T09:00:00+01:00",
          DELIVERED: "2026-10-31T16:00:00+01:00",
        },
      },
      {
        mode: "sea",
        operatorId: "nordhaven",
        from: VALENCIA_PORT,
        to: VERACRUZ_PORT,
        plan: {
          VESSEL_DEPARTED: "2026-11-04T10:00:00+01:00",
          VESSEL_ARRIVED: "2026-11-16T08:00:00-06:00",
        },
      },
      {
        mode: "road",
        operatorId: "bajio",
        from: VERACRUZ_PORT,
        to: QUERETARO,
        plan: {
          PICKED_UP: "2026-11-23T08:00:00-06:00",
          DELIVERED: "2026-11-25T18:00:00-06:00",
        },
      },
    ],
    documents: [
      { key: "deca", name: "DeCA", status: "ok" },
      {
        key: "invoice",
        name: "Commercial invoice",
        status: "flagged",
        note: "Values do not match the packing list",
      },
      {
        key: "invoice-corrected",
        name: "Corrected commercial invoice",
        status: "missing",
      },
    ],
  },
  rawUpdates: [
    {
      emailIds: [],
      raw: [
        {
          format: "dhl",
          data: {
            id: "MCY-2610-03981",
            service: "freight",
            origin: addr("Zaragoza", "ES"),
            destination: addr("Valencia", "ES"),
            status: {
              timestamp: "2026-10-31T15:40:00+01:00",
              statusCode: "delivered",
              status: "Entregado",
              location: addr("Valencia", "ES"),
            },
            events: [
              {
                timestamp: "2026-10-31T15:40:00+01:00",
                statusCode: "delivered",
                status: "Entregado",
                location: addr("Valencia", "ES"),
              },
              {
                timestamp: "2026-10-31T09:10:00+01:00",
                statusCode: "transit",
                status: "Recogido",
                location: addr("Zaragoza", "ES"),
              },
              {
                timestamp: "2026-10-30T12:00:00+01:00",
                statusCode: "pre-transit",
                status: "Información recibida",
                location: addr("Zaragoza", "ES"),
              },
            ],
          },
        },
      ],
    },
    {
      emailIds: ["email-aduanas-24817"],
      raw: [
        {
          format: "dcsa",
          data: [
            { eventID: "ndh-24817-01", eventType: "EQUIPMENT", eventTypeCode: "GTIN", eventClassifierCode: "ACT", eventDateTime: "2026-11-01T10:00:00Z", eventCreatedDateTime: "2026-11-01T10:00:00Z", transportCall: VLC_NDH_044, equipmentReference: "NDHU7654321" },
            { eventID: "ndh-24817-02", eventType: "EQUIPMENT", eventTypeCode: "LOAD", eventClassifierCode: "ACT", eventDateTime: "2026-11-03T14:00:00Z", eventCreatedDateTime: "2026-11-03T14:00:00Z", transportCall: VLC_NDH_044, equipmentReference: "NDHU7654321" },
            { eventID: "ndh-24817-03", eventType: "TRANSPORT", eventTypeCode: "DEPA", eventClassifierCode: "ACT", eventDateTime: "2026-11-04T09:00:00Z", eventCreatedDateTime: "2026-11-04T09:00:00Z", transportCall: VLC_NDH_044 },
            { eventID: "ndh-24817-04", eventType: "TRANSPORT", eventTypeCode: "ARRI", eventClassifierCode: "ACT", eventDateTime: ARRIVED_24817, eventCreatedDateTime: ARRIVED_24817, transportCall: VER_NDH_044 },
          ],
        },
        {
          format: "terminal49",
          data: {
            data: {
              id: "7d1c0000-0000-4000-8000-000000000001",
              type: "container",
              attributes: {
                number: "NDHU7654321",
                current_status: "not_available",
                available_for_pickup: false,
                availability_known: true,
                holds_at_pod_terminal: [
                  {
                    name: "customs",
                    status: "hold",
                    description: "Documentary review",
                  },
                ],
                fees_at_pod_terminal: [],
                pod_arrived_at: ARRIVED_24817,
                pod_discharged_at: "2026-11-18T21:05:00Z",
                pickup_lfd: "2026-11-25T06:00:00Z",
                import_deadlines: {
                  pickup_lfd_line: "2026-11-25T06:00:00Z",
                  pickup_lfd_terminal: "2026-11-23T06:00:00Z",
                  pickup_lfd_rail: null,
                },
                ind_eta_at: null,
                pod_timezone: "America/Mexico_City",
                terminal_checked_at: "2026-11-22T08:30:00Z",
              },
            },
          },
        },
      ],
    },
    {
      emailIds: [],
      raw: [
        {
          format: "dhl",
          data: { id: "LBJ-MX-55021", service: "freight", events: [] },
        },
      ],
    },
  ],
};

// ── ACM-24866 · Nordhaven · at sea, only EST ARRI MXVER 5 Dec (ETA to next stop) ──
const acm24866: ShipmentPayload = {
  record: {
    id: "ACM-24866",
    description: "Control cabinets (1×40HC)",
    po: "PO-AMX-1204",
    customerAccount: ACCOUNTS.acmeMexico,
    customerName: "Acme México",
    originSite: VALENCIA_WAREHOUSE,
    destination: QUERETARO,
    plannedDelivery: "2026-12-08T18:00:00-06:00",
    legs: [
      {
        mode: "sea",
        operatorId: "nordhaven",
        from: VALENCIA_PORT,
        to: VERACRUZ_PORT,
        plan: {
          VESSEL_DEPARTED: "2026-11-13T12:00:00+01:00",
          VESSEL_ARRIVED: "2026-12-05T12:00:00-06:00",
        },
      },
      {
        mode: "road",
        operatorId: "nordhaven",
        from: VERACRUZ_PORT,
        to: QUERETARO,
        plan: { DELIVERED: "2026-12-08T18:00:00-06:00" },
      },
    ],
    documents: [{ key: "bl", name: "Bill of lading", status: "ok" }],
  },
  rawUpdates: [
    {
      emailIds: [],
      raw: [
        {
          format: "dcsa",
          data: [
            { eventID: "ndh-24866-01", eventType: "EQUIPMENT", eventTypeCode: "GTIN", eventClassifierCode: "ACT", eventDateTime: "2026-11-11T10:00:00Z", eventCreatedDateTime: "2026-11-11T10:00:00Z", transportCall: VLC_NDH_047, equipmentReference: "NDHU1234565" },
            { eventID: "ndh-24866-02", eventType: "EQUIPMENT", eventTypeCode: "LOAD", eventClassifierCode: "ACT", eventDateTime: "2026-11-13T08:00:00Z", eventCreatedDateTime: "2026-11-13T08:00:00Z", transportCall: VLC_NDH_047, equipmentReference: "NDHU1234565" },
            { eventID: "ndh-24866-03", eventType: "TRANSPORT", eventTypeCode: "DEPA", eventClassifierCode: "ACT", eventDateTime: "2026-11-13T19:40:00Z", eventCreatedDateTime: "2026-11-13T19:40:00Z", transportCall: VLC_NDH_047 },
            { eventID: "ndh-24866-04", eventType: "TRANSPORT", eventTypeCode: "ARRI", eventClassifierCode: "EST", eventDateTime: "2026-12-05T08:00:00Z", eventCreatedDateTime: "2026-11-22T05:30:00Z", transportCall: VER_NDH_047 },
          ],
        },
      ],
    },
    // Carrier haulage leg: no feed yet (Nordhaven is the only operator listed for this shipment).
    { emailIds: [], raw: [{ format: "dhl", data: { id: "NDH-CH-1204", events: [] } }] },
  ],
};

// ── ACM-24844 · Galicar · delivered ──
const acm24844: ShipmentPayload = {
  record: {
    id: "ACM-24844",
    description: "Machined flanges (4 pallets)",
    po: "PO-MR-9012",
    customerAccount: "acc-mecanique-rhone",
    customerName: "Mécanique Rhône SAS",
    originSite: BILBAO_PLANT,
    destination: LYON,
    plannedDelivery: "2026-11-18T18:00:00+01:00",
    legs: [
      {
        mode: "road",
        operatorId: "galicar",
        from: BILBAO_PLANT,
        to: LYON,
        plan: {
          PICKED_UP: "2026-11-16T10:00:00+01:00",
          DELIVERED: "2026-11-18T18:00:00+01:00",
        },
      },
    ],
    documents: [{ key: "cmr", name: "e-CMR", status: "ok" }],
  },
  rawUpdates: [
    {
      emailIds: [],
      raw: [
        {
          format: "dhl",
          data: {
            id: "JD014600006281229911",
            service: "freight",
            origin: addr("Bilbao", "ES"),
            destination: addr("Lyon", "FR"),
            status: {
              timestamp: "2026-11-18T11:20:00+01:00",
              statusCode: "delivered",
              status: "Delivered",
              location: addr("Lyon", "FR"),
            },
            estimatedDeliveryTimeFrame: { estimatedFrom: "2026-11-18T12:00:00+01:00" },
            events: [
              {
                timestamp: "2026-11-18T11:20:00+01:00",
                statusCode: "delivered",
                status: "Delivered",
                location: addr("Lyon", "FR"),
              },
              {
                timestamp: "2026-11-18T07:30:00+01:00",
                statusCode: "transit",
                status: "Out for delivery",
                location: addr("Lyon", "FR"),
              },
              {
                timestamp: "2026-11-17T08:00:00+01:00",
                statusCode: "transit",
                status: "Arrived at facility",
                location: addr("Bordeaux", "FR"),
              },
              {
                timestamp: "2026-11-16T10:30:00+01:00",
                statusCode: "transit",
                status: "Picked up",
                location: addr("Bilbao", "ES"),
              },
            ],
          },
        },
      ],
    },
  ],
};

export const SHIPMENTS: ShipmentPayload[] = [
  acm24812,
  acm24801,
  acm24790,
  acm24755,
  acm24817,
  acm24866,
  acm24844,
];
