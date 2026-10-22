# ADR 0007 — Decode the real-time hub envelope; inject disconnects through a local proxy

- Status: accepted
- Date: 2026-10-22
- Requirements: §5.2, §13 (P1), §15, §19

## Context

Live prices reach the Trade screen over a SignalR hub (`/signalr/v13/QuantfuryHub`) using the
MessagePack protocol. v1.0.0 checked only the transport: one connection, the handshake, frames
received. The requirements' P1 list asks for relevant messages, subscription behavior for a
selected instrument and a controlled disconnect/reconnect scenario, without publishing session
data and with negative scenarios through local mocks.

Observed on 2026-10-22 (product-discovery §7):

- frames are SignalR binary messages (VarInt length prefix + MessagePack array);
- the client invokes `SubscribeSystemUpdates`, `SubscribeToPriceStreams([shortNames])`,
  `UnsubscribePriceStreams`, and on instrument selection `SubscribeToDetailsStream([shortName])`
  and `SubscribeToTradesStream([shortName])`;
- the server pushes `OnNewPriceAsync`, `OnNewDetailsAsync`, `OnNewTradeAsync`; their argument is
  an opaque binary payload that is **not** MessagePack;
- after the server side drops the connection, the app opens a new one after a fixed ~15 s
  (3/3 observations), repeats the handshake and re-subscribes; the UI keeps its data.

## Decision

- Add **`@msgpack/msgpack`** (3.1.3, ISC, no dependencies) as the only new dependency; it is the
  reference MessagePack implementation for JavaScript.
- Decode **only the SignalR envelope** (`src/ui/network/signalr-messages.ts`): message kind,
  invocation target and string arguments (instrument short names — public data). Push payloads
  stay opaque: no attempt to reverse-engineer them, nothing stored.
- `HubTraffic` records one connection (bounded); `RealtimeHubMonitor` observes the live page
  read-only; `HubProxy` (mocked suite) routes the hub through `page.routeWebSocket`, forwards all
  frames to the real hub unchanged and can drop the connection.
- Tests: UI-07 (price subscriptions and pushes), UI-10 (selection subscribes to details and
  trades of that instrument, details arrive — on a 24/7 crypto pair), MOC-07 (drop → reconnect,
  handshake, re-subscribe, prices again, widgets keep data).

## Alternatives considered

| Alternative                                            | Why not                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `@microsoft/signalr` client in the tests               | A second client would test the library, not what the web app does; heavy dependency. |
| Hand-written MessagePack decoder                       | More code to trust and maintain than a small, well-tested library.                   |
| Decoding the push payloads                             | Undocumented binary format; reverse-engineering it is out of scope and brittle.      |
| Mocking the hub completely (no server)                 | Would only test our fake; the proxy keeps real traffic and injects just the failure. |
| Simulating disconnects with network throttling/offline | Affects all traffic, not the one connection under test.                              |

## Consequences

- Real-time behavior is covered at the protocol level the app relies on: subscriptions per
  instrument, pushes, recovery after a drop.
- MOC-07 takes ~20 s because of the app's fixed reconnect delay; the wait is derived from the
  observed delay (`OBSERVED_RECONNECT_DELAY_MS` + 10 s), not a sleep.
- Like all UI suites, these tests run locally and as a scheduled signal (ADR 0001).
- If the hub protocol or method names change, UI-07/UI-10 fail with the unmet subscription; the
  method names live in one place (`src/api/models/realtime.ts`).
