# Shipment status codes

Only codes confirmed against each publisher's own documentation (checked 2026-11-18). Each format links to its source.

---

## DCSA Track & Trace 2.2 (ocean, JSON)
Source: [DCSA event domain](https://api.swaggerhub.com/domains/dcsaorg/EVENT_DOMAIN/1.0.4) · [DCSA domain](https://api.swaggerhub.com/domains/dcsaorg/DCSA_DOMAIN/1.0.3) · [Vizion milestones](https://docs.vizionapi.com/docs/dcsa-milestones)

| Code | Meaning |
|---|---|
| `ACT` | Actual (event classifier) |
| `EST` | Estimated (event classifier) |
| `PLN` | Planned (event classifier) |
| `ARRI` | Arrived (transport event) |
| `DEPA` | Departed (transport event) |
| `GTIN` | Gated in |
| `GTOT` | Gated out |
| `LOAD` | Loaded |
| `DISC` | Discharged |
| `STUF` | Stuffed |
| `STRP` | Stripped |
| `PICK` | Pick-up |
| `DROP` | Drop-off |
| `INSP` | Inspected |
| `RSEA` | Resealed |
| `RMVD` | Removed |
| `LADEN` / `EMPTY` | Container full / empty |

## EDI X12 315 — Status Details (Ocean)
Source: [X12 004010 element 157](https://www.stedi.com/edi/x12-004010/element/157) · [element 374](https://www.stedi.com/edi/x12-004010/element/374)

| Code | Meaning |
|---|---|
| `A` | Arrived |
| `AE` | Loaded on vessel |
| `AF` | Departed pickup location (shipment picked up) |
| `AG` | Estimated delivery |
| `AL` | Loaded on rail |
| `AM` | Loaded on truck |
| `AO` | Loaded on barge |
| `AP` | Loaded on feeder vessel |
| `AR` | Rail arrival at destination intermodal ramp |
| `AV` | Available for delivery |
| `CA` | Shipment cancelled |
| `CT` | Customs released |
| `CU` | Carrier and customs release |
| `D` | Completed unloading at delivery location (delivered) |
| `EE` | Empty equipment dispatched to pick up cargo |
| `I` | In-gate |
| `K` | Arrived at customs (customs delay, being processed) |
| `OA` | Out-gate |
| `PA` | US customs hold, intensive examination |
| `RD` | Return container |
| `SD` | Shipment delayed |
| `UV` | Unloaded from vessel |
| `VA` | Vessel arrival (scheduled *or* happened, see qualifier) |
| `VD` | Vessel departure (scheduled *or* happened, see qualifier) |
| `X1` | Arrived at delivery location |
| `139` | Date qualifier: estimated |
| `140` | Date qualifier: actual |

## UN/EDIFACT IFTSTA (European multimodal status, element 9011)
Source: [EDIFACT D00A element 9011](https://www.stedi.com/edi/edifact/D00A/elements/9011)

| Code | Meaning |
|---|---|
| `1` | Arrived |
| `12` | Cleared by customs |
| `13` | Collected |
| `17` | Customs refusal |
| `18` | Damaged |
| `20` | Delayed |
| `21` | Delivered |
| `23` | Delivery not completed |
| `24` | Departed |
| `29` | Discharged |
| `31` | En route |
| `48` | Loaded |
| `49` | Lost |
| `100` | Transhipment |
| `101` | Transit delay |

## DHL Shipment Tracking – Unified API
Source: [DHL OpenAPI v1.5.8](https://developer.dhl.com/sites/default/files/2026-08/track_v1.5.8.yaml) · [status code article](https://support-developer.dhl.com/support/solutions/articles/47001197243-what-are-the-different-status-codes-available-in-the-dhl-shipment-tracking-unified-api-)

| Code | Meaning |
|---|---|
| `pre-transit` | Awaiting shipment, not yet received by DHL |
| `transit` | Accepted or picked up, on the way |
| `delivered` | Delivered |
| `failure` | Not delivered or an unforeseen event (customs, returned…) |
| `unknown` | No simplified status available |

## UPS Tracking / Track Alert API
Source: [UPS Tracking.yaml](https://raw.githubusercontent.com/UPS-API/api-documentation/main/Tracking.yaml) · [UPS TrackAlert.yaml](https://raw.githubusercontent.com/UPS-API/api-documentation/main/UPSTrackAlert.yaml)

| Code | Meaning |
|---|---|
| `M` | Manifest (shipment info received) |
| `MV` | Manifest void |
| `I` | On the way |
| `U` | Updated delivery date or time |
| `X` | Package exception |
| `D` | Delivery (category; confirm with `DEL`) |
| `SDD` | Scheduled delivery date |
| `RDD` | Rescheduled delivery date |
| `EDW` | Estimated delivery window |
| `CDW` | Confirmed delivery window |
| `DEL` | Delivered date/time |

## FedEx
Source: [FedEx Supply Chain gettrack](https://dev.supplychain.fedex.com/gettrack) · [FedEx Track API docs](https://developer.fedex.com/api/en-us/catalog/track/v1/docs.html)

| Code | Meaning |
|---|---|
| `OC` | Shipment information sent to FedEx |
| `PU` | Picked up |
| `AR` | Arrived at FedEx location |
| `DP` | Departed FedEx location |
| `OD` | On FedEx vehicle for delivery |
| `DL` | Delivered |
| `ON_TIME` / `EARLY` / `DELAYED` | Delivery schedule status (`delayDetail.status`) |

## AfterShip (aggregator)
Source: [Delivery statuses](https://www.aftership.com/docs/tracking/enum/delivery-statuses) · [Sub-statuses](https://www.aftership.com/docs/tracking/enum/delivery-sub-statuses)

| Code | Meaning |
|---|---|
| `Pending` | New shipment, no tracking info yet |
| `InfoReceived` | Carrier received the request, about to pick up |
| `InTransit` | Accepted or picked up, on the way |
| `OutForDelivery` | About to be delivered |
| `AttemptFail` | Delivery attempted but failed |
| `Delivered` | Delivered |
| `AvailableForPickup` | At a pickup point, ready to collect |
| `Exception` | Customs hold, undelivered, returned or other exception |
| `Expired` | No tracking info for 30 days |
| `InTransit_002` | Acceptance scan (accepted by carrier) |
| `InTransit_003` | Arrival scan (hub or sorting center) |
| `InTransit_005` | Customs clearance completed |
| `InTransit_006` | Customs clearance started |
| `InTransit_007` | Departure scan |
| `Exception_004` | Delayed (customs clearance) |
| `Exception_005` | Delayed (external factors) |
| `Exception_012` | Shipment damaged |
| `Exception_013` | Shipment lost |
| `Exception_017` | Delayed (extreme weather) |
| `Exception_018` | Incorrect or missing documents |
| `Exception_020` | Shipment cancelled |
| `AttemptFail_002` | Addressee not available |

## Terminal49 (port / terminal)
Source: [Holds & fees](https://terminal49.com/docs/api-docs/in-depth-guides/holds-and-fees) · [Container reference](https://terminal49.com/docs/api-docs/api-reference/containers/list-containers.md)

| Code | Meaning |
|---|---|
| `on_ship` | On the vessel |
| `available` | Available for pickup at terminal |
| `not_available` | Not available for pickup |
| `picked_up` | Picked up from terminal |
| `delivered` | Delivered |
| `empty_returned` | Empty container returned |
| `customs` + `hold` | Active customs hold |
| `customs` + `pending` | Customs hold expected, not yet active |

---

## Common tags

Codes that mean the same thing share one tag. A code without a cross-format equivalent is listed only in its format table above.

| Tag | Meaning | Codes |
|---|---|---|
| `INFO_RECEIVED` | Shipment data sent to the operator, not physically moving yet | DHL `pre-transit` · UPS `M` · FedEx `OC` · AfterShip `InfoReceived` |
| `PICKED_UP` | Operator has collected the goods from the shipper | X12 `AF` · EDIFACT `13` · FedEx `PU` · AfterShip `InTransit_002` |
| `GATE_IN` | Full container entered the origin port/terminal | DCSA `GTIN`+`LADEN` · X12 `I` |
| `LOADED` | Loaded onto vessel, rail, truck or barge | DCSA `LOAD` · X12 `AE` `AL` `AM` `AO` `AP` · EDIFACT `48` |
| `DEPARTED` | Vessel, vehicle or shipment left a location | DCSA `DEPA` · X12 `VD`+`140` · EDIFACT `24` · FedEx `DP` · AfterShip `InTransit_007` |
| `IN_TRANSIT` | Moving between locations | DHL `transit` · UPS `I` · EDIFACT `31` · AfterShip `InTransit` · Terminal49 `on_ship` |
| `ARRIVED` | Reached an intermediate port, ramp or hub | DCSA `ARRI` · X12 `A` `VA`+`140` `AR` · EDIFACT `1` · FedEx `AR` · AfterShip `InTransit_003` |
| `DISCHARGED` | Unloaded from the vessel | DCSA `DISC` · X12 `UV` · EDIFACT `29` |
| `TRANSSHIPPED` | Moved to another vessel or vehicle mid-route | EDIFACT `100` |
| `CUSTOMS_IN_PROGRESS` | Customs processing ongoing | X12 `K` · AfterShip `InTransit_006` |
| `CUSTOMS_HOLD` | Customs is blocking the shipment | X12 `PA` · AfterShip `Exception_004` · Terminal49 `customs`+`hold` · EDIFACT `17` |
| `CUSTOMS_RELEASED` | Customs cleared the goods | X12 `CT` `CU` · EDIFACT `12` · AfterShip `InTransit_005` |
| `DOCUMENTS_MISSING` | Shipment blocked by missing or wrong documents | AfterShip `Exception_018` |
| `READY_FOR_PICKUP` | Released and available to collect | X12 `AV` · Terminal49 `available` · AfterShip `AvailableForPickup` |
| `GATE_OUT` | Full container left the destination port/terminal | DCSA `GTOT`+`LADEN` · X12 `OA` · Terminal49 `picked_up` |
| `OUT_FOR_DELIVERY` | On the final vehicle to the consignee | FedEx `OD` · AfterShip `OutForDelivery` |
| `ARRIVED_AT_DELIVERY` | Carrier at the delivery address, not yet unloaded | X12 `X1` |
| `DELIVERED` | Handed over to the consignee | X12 `D` · EDIFACT `21` · DHL `delivered` · UPS `DEL` · FedEx `DL` · AfterShip `Delivered` · Terminal49 `delivered` |
| `DELIVERY_FAILED` | Delivery attempted but not completed | EDIFACT `23` · AfterShip `AttemptFail` `AttemptFail_002` |
| `DELAYED` | Behind schedule | X12 `SD` · EDIFACT `20` `101` · FedEx `DELAYED` · AfterShip `Exception_005` `Exception_017` |
| `ETA_UPDATED` | Delivery date or time changed | X12 `AG` · UPS `U` `RDD` |
| `EXCEPTION` | Damage, loss or another problem | DHL `failure` · UPS `X` · EDIFACT `18` `49` · AfterShip `Exception` `Exception_012` `Exception_013` |
| `CANCELLED` | Shipment cancelled or voided | X12 `CA` · UPS `MV` · AfterShip `Exception_020` |
| `EMPTY_DISPATCHED` | Empty container sent out to be loaded | DCSA `GTOT`+`EMPTY` · X12 `EE` |
| `EMPTY_RETURNED` | Empty container returned after delivery | DCSA `GTIN`+`EMPTY` · X12 `RD` · Terminal49 `empty_returned` |
| `NO_DATA` | No usable tracking information | DHL `unknown` · AfterShip `Pending` `Expired` |

### Confidence tags (apply to any date)

| Tag | Meaning | Codes |
|---|---|---|
| `ACTUAL` | Confirmed, it happened | DCSA `ACT` · X12 `140` · UPS `DEL` |
| `ESTIMATED` | Operator's forecast | DCSA `EST` · X12 `139` · UPS `EDW` |
| `PLANNED` | Original plan or schedule | DCSA `PLN` · UPS `SDD` |
