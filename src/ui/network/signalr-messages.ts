import { decode } from '@msgpack/msgpack';

// SignalR hub protocol over MessagePack (docs/product-discovery.md §7): every binary frame holds
// one or more messages, each prefixed by its length as a VarInt; each message is a MessagePack
// array whose first element is the message type. The handshake is JSON, terminated by the ASCII
// record separator, and may arrive as a text or a binary frame.
//
// Only the envelope is read: message kind, invocation target and instrument short names in the
// arguments (public data). Push payloads (e.g. OnNewPriceAsync) are opaque binary and are never
// decoded or stored.

const RECORD_SEPARATOR = 0x1e;
const OPEN_BRACE = 0x7b;

type MessageKind =
  | 'invocation'
  | 'stream-item'
  | 'completion'
  | 'stream-invocation'
  | 'cancel-invocation'
  | 'ping'
  | 'close';

const MESSAGE_KINDS: ReadonlyMap<number, MessageKind> = new Map([
  [1, 'invocation'],
  [2, 'stream-item'],
  [3, 'completion'],
  [4, 'stream-invocation'],
  [5, 'cancel-invocation'],
  [6, 'ping'],
  [7, 'close'],
]);

export type HubMessage =
  | { kind: 'handshake'; json: unknown }
  | {
      kind: 'invocation' | 'stream-invocation';
      target: string;
      /** String arguments, flattened from string arrays: instrument short names in practice. */
      instruments: string[];
    }
  | { kind: Exclude<MessageKind, 'invocation' | 'stream-invocation'> }
  | { kind: 'unknown'; reason: string };

/** Decodes one WebSocket frame payload into its hub messages. */
export function decodeHubFrame(payload: string | Uint8Array): HubMessage[] {
  if (typeof payload === 'string') return decodeHandshakes(payload);
  if (payload[0] === OPEN_BRACE) return decodeHandshakes(new TextDecoder().decode(payload));
  return splitLengthPrefixed(payload).map(decodeMessage);
}

function decodeHandshakes(text: string): HubMessage[] {
  return text
    .split(String.fromCharCode(RECORD_SEPARATOR))
    .filter((part) => part.trim() !== '')
    .map((part): HubMessage => {
      try {
        const json: unknown = JSON.parse(part);
        return { kind: 'handshake', json };
      } catch {
        return { kind: 'unknown', reason: 'text frame that is not JSON' };
      }
    });
}

function splitLengthPrefixed(bytes: Uint8Array): Uint8Array[] {
  const messages: Uint8Array[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    let length = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = bytes[offset] ?? 0;
      offset++;
      length |= (byte & 0x7f) << shift;
      shift += 7;
    } while ((byte & 0x80) !== 0 && shift < 35);
    messages.push(bytes.subarray(offset, offset + length));
    offset += length;
  }
  return messages;
}

function decodeMessage(bytes: Uint8Array): HubMessage {
  let message: unknown;
  try {
    message = decode(bytes);
  } catch (error: unknown) {
    return { kind: 'unknown', reason: error instanceof Error ? error.message : String(error) };
  }
  if (!Array.isArray(message) || typeof message[0] !== 'number') {
    return { kind: 'unknown', reason: 'not a SignalR message array' };
  }
  const kind = MESSAGE_KINDS.get(message[0]);
  if (kind === undefined) return { kind: 'unknown', reason: `message type ${String(message[0])}` };
  if (kind === 'invocation' || kind === 'stream-invocation') {
    // [type, headers, invocationId, target, arguments, streamIds?]
    const target: unknown = message[3];
    const args: unknown = message[4];
    return {
      kind,
      target: typeof target === 'string' ? target : '',
      instruments: Array.isArray(args)
        ? args.flat().filter((a): a is string => typeof a === 'string')
        : [],
    };
  }
  return { kind };
}
