import { BoundedBuffer } from '../../utils/bounded-buffer';
import { decodeHubFrame } from './signalr-messages';

export interface SentInvocation {
  target: string;
  instruments: readonly string[];
}

const MAX_SENT_INVOCATIONS = 200;

/**
 * Decoded record of one SignalR hub connection: the client's handshake, the invocations it sent
 * (target + instrument short names) and how many messages of each target it received. Bounded;
 * push payloads are never stored.
 */
export class HubTraffic {
  readonly #sent = new BoundedBuffer<SentInvocation>(MAX_SENT_INVOCATIONS);
  readonly #received = new Map<string, number>();
  #handshake: unknown;
  #framesReceived = 0;
  #undecodable = 0;

  recordSent(payload: string | Uint8Array): void {
    for (const message of decodeHubFrame(payload)) {
      if (message.kind === 'handshake') this.#handshake ??= message.json;
      else if (message.kind === 'invocation' || message.kind === 'stream-invocation') {
        this.#sent.push({ target: message.target, instruments: message.instruments });
      } else if (message.kind === 'unknown') this.#undecodable++;
    }
  }

  recordReceived(payload: string | Uint8Array): void {
    this.#framesReceived++;
    for (const message of decodeHubFrame(payload)) {
      const key =
        message.kind === 'invocation' || message.kind === 'stream-invocation'
          ? message.target
          : message.kind;
      if (message.kind === 'unknown') this.#undecodable++;
      this.#received.set(key, (this.#received.get(key) ?? 0) + 1);
    }
  }

  /** The handshake the client sent, or undefined before it was sent. */
  get handshake(): unknown {
    return this.#handshake;
  }

  get framesReceived(): number {
    return this.#framesReceived;
  }

  /** Frames whose envelope could not be decoded (should stay 0). */
  get undecodable(): number {
    return this.#undecodable;
  }

  /** Invocations the client sent, optionally only those of one target. */
  sent(target?: string): readonly SentInvocation[] {
    return target === undefined
      ? this.#sent.items
      : this.#sent.items.filter((invocation) => invocation.target === target);
  }

  /** Number of received messages of one target (e.g. `OnNewPriceAsync`) or kind (e.g. `ping`). */
  received(targetOrKind: string): number {
    return this.#received.get(targetOrKind) ?? 0;
  }
}
