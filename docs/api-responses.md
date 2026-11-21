# Shipment tracking API responses — TypeScript types

The response each provider returns for one shipment, typed from the provider's own spec or docs (checked 2026-11-18).

- **Union types** (`'a' | 'b'`): values the provider documents as allowed.
- **`string`**: the provider documents no fixed list of values.
- **Optional fields** (`?`): everything not marked required in the spec.
- **Partial types**: some types list only the documented fields we could read. Each one says so.

Status code meanings and common tags are in [`status-codes.md`](status-codes.md).

---

## DHL — Shipment Tracking Unified API

`GET https://api-eu.dhl.com/track/shipments?trackingNumber=…`
Source: [DHL OpenAPI v1.5.8](https://developer.dhl.com/sites/default/files/2026-08/track_v1.5.8.yaml)

```ts
type DhlStatusCode = 'pre-transit' | 'transit' | 'delivered' | 'failure' | 'unknown';

type DhlService =
  | 'dgf' | 'dsc' | 'ecommerce' | 'ecommerce-apac' | 'ecommerce-europe' | 'ecommerce-ppl'
  | 'ecommerce-iberia' | 'express' | 'freight' | 'parcel-de' | 'parcel-nl' | 'parcel-pl'
  | 'parcel-uk' | 'post-de' | 'post-international' | 'sameday' | 'svb';

type DhlDestinationProvider =
  | 'acs-courier' | 'anpost' | 'bpost' | 'bring' | 'chronopost' | 'colis-prive' | 'econnect'
  | 'express' | 'fastway' | 'freight' | 'freight-fr' | 'freight-se' | 'hrvatska-posta'
  | 'magyar-posta' | 'oepag' | 'parcel-be' | 'parcel-bl' | 'parcel-cz' | 'parcel-de'
  | 'parcel-es' | 'parcel-iberia' | 'parcel-lu' | 'parcel-nl' | 'parcel-pl' | 'parcel-pt'
  | 'parcel-uk' | 'posta' | 'posta-slovenije' | 'posti' | 'poste-italiane' | 'ppl' | 'rapido'
  | 'relais-colis' | 'slovak-parcel-service' | 'speedy' | 'sps' | 'trans-o-flex' | 'urgent-cargus';

type DhlReferenceType =
  | 'container-number' | 'customer-confirmation-number' | 'customer-reference'
  | 'domestic-consignment-id' | 'ecommerce-number' | 'housebill' | 'local-tracking-number'
  | 'masterbill' | 'payer-account-number' | 'receiver-account-number' | 'reference'
  | 'shipment-id' | 'shipper-account-number' | 'routing-code' | 'customer-order-number';

interface DhlAddress {
  addressLocality?: string;          // city
  addressLocalityServicing?: string;
  addressRegion?: string;
  countryCode?: string;              // ISO 3166-1 alpha-2
  postalCode?: string;
  streetAddress?: string;
  addressLine?: string;
}

interface DhlPlace {
  address?: DhlAddress;
  servicePoint?: { url?: string; label?: string };
}

interface DhlStatus {
  timestamp: string;                 // ISO 8601, required
  statusCode: DhlStatusCode;         // required
  location?: DhlPlace;
  status?: string;                   // short title; free text or code, varies by division
  statusDetailed?: string;           // e.g. "PARCV_NRQRD_VA"
  description?: string;
  remark?: string;
  nextSteps?: string;
}

interface DhlEvent extends DhlStatus {
  pieceIds?: string[];
}

interface DhlQuantity { unitText?: string; value?: number }

type DhlEntity =
  | { '@type': 'Organization'; name?: string; organizationName?: string; address?: DhlAddress }
  | { '@type': 'Person'; familyName?: string; givenName?: string; name?: string; address?: DhlAddress }
  | { '@type': 'Company' | 'UnknownEntity'; [key: string]: unknown };

interface DhlShipment {
  id?: string;                       // tracking number
  service?: DhlService;
  division?: string;
  origin?: DhlPlace;
  destination?: DhlPlace;
  status?: DhlStatus;                // current status
  pickUpDate?: string;               // ISO 8601
  estimatedTimeOfDelivery?: string;  // ISO 8601
  agreedDeliveryDate?: string;       // ISO 8601
  estimatedDeliveryTimeFrame?: { estimatedFrom?: string; estimatedThrough?: string };
  estimatedTimeOfDeliveryRemark?: string;
  serviceUrl?: string;
  rerouteUrl?: string;
  returnFlag?: boolean;              // default false
  details?: {
    product?: { productCode?: string; productName?: string; deliveryMethodRemark?: string };
    provider?: { destinationProvider: DhlDestinationProvider };
    receiver?: DhlEntity; sender?: DhlEntity; carrier?: DhlEntity; shipper?: DhlEntity; consignee?: DhlEntity;
    proofOfDelivery?: { documentUrl?: string; signatureUrl?: string; signed?: DhlEntity; timestamp?: string };
    proofOfDeliverySignedAvailable?: boolean;
    totalNumberOfPieces?: number;
    pieceIds?: string[];
    weight?: DhlQuantity;
    volume?: DhlQuantity;
    loadingMeters?: number;
    dimensions?: { height?: DhlQuantity; length?: DhlQuantity; width?: DhlQuantity };
    references?: { number?: string; type: DhlReferenceType }[];
    shipmentActivationDate?: string;
  };
  events?: DhlEvent[];               // history
}

interface DhlTrackingResponse {
  url?: string; prevUrl?: string; nextUrl?: string; firstUrl?: string; lastUrl?: string;
  shipments?: DhlShipment[];
  possibleAdditionalShipmentsUrl?: string[];
}
```

---

## UPS — Tracking API

`GET /api/track/v1/details/{inquiryNumber}`
Source: [UPS Tracking.yaml](https://raw.githubusercontent.com/UPS-API/api-documentation/main/Tracking.yaml) · status `type` values from [UPS TrackAlert.yaml](https://raw.githubusercontent.com/UPS-API/api-documentation/main/UPSTrackAlert.yaml)

```ts
// The Tracking spec doesn't enumerate `type`. These values come from UPS's Track Alert spec.
type UpsStatusType = 'D' | 'I' | 'M' | 'MV' | 'U' | 'X';
// D Delivery · I On the Way · M Manifest · MV Manifest Void · U Updated Delivery Date/Time · X Package Exception

type UpsDeliveryDateType = 'SDD' | 'RDD' | 'DEL';                          // scheduled · rescheduled · delivered
type UpsDeliveryTimeType = 'EOD' | 'CMT' | 'EDW' | 'CDW' | 'IDW' | 'DEL';  // end of day · commit · estimated/confirmed/imminent window · delivered

interface UpsAddress {
  addressLine1?: string; addressLine2?: string; addressLine3?: string;
  city?: string; stateProvince?: string; postalCode?: string;
  country?: string; countryCode?: string;
}

interface UpsStatus {
  type?: UpsStatusType;
  code?: string;                     // e.g. "SR"; UPS's code list is not public
  description?: string;
  simplifiedTextDescription?: string;
  statusCode?: string;               // e.g. "003"
}

interface UpsActivity {
  date?: string;                     // YYYYMMDD
  time?: string;                     // HHMMSS (24 h)
  gmtDate?: string; gmtTime?: string; gmtOffset?: string;   // e.g. "-05:00"
  location?: { address?: UpsAddress; slic?: string };
  status?: UpsStatus;
  logicalScan?: boolean;             // true = logical event, false = physical scan
}

interface UpsMilestone {
  code?: string;
  category?: string;                 // only when the milestone is complete
  description?: string;              // US English
  current?: boolean;                 // true = current state of the package
  state?: string;                    // "This milestone has already occurred" / "This milestone has not yet been completed"
  linkedActivity?: string;           // 0-based index into activity[]
  subMilestone?: { category?: string };
}

interface UpsPackage {
  trackingNumber?: string;
  currentStatus?: UpsStatus;
  activity?: UpsActivity[];          // most recent first
  milestones?: UpsMilestone[];       // oldest first, future milestones last
  deliveryDate?: { type?: UpsDeliveryDateType; date?: string /* YYYYMMDD */ }[];
  deliveryTime?: { type?: UpsDeliveryTimeType; startTime?: string; endTime?: string /* HHMMSS */ };
  deliveryInformation?: { receivedBy?: string; location?: unknown; signature?: unknown; deliveryPhoto?: unknown; pod?: unknown };
  packageAddress?: { type?: string; name?: string; attentionName?: string; address?: UpsAddress }[];
  referenceNumber?: { type?: string; number?: string }[];
  alternateTrackingNumber?: { type?: string; number?: string }[];
  service?: { code?: string; description?: string; levelCode?: string };
  weight?: { unitOfMeasurement?: 'LBS' | 'KGS'; weight?: string };
  dimension?: { height?: number; length?: number; width?: number; unitOfDimension?: string };
  packageCount?: number;
  statusCode?: string;
  statusDescription?: string;
  additionalServices?: ('ADULT_SIGNATURE_REQUIRED' | 'SIGNATURE_REQUIRED' | 'ADDITIONAL_HANDLING'
    | 'CARBON_NEUTRAL' | 'UPS_PREMIER_SILVER' | 'UPS_PREMIER_GOLD' | 'UPS_PREMIER_PLATINUM')[];
  additionalAttributes?: 'SENSOR_EVENT'[];
  isSmartPackage?: boolean;
}

interface UpsTrackingResponse {
  trackResponse: {
    shipment: {
      inquiryNumber?: string;
      package?: UpsPackage[];
      userRelation?: string[];
      warnings?: { code?: string; message?: string }[];
    }[];
  };
}
```

---

## FedEx

### Supply Chain — Get Tracking
`GET /tracking?trackingNumber=…`
Source: [FedEx Supply Chain gettrack](https://dev.supplychain.fedex.com/gettrack) (the sample response there is from 2014)

```ts
type FedExScStatusCode = 'OC' | 'PU' | 'AR' | 'DP' | 'OD' | 'DL';

type FedExScLocationCode =
  | 'AIRPORT' | 'CUSTOMER' | 'CUSTOMS_BROKER' | 'DELIVERY_LOCATION' | 'DESTINATION_AIRPORT'
  | 'DESTINATION_FEDEX_FACILITY' | 'DROP_BOX' | 'ENROUTE' | 'PICKUP_LOCATION' | 'FEDEX_FACILITY'
  | 'FEDEX_OFFICE_LOCATION' | 'INTERLINE_CARRIER' | 'NON_FEDEX_FACILITY' | 'ORIGIN_AIRPORT'
  | 'ORIGIN_FEDEX_FACILITY' | 'PLANE' | 'PORT_OF_ENTRY' | 'SHIP_AND_GET_LOCATION'
  | 'SORT_FACILITY' | 'TURNPOINT' | 'VEHICLE';

interface FedExScTrackingResponse {
  requestIdentifier?: string;
  transactionDate?: string;
  status?: boolean;                  // the attribute table calls this `success`
  tracking?: {
    shipmentId?: string;
    shipmentStatus?: FedExScStatusCode;
    shipmentStatusDescription?: string;   // e.g. "Delivered"
    actualDelivery?: string;
    events?: {
      statusDateTime?: string;
      statusCode?: FedExScStatusCode;
      statusDescription?: string;
      location?: {
        locationCode?: FedExScLocationCode;
        city?: string; stateCode?: string; zipCode?: string; countryCode?: string;
      };
    }[];
  };
}
```

### Track API ("Basic Integrated Visibility") — partial
Source: [FedEx Track API docs](https://developer.fedex.com/api/en-us/catalog/track/v1/docs.html). FedEx's portal blocks automated reading, so **only these documented fields** are included.

```ts
interface FedExTrackResponsePartial {
  output: {
    completeTrackResults: {
      trackResults: {
        estimatedDeliveryTimeWindow?: { window?: { begins?: string; ends?: string } };
        scanEvents?: {
          eventType?: string;        // documented examples: 'AE' arriving early, 'AO' arriving on-time
          delayDetail?: {
            status?: 'ON_TIME' | 'EARLY' | 'DELAYED';
            type?: string;           // e.g. "WEATHER"
            subType?: string;        // e.g. "SNOW"
          };
        }[];
      }[];
    }[];
  };
}
```

---

## AfterShip — Tracking object (aggregator)

`GET /tracking/{version}/trackings/{id}`
Source: [AfterShip Tracking object](https://www.aftership.com/docs/tracking/model/tracking) · [Sub-statuses](https://www.aftership.com/docs/tracking/enum/delivery-sub-statuses)
Only the tracking-relevant fields are included; marketing and notification fields are omitted.

```ts
type AfterShipTag =
  | 'Pending' | 'InfoReceived' | 'InTransit' | 'OutForDelivery' | 'AttemptFail'
  | 'Delivered' | 'AvailableForPickup' | 'Exception' | 'Expired';

// Format `${Tag}_${NNN}`, e.g. 'InTransit_005', 'Exception_004'. Full list in status-codes.md.
type AfterShipSubtag = `${AfterShipTag}_${string}`;

type AfterShipEddSource = 'Carrier EDD' | 'AfterShip EDD' | 'Custom EDD' | 'Order EDD';

interface AfterShipEdd {
  type?: 'range' | 'specific';
  source?: AfterShipEddSource;
  datetime?: string | null;
  datetime_min?: string | null;
  datetime_max?: string | null;
}

interface AfterShipCheckpoint {
  created_at?: string;               // when AfterShip received it (UTC)
  checkpoint_time?: string;          // when it happened (carrier time, checkpoint timezone)
  slug?: string;                     // carrier id, e.g. "fedex"
  location?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country_region?: string | null;    // ISO alpha-3
  country_region_name?: string | null;
  coordinate?: { latitude?: number; longitude?: number } | null;
  message?: string;                  // carrier's original text
  tag?: AfterShipTag;
  subtag?: AfterShipSubtag;
  subtag_message?: string;
  raw_tag?: string | null;           // carrier's raw status code
  events?: object[];                 // beta: e.g. "returned_to_sender"
  source?: 'carrier' | 'user';
  hash?: string;                     // usable for deduplication
}

interface AfterShipTracking {
  id: string;
  tracking_number: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
  active?: boolean;
  tag?: AfterShipTag;
  subtag?: AfterShipSubtag;
  subtag_message?: string;
  checkpoints?: AfterShipCheckpoint[];
  origin_country_region?: string | null;  origin_city?: string | null;  origin_postal_code?: string | null;
  destination_country_region?: string | null;  destination_city?: string | null;  destination_postal_code?: string | null;
  transit_time?: number | null;
  shipment_pickup_date?: string | null;
  shipment_delivery_date?: string | null;
  shipment_type?: string | null;
  shipment_weight?: { unit?: string; value?: number } | null;
  shipment_dimensions?: { unit?: 'cm' | 'in'; length?: number; width?: number; height?: number } | null;
  signed_by?: string | null;
  on_time_status?: string | null;    // documented example: "on-time"; no value list
  on_time_difference?: number | null;   // days
  courier_estimated_delivery_date?: {
    estimated_delivery_date?: string | null;
    estimated_delivery_date_min?: string | null;
    estimated_delivery_date_max?: string | null;
  } | null;
  aftership_estimated_delivery_date?: {
    estimated_delivery_date?: string;    // YYYY-MM-DD
    confidence_code?: number;
    estimated_delivery_date_min?: string;
    estimated_delivery_date_max?: string;
  } | null;
  first_estimated_delivery?: AfterShipEdd | null;
  latest_estimated_delivery?: (AfterShipEdd & { revise_reason?: string | null }) | null;
  order_promised_delivery_date?: {
    promised_delivery_date?: string | null;
    promised_delivery_date_min?: string | null;
    promised_delivery_date_max?: string | null;
  } | null;
  delivery_type?: 'pickup_at_store' | 'pickup_at_courier' | 'door_to_door' | null;
  signature_requirement?: 'signature_required' | 'adult_signature_required'
    | 'indirect_signature_required' | 'no_signature_required' | null;
  failed_delivery_attempts?: number | null;
  first_attempted_at?: string | null;
  return_to_sender?: boolean;        // true if any checkpoint is Exception_010 or Exception_011
  shipment_direction?: 'forward' | 'return' | null;
  proof_of_delivery?: { type: 'image'; url: string }[] | null;
  courier_tracking_link?: string | null;
  first_mile?: { tracking_number?: string; slug?: string; transit_time?: string } | null;
  last_mile?: { tracking_number?: string; slug?: string; transit_time?: string; source?: 'system' | 'user' } | null;
  multi_piece_info?: { type?: 'master' | 'child'; pieces?: object[] } | null;
}
```

---

## Terminal49 — Container (port / terminal)

`GET /v2/containers/{id}` (JSON:API document)
Source: [Container reference](https://terminal49.com/docs/api-docs/api-reference/containers/list-containers.md) · [Holds & fees](https://terminal49.com/docs/api-docs/in-depth-guides/holds-and-fees)

```ts
type T49ContainerStatus =
  | 'new' | 'on_ship' | 'available' | 'not_available' | 'grounded' | 'on_rail' | 'picked_up'
  | 'off_dock' | 'delivered' | 'dropped' | 'loaded' | 'empty_returned' | 'awaiting_inland_transfer';

type T49HoldName = 'freight' | 'line' | 'customs' | 'USDA' | 'VACIS' | 'TMF' | 'other'; // case-sensitive

interface T49Hold {
  name: T49HoldName;
  status: 'pending' | 'hold';        // a cleared hold is removed from the array
  description?: string | null;
}

interface T49Fee {
  type: 'demurrage' | 'exam' | 'extended_dwell_time' | 'other' | 'total';
  amount: number;
  currency_code?: string;            // ISO 4217
}

interface T49Container {
  id: string;                        // uuid
  type: 'container';
  attributes: {
    number: string;                  // e.g. "KOCU4959010"
    ref_numbers?: string[];
    seal_number?: string | null;
    equipment_type?: 'dry' | 'reefer' | 'open top' | 'flat rack' | 'bulk' | 'tank' | null;
    equipment_length?: 10 | 20 | 40 | 45 | null;
    equipment_height?: 'standard' | 'high_cube' | null;
    weight_in_lbs?: number | null;
    created_at?: string;
    current_status?: T49ContainerStatus;
    availability_known?: boolean;
    available_for_pickup?: boolean | null;
    holds_at_pod_terminal?: T49Hold[];
    fees_at_pod_terminal?: T49Fee[];
    pickup_lfd?: string | null;      // coalesced: line > terminal > rail (not the earliest)
    import_deadlines?: {
      pickup_lfd_line?: string | null;
      pickup_lfd_terminal?: string | null;
      pickup_lfd_rail?: string | null;
    } | null;
    pickup_appointment_at?: string | null;
    pod_arrived_at?: string | null;      // vessel arrived at port of discharge
    pod_discharged_at?: string | null;
    pod_full_out_at?: string | null;     // null for inland moves
    pod_full_out_chassis_number?: string | null;
    location_at_pod_terminal?: string | null;
    pod_rail_carrier_scac?: string | null;
    pod_rail_loaded_at?: string | null;
    pod_rail_departed_at?: string | null;
    ind_rail_carrier_scac?: string | null;
    ind_eta_at?: string | null;
    ind_ata_at?: string | null;
    ind_rail_unloaded_at?: string | null;
    final_destination_full_out_at?: string | null;
    empty_terminated_at?: string | null; // empty container returned
    pod_timezone?: string | null;        // IANA
    final_destination_timezone?: string | null;
    empty_terminated_timezone?: string | null;
    terminal_checked_at?: string | null;
    pod_last_tracking_request_at?: string | null;
    shipment_last_tracking_request_at?: string | null;
  };
  relationships?: {
    shipment?: { data: { id: string; type: 'shipment' } };
    pod_terminal?: { data: { id: string; type: 'terminal' } };
    transport_events?: { data: { id: string; type: 'transport_event' }[] };
    raw_events?: { data: { id: string; type: 'raw_event' }[] };
  };
}

interface T49ContainerResponse { data: T49Container }
```

---

## Vizion — container update payload (ocean)

Webhook / `List Reference Updates`
Source: [Update payload](https://docs.vizionapi.com/docs/understand-update-payload) · [DCSA milestones](https://docs.vizionapi.com/docs/dcsa-milestones)

```ts
interface VizionLocation {
  name?: string;
  city?: string;
  facility?: string | null;
  state?: string;
  country?: string;
  unlocode?: string;                 // 5 letters
  geolocation?: { latitude?: number; longitude?: number };
}

interface VizionMilestone {
  timestamp: string;
  location?: VizionLocation;
  description: string;               // Vizion-standardised text
  raw_description?: string;          // carrier's original text
  vessel?: string; vessel_imo?: string; vessel_mmsi?: string; voyage?: string;
  planned: boolean;                  // true = estimate, not happened yet
  mode?: string;                     // documented example: "Vessel"
  source: 'ais' | 'carrier' | 'rail' | 'terminal' | 'vizion';  // vizion = Vizion predicted ETA
  // Only present when DCSA codes are enabled on the account:
  journey_event?: {
    journey_type?: 'EQUIPMENT' | 'TRANSPORT' | 'SHIPMENT';
    event_classifier?: 'ACT' | 'EST' | 'PLN';
    event_type?: string;             // DCSA code, e.g. 'LOAD' | 'DISC' | 'GTIN' | 'GTOT' | 'ARRI' | 'DEPA'
    empty_indicator?: 'LADEN' | 'EMPTY';
    transport_mode?: 'VESSEL' | 'TRUCK' | 'BARGE';
    facility_type?: string;          // e.g. 'POTE'
  };
  shipment_location?: { type_code: 'POL' | 'POD' | 'RTP' | 'PRE' | 'PDE' | null };
}

interface VizionUpdate {
  id: string;
  status: 'data_received';           // always this value on webhooks
  reference_id: string;
  organization_id: string;
  parent_reference_id: string | null;   // set when the reference was created from a bill of lading
  created_at: string;
  updated_at: string;
  payload: {
    bill_of_lading: string | null;
    carrier_scac: string;
    container_id: string;
    container_iso?: string;          // e.g. "40' HIGH CUBE"
    reference_id: string;
    milestones: VizionMilestone[];   // current state: an estimate is replaced once it actualises
    origin_port?: VizionLocation;
    destination_port?: VizionLocation;
    inland_origin?: VizionLocation;
    inland_destination?: VizionLocation;
  };
}
```

---

## DCSA Track & Trace — events (standard used by ocean carriers)

`GET /v2/events` returns an array of events.

```ts
type DcsaClassifier = 'ACT' | 'PLN' | 'EST';

interface DcsaEvent {
  eventTypeCode: string;             // DEPA, ARRI, GTIN, LOAD, DISC, GTOT, CONF, INSP, ...
  eventClassifierCode: DcsaClassifier;
  eventDateTime: string;             // when it happened, or will happen (PLN/EST)
  eventCreatedDateTime: string;      // when the record was created
  location: { locationName: string; UNLocationCode: string };
  delayReasonCode?: string;          // SMDG delay reason code, max 3, e.g. "WEA"
}

type DcsaEventsResponse = DcsaEvent[];
```

---

## EDI X12 315 — Status Details (Ocean), parsed

Not a JSON API: one message per status, made of segments. This type is our parse of the segments relevant to tracking.
Source: [X12 004010 315](https://www.stedi.com/edi/x12-004010/315) · [B4](https://www.stedi.com/edi/x12-004010/segment/B4) · [Maersk 315 guide](https://portal.stedi.com/app/guides/view/maersk-line/status-details-ocean/01GMR4TPPKYRV2A0TV2X4R2DZ4)

```ts
type X12ShipmentStatusCode =
  | 'A' | 'AE' | 'AF' | 'AG' | 'AL' | 'AM' | 'AO' | 'AP' | 'AR' | 'AV' | 'CA' | 'CT' | 'CU'
  | 'D' | 'EE' | 'I' | 'K' | 'OA' | 'PA' | 'RD' | 'SD' | 'UV' | 'VA' | 'VD' | 'X1';
// Each partner sends only a subset (Maersk: A AE AG AL AV CU D EE I OA RD UV VA VD)

interface X12_315 {
  B4: {
    shipmentStatusCode?: X12ShipmentStatusCode;   // B403
    date?: string;                   // B404, CCYYMMDD: date of last reported status
    time?: string;                   // B405, HHMM
    statusLocation?: string;         // B406
    equipmentInitial?: string;       // B407, e.g. "MSCU"
    equipmentNumber?: string;        // B408
    equipmentStatus?: 'E' | 'L';     // B409: Empty / Load
    equipmentType?: string;          // B410, 4 characters
    locationIdentifier?: string;     // B411
    locationQualifier?: 'UN' | 'CI' | string;  // B412: UN = UN/LOCODE, CI = city
  };
  R4: {                              // port/terminal loop, up to 20
    DTM?: {
      qualifier: '139' | '140';      // 139 Estimated · 140 Actual
      date?: string;                 // CCYYMMDD
      time?: string;
      timeCode?: string;             // e.g. "LT" local time
    }[];
  }[];
}
```

---

## Mock examples with ETAs (fictional data)

Synthetic responses for the prototype. Each one fills the provider's documented ETA fields. Names, numbers and times are invented. FedEx Supply Chain has no example because it has no ETA field.

```ts
// DHL — road freight, delivery ETA with time window
const mockDhl: DhlTrackingResponse = {
  shipments: [{
    id: 'JD014600006281230704',
    service: 'freight',
    origin: { address: { addressLocality: 'Zaragoza', countryCode: 'ES' } },
    destination: { address: { addressLocality: 'Lyon', postalCode: '69007', countryCode: 'FR' } },
    status: {
      timestamp: '2026-11-22T09:40:00+01:00', statusCode: 'transit',
      status: 'Departed from facility', description: 'The shipment has left the facility',
      location: { address: { addressLocality: 'Barcelona', countryCode: 'ES' } },
    },
    estimatedTimeOfDelivery: '2026-11-23T14:00:00+01:00',
    estimatedDeliveryTimeFrame: { estimatedFrom: '2026-11-23T12:00:00+01:00', estimatedThrough: '2026-11-23T16:00:00+01:00' },
    estimatedTimeOfDeliveryRemark: 'Delivery expected in the afternoon',
    events: [
      { timestamp: '2026-11-22T09:40:00+01:00', statusCode: 'transit', status: 'Departed from facility',
        location: { address: { addressLocality: 'Barcelona', countryCode: 'ES' } } },
      { timestamp: '2026-11-21T16:10:00+01:00', statusCode: 'transit', status: 'Picked up',
        location: { address: { addressLocality: 'Zaragoza', countryCode: 'ES' } } },
    ],
  }],
};

// UPS — scheduled delivery date + estimated window
const mockUps: UpsTrackingResponse = {
  trackResponse: { shipment: [{ inquiryNumber: '1Z0000000000000001', package: [{
    trackingNumber: '1Z0000000000000001',
    currentStatus: { type: 'I', description: 'On the Way' },
    deliveryDate: [{ type: 'SDD', date: '20261120' }],
    deliveryTime: { type: 'EDW', startTime: '090000', endTime: '130000' },
    activity: [{ date: '20261118', time: '071500', gmtOffset: '+01:00', status: { type: 'I', description: 'Departed from Facility' },
      location: { address: { city: 'Madrid', countryCode: 'ES' } } }],
  }] }] },
};

// FedEx Track — estimated window + on-time indicator
const mockFedExTrack: FedExTrackResponsePartial = {
  output: { completeTrackResults: [{ trackResults: [{
    estimatedDeliveryTimeWindow: { window: { begins: '2026-11-24T08:00:00', ends: '2026-11-24T12:00:00' } },
    scanEvents: [{ eventType: 'AO', delayDetail: { status: 'ON_TIME' } }],
  }] }] },
};

// AfterShip — carrier ETA, with the first and latest ETA kept apart
const mockAfterShip: AfterShipTracking = {
  id: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', tracking_number: 'PT1234567890ES', slug: 'generic-road-carrier',
  tag: 'InTransit', subtag: 'InTransit_007', subtag_message: 'Departure Scan',
  first_estimated_delivery: { type: 'specific', source: 'Carrier EDD', datetime: '2026-11-23' },
  latest_estimated_delivery: { type: 'range', source: 'Carrier EDD', datetime: null,
    datetime_min: '2026-11-23T12:30:00+00:00', datetime_max: '2026-11-23T14:00:00+00:00', revise_reason: null },
  checkpoints: [{ checkpoint_time: '2026-11-22T08:05:00+01:00', created_at: '2026-11-22T07:06:12+00:00',
    city: 'Bilbao', country_region: 'ESP', message: 'Departed facility', tag: 'InTransit', subtag: 'InTransit_007',
    raw_tag: 'DF', source: 'carrier' }],
};

// Vizion — carrier ETA to the destination port (next stop, not delivery)
const mockVizion: VizionUpdate = {
  id: '0f8e2c1a-1111-4b2c-9d3e-000000000001', status: 'data_received',
  reference_id: '0f8e2c1a-2222-4b2c-9d3e-000000000002', organization_id: '0f8e2c1a-3333-4b2c-9d3e-000000000003',
  parent_reference_id: null, created_at: '2026-11-22T06:00:00Z', updated_at: '2026-11-22T06:00:00Z',
  payload: {
    bill_of_lading: null, carrier_scac: 'NDHL', container_id: 'NDHU1234565', container_iso: "40' HIGH CUBE",
    reference_id: '0f8e2c1a-2222-4b2c-9d3e-000000000002',
    milestones: [
      { timestamp: '2026-11-13T19:40:00Z', description: 'Vessel departed from origin port', planned: false, source: 'carrier',
        vessel: 'NORDHAVEN BOREALIS', voyage: '047W', location: { city: 'Valencia', unlocode: 'ESVLC' },
        journey_event: { journey_type: 'TRANSPORT', event_classifier: 'ACT', event_type: 'DEPA', transport_mode: 'VESSEL' },
        shipment_location: { type_code: 'POL' } },
      { timestamp: '2026-12-05T08:00:00Z', description: 'Vessel arrived at destination port', planned: true, source: 'carrier',
        location: { city: 'Veracruz', unlocode: 'MXVER' },
        journey_event: { journey_type: 'TRANSPORT', event_classifier: 'EST', event_type: 'ARRI', transport_mode: 'VESSEL' },
        shipment_location: { type_code: 'POD' } },
    ],
  },
};

// Terminal49 — container at port; inland ETA (next stop) and customs hold
const mockTerminal49: T49ContainerResponse = {
  data: { id: '7d1c0000-0000-4000-8000-000000000001', type: 'container', attributes: {
    number: 'NDHU7654321', current_status: 'not_available', available_for_pickup: false, availability_known: true,
    holds_at_pod_terminal: [{ name: 'customs', status: 'hold', description: 'Documentary review' }],
    fees_at_pod_terminal: [],
    pod_arrived_at: '2026-11-18T06:20:00Z', pod_discharged_at: '2026-11-18T21:05:00Z',
    pickup_lfd: '2026-11-25T06:00:00Z',
    import_deadlines: { pickup_lfd_line: '2026-11-25T06:00:00Z', pickup_lfd_terminal: '2026-11-23T06:00:00Z', pickup_lfd_rail: null },
    ind_eta_at: null, pod_timezone: 'America/Mexico_City',
  } },
};

// DCSA — estimated vessel arrival (EST, future eventDateTime)
const mockDcsa: DcsaEventsResponse = [{
  eventTypeCode: 'ARRI', eventClassifierCode: 'EST',
  eventDateTime: '2026-12-05T08:00:00Z', eventCreatedDateTime: '2026-11-22T05:30:00Z',
  location: { locationName: 'Veracruz', UNLocationCode: 'MXVER' },
}];

// EDI 315 — vessel arrival with an estimated date (139) at the port
const mockEdi315: X12_315 = {
  B4: { shipmentStatusCode: 'VA', date: '20261118', time: '0600', equipmentInitial: 'NDHU', equipmentNumber: '765432',
    equipmentStatus: 'L', locationIdentifier: 'NLRTM', locationQualifier: 'UN' },
  R4: [{ DTM: [{ qualifier: '139', date: '20261120', time: '1400', timeCode: 'LT' }] }],
};
```
