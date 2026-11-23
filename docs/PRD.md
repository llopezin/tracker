# PRD — Shipment Tracking App

## 1. Objetivo

Prototipo frontend clicable. Da a un fabricante industrial una vista única de sus envíos por carretera y por mar.

- El cliente sabe dónde está su envío y cuándo llega, sin llamar.
- Ops trabaja por excepción: ve lo que necesita atención y la acción siguiente.
- Restricciones: solo frontend, datos sintéticos, IA simulada.

## 2. Fuentes de verdad

Si dos documentos no coinciden, manda el número más bajo.

1. **Este PRD:** alcance, reglas, máquina de estados y decisiones.
2. **[Diseño · Shipment Tracker A · Exception Desk](https://claude.ai/artifact/458MPvAkhcU7m2TPtfmKJA):** solo guía visual. Lo que el diseño muestra y el PRD no incluye, no se construye.
3. **`api-responses.md`:** forma exacta del crudo de cada formato. Los fixtures usan esta forma.
4. **`data-model.md`:** todos los tipos (normalizados, mapeo, `ShipmentRecord`, `ShipmentView`). El PRD no repite tipos.
5. **`status-codes.md`:** significado verificado de cada código. Solo se mapean códigos de este documento, se debe convertir los codigos que se utilicen finalmente a i18n para que se puedan traducir.

## 3. Términos

| Término | Significado |
| --- | --- |
| Tramo | Parte del envío con un modo (`road` o `sea`) y un operador. |
| Operador | Empresa que transporta o informa de un tramo: transportista, naviera, terminal o agente de aduanas. |
| Hito | Etiqueta `RoadTag` o `SeaTag` de `data-model.md`. |
| Plan | Fecha planificada por hito, del registro interno. |
| Retención | Hold `customs` con `status: 'hold'` en Terminal49. |
| Lectura IA | Paso que la IA extrae de un email. Está pendiente hasta que ops la acepta o la rechaza. |
| `NOT_MAPPED` | Valor que el vocabulario del operador no reconoce. La incidencia es `unmapped`. |
| `NOW` | Reloj fijo: `2026-11-22T10:40` (Europe/Madrid). Es el "Last sync" del diseño. |

## 4. Alcance

**Se construye:**

- Rutas `/ops`, `/subsidiary` y `/customer`, cada una con su perímetro. El índice solo enlaza a las tres.
- Cuatro formatos mock, normalizados en el frontend: JSON de carretera (forma DHL Unified), DCSA Track & Trace (mar), Terminal49 (puerto y aduana) y email (lectura IA).
- Pasos hechos y próximos por envío, cada uno con su fuente y su etiqueta.
- ETA solo del operador; su fuente se ve en el paso del detalle.
- Incidencias y acciones deterministas para ops. Revisión humana de las lecturas IA.
- Banner de avisos en las vistas de cliente (sin envío real).
- Lista con búsqueda por ID, filtros con contador y entregados plegados. Documentos en el detalle de ops.

**No se construye (solo write-up):** login, backend, ingesta (polling, webhooks, buzón de email), LLM real, envío real de emails, modos aéreo y ferrocarril.

**Descartado:** ETA predicha por el sistema, búsqueda en lenguaje natural, envío de avisos por email o push, acción siguiente decidida por IA.

**Limitaciones del prototipo:** rutas abiertas, backend, datos e IA mock, reloj fijo. La actividad (revisiones, acciones, subidas) vive en memoria del backend mock y se pierde al recargar.

**Fase 2:**

- [ ] EDI X12 315: parser de `B4` y `R4/DTM` (calificador 139 estimado, 140 real), tipo `X12_315`.
- [ ] Avisos PDF con lectura IA y el mismo flujo de revisión que el email.
- [ ] Transbordos: `ARRIVED_TRANSSHIPMENT` y `TRANSSHIPPED`, con su rango.
- [ ] Adaptadores UPS, FedEx, AfterShip y Vizion (tipos ya documentados).
- [ ] Perímetros internos por sitio. Ejemplo: un usuario limitado a Valencia Warehouse y otro global. La API filtra la lista por el sitio del usuario. En el prototipo, `/ops` es el usuario global.

## 5. Rutas y perímetro

No hay login. Cada ruta tiene una persona de demo fija.

| Ruta | Rol | Persona | Perímetro |
| --- | --- | --- | --- |
| `/` | — | — | Accesos a Ops, Filial y Cliente |
| `/ops` | Ops | ops@acme.com | Origen en Zaragoza Plant, Valencia Warehouse o Bilbao Plant |
| `/subsidiary` | Filial | support.subsidiary@acme.com | Cuenta Acme México (ACM-24817, ACM-24866) |
| `/customer` | Cliente final | client@gmail.com | Sus envíos (ACM-24790) |

- Un envío fuera del perímetro no aparece en listas, contadores ni búsqueda.
- El perímetro lo aplica la API mock, nunca la UI.
- Las tres rutas comparten la actividad del backend mock: revisiones IA, acciones hechas y documentos subidos.

## 6. Datos

Los fixtures están en `src/mock-api/fixtures/` y guardan el crudo con la forma de `api-responses.md`. Todo es ficticio. No se citan cifras sin fuente.

**Operadores**

| Operador | Papel | Crudo | Qué se mapea |
| --- | --- | --- | --- |
| Galicar Express | Carretera | `DhlShipment` | `events[].status` con vocabulario propio en inglés. ETA de `estimatedTimeOfDelivery` / `estimatedDeliveryTimeFrame` |
| Transportes Moncayo | Carretera | `DhlShipment` | `events[].status` con vocabulario propio en español ("Recogido", "Control documental fallido"…) |
| TransPirineo Logistics | Carretera | `DhlShipment` + email | Rutina por JSON. Incidencias por email (lectura IA) |
| Logística Bajío | Carretera (última milla MX) | `DhlShipment` | Sin eventos todavía |
| Nordhaven Lines | Mar | `DcsaEventsResponse` | `GTIN`, `LOAD`, `DEPA`, `ARRI`, `DISC`, `GTOT` con `ACT` / `EST` / `PLN` |
| Meridia Shipping | Mar | `DcsaEventsResponse` | Igual que Nordhaven |
| Terminal Golfo | Puerto (Veracruz) | `T49ContainerResponse` | `pod_arrived_at`, `pod_discharged_at`, `holds_at_pod_terminal`, `available_for_pickup`, `pickup_lfd` |
| Aduanas Golfo | Agente de aduanas | Email | Lectura IA |

**Envíos:** 7 (6 activos, 1 entregado), basados en los mocks de `api-responses.md`. Cada escenario aparece una sola vez.

| ID | Cliente | Ruta y fuentes | Escenario | Base |
| --- | --- | --- | --- | --- |
| ACM-24812 | Millénium Pompes SAS | Zaragoza → Lyon · carretera · Galicar | En hora, ETA con franja. Un estado no reconocido queda `NOT_MAPPED` | Mock DHL |
| ACM-24801 | Talleres Ebro S.L. | Zaragoza → Madrid · carretera nacional · Moncayo | No ha salido. DeCA `missing` | — |
| ACM-24790 | Cliente final | Valencia → Stuttgart · carretera · TransPirineo (JSON + email) | Email de avería con fecha nueva, lectura IA pendiente | — |
| ACM-24755 | Acme Benelux B.V. | Valencia → Rotterdam → Eindhoven · mar + carretera · Meridia | Stale: último evento hace 88 h (umbral 72 h) | Mock DCSA |
| ACM-24817 | Acme México (filial) | Zaragoza → Valencia → Veracruz → Querétaro · carretera + mar + carretera · Moncayo, Nordhaven, Terminal Golfo, Aduanas Golfo (email), Logística Bajío | Retención. Factura `flagged` y factura corregida `missing`. Plan incumplido | Mock Terminal49 |
| ACM-24866 | Acme México (filial) | Valencia → Veracruz → Querétaro · mar + carretera · Nordhaven | En el mar. Solo ETA al próximo destino (`EST ARRI` en MXVER, 1 dic) | Mocks Vizion y DCSA |
| ACM-24844 | Mécanique Rhône SAS | Bilbao → Lyon · carretera · Galicar | Entregado | — |

**Estado inicial:** la lectura IA de Aduanas Golfo (ACM-24817) está aceptada. La de ACM-24790 está pendiente; ops la acepta en la demo.

## 7. Flujo de datos

```
API mock (perímetro) → interpretText por email → mapShipments (adaptadores → máquina de estados → reglas, NOW) → ShipmentView[] por audiencia → componentes
```

- La normalización está en `src/domain/` (TS puro, sin React), porque es parte del valor.
- **API mock** (`mock-api/server.ts`, solo accesible desde `api/client.ts`): aplica el perímetro del rol y devuelve copias tras ~100 ms (0 en tests). Guarda la actividad.
- **Adaptadores** (`dhl`, `dcsa`, `terminal49`, `email`): convierten el crudo en eventos. Un valor no reconocido produce `NOT_MAPPED`, nunca un hito inventado.
- **`mapShipments(respuesta + lecturas IA, audiencia)`:** función pura. Junta los tramos y devuelve los `ShipmentView` en el orden de la lista, sin los datos que la audiencia cliente no recibe.
- **Datos (TanStack Query):** una query por rol, `['shipments', rol]`, que se pide de nuevo en cada visita. Cada lectura IA se cachea por email (`['emailReading', id]`) una vez por carga de página. Registrar actividad invalida `['shipments']`, así que todos los roles la ven. Búsqueda, filtros y filas abiertas son `useState` local.
- **Render:** la página selecciona solo los campos por los que filtra; cada fila (`memo`) y su detalle seleccionan su envío por id. `mapShipments` nunca se ejecuta en un selector ni en el render.

**Reglas de mapeo:**

- `port` no es un modo. La etapa `port` de la barra aparece solo con datos Terminal49 (en el dataset, solo ACM-24817).
- Un `DELIVERED` en un tramo intermedio es un traspaso, no la entrega final.
- Un paso `NOT_MAPPED` aparece solo en el detalle de ops, como "Unknown operator status", con el crudo del operador. No necesita aprobación. No cambia estado, ETA ni plan.

## 8. Reglas deterministas

Estado, ETA, incidencias, acciones y avisos salen solo de estas reglas. Ninguna regla inventa un estado o una fecha.

### 8.1 ETA

- La ETA viene solo del operador: `estimatedTimeOfDelivery` / `estimatedDeliveryTimeFrame` en carretera, `EST` de DCSA en mar.
- La fuente de la ETA se ve en el paso correspondiente del detalle.
- ETA de entrega = la ETA más reciente del último tramo.
- Si el último tramo no tiene ETA, se usa la más reciente del tramo actual (si no es el último) → "ETA to next stop · \<lugar>".
- La fila oculta la columna ETA si no hay ETA del operador, hay retención, el envío no ha salido o está stale. No se muestra ninguna fecha en su lugar. Un envío entregado muestra su fecha de entrega.
- Con la ETA oculta, el detalle tampoco muestra el `EST` del operador en ese paso: muestra el plan (`PLN`) o nada.
- Una lectura IA pendiente con fecha nueva no cambia la ETA. Ops la ve en el detalle como alternativa del próximo paso ("AI-read 82%").
- Ops acepta la lectura → la fecha nueva es la ETA, con la anterior tachada.

### 8.2 Retraso

Un envío está retrasado si se cumple una condición:

1. En un tramo abierto, la ETA más reciente (inicio de la franja; incluye lecturas IA aceptadas) es posterior a su compromiso: `agreedDeliveryDate` (DHL), el `PLN` más reciente de la llegada (DCSA) o, sin estos, el plan.
2. Un hito `ACT` (del operador o IA aceptada) ocurre uno o más días naturales después de su plan.
3. `NOW` es posterior a la entrega planificada y el envío no está entregado.
4. Hay un paso `DELAYED` confirmado (operador o IA aceptada; en DCSA, `delayReasonCode`).

- N = días naturales en Europe/Madrid, N ≥ 1. Un desvío dentro del mismo día no es retraso. Una ETA revisada dentro del plan no es retraso.
- El delta es "+N d". Si varias condiciones dan N, gana el mayor.
- En el caso 3 el delta es "Overdue", y gana a cualquier N.
- El caso 4 puede ser un retraso sin N: la incidencia dice "Delayed".
- Un envío entregado no tiene delta.

### 8.3 Stale

- Horas desde la última actualización recibida (hora de recepción) de cualquier fuente que cuenta: eventos del operador (`ACT`, `EST`, `PLN`, `NOT_MAPPED`) y lecturas IA aceptadas. Las lecturas IA pendientes o rechazadas no cuentan.
- Umbral según el modo del tramo actual: más de 24 h (carretera) o 72 h (mar).
- No aplica a entregados ni a envíos que no han salido. Sin ninguna actualización, nunca es stale.

### 8.4 Estado, salud y orden

Se aplica la primera condición que se cumple:

| # | Condición | `health` |
| --- | --- | --- |
| 1 | Entregado | Sección de entregados |
| 2 | Stale | `stale` |
| 3 | Retención o retraso | `delay` |
| 4 | Documento obligatorio `missing` | `risk` |
| 5 | Lectura IA pendiente | `ai` |
| 6 | No ha salido | `pre` |
| 7 | Otro caso | `ok` |

- Entregado: `health` es `ok` y el envío va a la sección de entregados.
- `ai` solo existe en `/ops`. En las vistas de cliente ese caso cae en `pre` u `ok`.

**Orden de la lista:**

1. Incidencia más grave (§8.5): bloqueante (`customs_hold`, `missing_document`) → atención (`delay`, `stale`, `unmapped`) → revisión (`ai_pending`) → sin incidencias.
2. ETA mostrada en la fila (de entrega o al próximo destino). Si la fila no muestra ETA (retención, stale, no ha salido), entrega planificada, aunque exista ETA del operador.
3. ID del envío, como desempate.

### 8.5 Incidencias y acciones

Un envío puede tener varias incidencias. Las acciones aparecen solo en `/ops`.

- Un envío entregado no tiene incidencias ni acciones.
- `ai_pending` y `unmapped` son solo de ops: las vistas de cliente nunca las reciben.
- Una incidencia `missing_document` por documento; una `unmapped` por operador.

| Incidencia | Condición | Acciones | Filtro |
| --- | --- | --- | --- |
| `customs_hold` | Retención activa (envío no entregado) | Subir documento · Avisar al cliente · Contactar al operador | Customs hold, Delayed |
| `missing_document` | Documento obligatorio `missing` | Subir documento · Avisar al cliente | With incident |
| `delay` | Regla 8.2 | Avisar al cliente · Contactar al operador | Delayed |
| `ai_pending` | Lectura IA pendiente | Accept / Reject en la fuente · Avisar al cliente (bloqueado hasta la revisión) | Needs review |
| `stale` | Regla 8.3 | Contactar al operador | Stale |
| `unmapped` | Paso `NOT_MAPPED` | Contactar al operador | With incident |

**Documentos obligatorios:**

- Son obligatorios los documentos que lista el registro interno del envío, salvo el e-CMR.
- El registro lista el DeCA solo en tramos de carretera nacionales contratados. Nunca con camión propio ni con paquetería.
- El e-CMR es opcional: nunca genera incidencia ni se ofrece para subir.

**Acciones:**

- Una acción por tipo, aunque varias incidencias la pidan, en el orden de la tabla. La primera es la primaria.
- Cada acción tiene un texto de plantilla con datos del envío (como en el diseño).
- Ops hace la acción → la UI muestra "Done by ops@acme.com · hh:mm". La acción hecha sigue en la lista aunque su incidencia se resuelva.
- "Subir documento" aparece, para cualquier incidencia, solo si hay un documento obligatorio `missing` o `flagged`. Sube el primero `missing`; si no hay, el primero `flagged`. Hecha, nombra el documento subido.
- "Subir documento" cambia el documento a `uploaded` y resuelve `missing_document`.
- "Avisar al cliente" está bloqueado mientras haya cualquier lectura IA pendiente en el envío ("Review the AI-read update first").
- "Contactar al operador" nombra al operador del tramo actual.
- Solo un evento del operador levanta una retención.
- "Avisar al cliente" solo registra la acción. No envía nada y no cambia la vista del cliente.

### 8.6 Banner de avisos (`/subsidiary` y `/customer`)

El banner anticipa problemas al cliente sin enviar nada.

- Aparece arriba de la lista si un envío no entregado del perímetro tiene retraso o retención. Sin envíos afectados, no hay banner.
- Una línea por envío, con campos (no frases): ID · estado · nueva ETA si existe ("New ETA Tue 24 Nov") · lugar si es retención · motivo si existe.
- Estado: "Held at customs" si hay retención (gana al retraso); si no, "Overdue" (caso 3 de §8.2) o "+N d late". Un retraso sin N dice "Delayed".
- Nueva ETA = la ETA que muestra la fila. Una línea de retención no lleva nueva ETA.
- Motivo = etiqueta del último paso confirmado (operador o IA aceptada) `BREAKDOWN` → "Vehicle breakdown", `DELAYED` → su código `delayReasonCode` tal cual (o "Delayed" sin código), `CUSTOMS_HOLD` → "Held at customs". Sin ese paso, no hay motivo. Si el motivo repite el estado, no se muestra.
- El banner usa solo eventos del operador y lecturas IA aceptadas. Una lectura pendiente no genera aviso: un envío que solo tiene revisión IA pendiente no aparece.
- Textos de plantilla en i18n. Sin IA.

### 8.7 Máquina de estados (por tramo)

Cada hito tiene un rango. El estado de un tramo avanza solo a un rango igual o mayor.

| Rango | Carretera (`RoadTag`) | Mar (`SeaTag`) |
| --- | --- | --- |
| 0 | `INFO_RECEIVED` | `BOOKING_CONFIRMED`, `EMPTY_DISPATCHED` |
| 1 | `PICKED_UP` | `GATE_IN_ORIGIN` |
| 2 | `IN_TRANSIT` ↔ `ARRIVED_AT_HUB` ↔ `DEPARTED_HUB` ↔ `BORDER_CROSSED` ↔ `CUSTOMS_IN_PROGRESS` / `CUSTOMS_HOLD` / `CUSTOMS_RELEASED` | `LOADED_ON_VESSEL` |
| 3 | `OUT_FOR_DELIVERY` ↔ `ARRIVED_AT_DELIVERY` ↔ `READY_FOR_PICKUP` | `VESSEL_DEPARTED` (`AT_SEA` derivado) |
| 4 | `DELIVERED` (final) | `VESSEL_ARRIVED` |
| 5 | — | `DISCHARGED` |
| 6 | — | `CUSTOMS_HOLD` ↔ `CUSTOMS_RELEASED` ↔ `READY_FOR_PICKUP` |
| 7 | — | `GATE_OUT_DESTINATION` (final) |

**Qué eventos entran:**

- Solo los eventos `ACT` cambian el estado. `EST` y `PLN` solo cambian fechas.
- Una lectura IA entra cuando ops la acepta. `NOT_MAPPED` nunca entra.
- `DOCUMENTS_MISSING`, `BREAKDOWN`, `DELAYED`, `EXCEPTION` y `DELIVERY_FAILED` no tienen rango. Se registran como paso (e incidencia si aplica) sin cambiar el estado.
- `CANCELLED` cierra el tramo.

**`applyEvent(legState, event) → { state, result }`** en `domain/stateMachine.ts`:

| Caso | `result` |
| --- | --- |
| Rango igual o mayor (dentro de un rango, el estado puede ir y volver) | `applied` |
| Rango menor, fecha posterior al estado actual. Ops ve "Out-of-order event ignored"; el cliente no | `rejected` |
| Rango menor, fecha anterior, hito no registrado. No cambia el estado | `history` |
| Mismo hito y misma fecha | `duplicate` |
| Tramo en estado final: no aplica eventos. Excepción: `EMPTY_RETURNED` | `history` |
| Evento `ACT` del tramo siguiente: cierra el tramo actual. Los hitos que faltan quedan sin informar | `applied` (tramo siguiente) |

Cada caso de la tabla tiene un test.

## 9. IA mock y revisión humana

La IA solo lee texto libre. Una lectura IA nunca sustituye al plan ni a un dato del operador.

```ts
// mock-api/server.ts (vía api/client.ts) — mock: respuesta fija tras ~400 ms
interpretText(text: string): Promise<{
  milestone: RoadTag | SeaTag | null; at?: string; location?: string;
  eta?: string;            // fecha nueva, si el texto la da
  confidence: number;      // 0–1
  quote: string;           // frase que soporta la lectura
  readAs: string           // resumen en inglés para la UI
}>
```

- Al cargar un rol, la app llama a `interpretText` por cada email del perímetro (una vez por carga de página) y espera las respuestas antes del render. Una lectura fallida cuenta como ilegible.
- La respuesta sale de un mapa fijo por id de email. Un texto desconocido devuelve `milestone: null`.
- `milestone: null` o `confidence < 0.7` → `NOT_MAPPED`.
- En otro caso, el paso lleva la etiqueta `AI` con la confianza ("AI-read 82%") y, debajo, el email original con Accept / Reject.
- **Pendiente:** solo ops la ve. No cambia ETA ni plan. Bloquea "Avisar al cliente".
- **Accept:** el paso pasa a confirmado y una fecha nueva pasa a ser la ETA. El cliente ve el paso como una actualización normal, sin marca de IA.
- **Reject:** ops ve la lectura en el historial como rechazada. No cambia nada.

## 10. Vistas

Cada rol tiene una pantalla: la lista de envíos con filas que se abren, como en el diseño. UI en inglés, con los textos del diseño.

| Elemento | `/ops` | `/subsidiary` y `/customer` |
| --- | --- | --- |
| Cabecera | "Shipments" y los tres sitios | "Your shipments" y la persona |
| Búsqueda por ID y filtros con contador (Delayed, With incident, Customs hold, Stale) | Sí | Sí |
| Filtro "Needs review" con contador | Sí | No |
| Banner de avisos (§8.6) | No | Sí |
| Fila (tarjeta): cabecera con ID, descripción, PO, "Delayed +N d" si hay retraso, última actualización y "View details"; barra de etapas con paradas y operadores; estado, fecha planificada con delta y ETA (si hay) | Sí, más el cliente | Sí |
| Incidencias en la fila con su gravedad (Blocking, Attention, Review) y la acción siguiente | Sí | No |
| Etiquetas de fecha | ACT, EST, PLN, No ETA, AI-read | Confirmed, Estimate, Planned, Not known yet |
| Pasos hechos y fuentes | Todos. Lectura IA: email + Accept / Reject. `NOT_MAPPED`: crudo | Confirmados y lecturas IA aceptadas, sin marca de IA |
| Próximos pasos | Con la alternativa IA, si existe | Sin alternativa |
| Acción siguiente | Sí | No |
| Documentos | Open y Upload | No |
| Entregados (plegados) | Sí | Sí |

## 11. Stack y calidad

Vite + React + TypeScript + Tailwind + TanStack Router (rutas por archivo) + TanStack Query + Vitest. Gestor: pnpm. Sin backend real, sin Next.js, sin librería de componentes.

```
src/
  api/         contracts.ts (tipos del cable), client.ts (única puerta al backend)
  mock-api/    server.ts (perímetro, actividad, IA mock) + fixtures/ (shipments, emails, operators, personas, aiReadings)
  domain/      adapters/ (dhl, dcsa, terminal49, email, vocabularies), mapShipment.ts, stateMachine.ts, rules.ts, clock.ts — TS puro
  data/        shipments.ts (queries y selectores)
  i18n/        en.ts
  routes/      index, ops, subsidiary, customer
  components/  ui/ (primitivas) y shipments/ (lista, tarjeta, barra de etapas, pasos, fuentes, acciones, documentos, banner)
```

- `domain/` no importa React y solo importa tipos de `api/contracts`.
- **i18n:** los componentes no contienen texto visible. Todos los textos están en `src/i18n/en.ts` y se leen con `t('clave', { params })`. Un idioma nuevo es un archivo nuevo.
- **Tests (Vitest):** cada adaptador; `mapShipment` con los 7 envíos (estado, ETA, stale, incidencias, acciones); cada caso de `applyEvent`.
- La app funciona en escritorio, en móvil y con teclado.

## 12. Demo y criterios de aceptación

**Demo (unos 5 minutos, desde el estado inicial):**

1. **`/ops`:** contadores de los filtros. Needs review = 1.
2. **ACM-24790:** lectura IA pendiente del email de TransPirineo (avería cerca de Lyon). Alternativa "Tue 24 Nov". "Avisar al cliente" bloqueado. Accept → ETA Tue 24, con Mon 23 tachado, y "+1 d".
3. **ACM-24817:** retención en Veracruz con sus fuentes (DCSA, Terminal API, email aceptado). Factura `flagged` y factura corregida `missing`. Subir documento → "Uploaded". Avisar al cliente → hecho.
4. **ACM-24801:** DeCA `missing` → Subir documento. **ACM-24755:** stale 88 h → Contactar al operador.
5. **`/subsidiary`:** ve ACM-24817 y ACM-24866. Banner: retención de ACM-24817. **`/customer`:** ve ACM-24790 con la ETA aceptada. Banner: "+1 d late" con motivo "Vehicle breakdown". Etiquetas en palabras, sin acciones.
6. **Perímetro:** en `/customer`, la búsqueda de ACM-24812 no devuelve resultados.

**Criterios:**

- [ ] Los 7 envíos salen de fixtures crudos con la forma de `api-responses.md`, a través de adaptadores y `mapShipment`.
- [ ] Cada paso muestra su fuente y su etiqueta. Un valor no reconocido queda `NOT_MAPPED`.
- [ ] El sistema no calcula ninguna ETA. Sin ETA del operador, la fila oculta la columna ETA.
- [ ] Una lectura IA no cambia nada hasta que ops la acepta. El cliente no la ve antes.
- [ ] Incidencias y acciones siguen §8.5. Las acciones aparecen solo en `/ops`.
- [ ] El banner sigue §8.6 y solo aparece en `/subsidiary` y `/customer`.
- [ ] Ningún rol ve envíos fuera de su perímetro.
- [ ] `pnpm dev` arranca la app y `pnpm test` pasa.
- [ ] La app está desplegada en Vercel y el repositorio es accesible.
- [ ] El write-up tiene 4 páginas como máximo.
