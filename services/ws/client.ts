"use client";

import {
  API_BASE_URL,
  refreshAccessToken,
  tokenStore,
} from "../apiClient";
import type { WsClientEvent, WsServerEvent } from "../dtos";

const HEARTBEAT_MS = 20_000;
const BACKOFF_MIN_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

type Handler<E extends WsServerEvent = WsServerEvent> = (event: E) => void;
type AnyHandler = Handler;

/**
 * Turns the API base URL (e.g. `https://grisel-inphase-gemma.ngrok-free.dev`)
 * into `wss://<host>/v1/ws?token=…`. The `/v1` prefix is added here because
 * `NEXT_PUBLIC_API_BASE_URL` intentionally omits it — the REST client adds
 * `/v1/*` per request, and the WS URL follows the same convention.
 */
function buildWsUrl(token: string): string {
  const base = (API_BASE_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is empty");
  const proto = base.startsWith("https")
    ? "wss"
    : base.startsWith("http")
    ? "ws"
    : "wss";
  const noProto = base.replace(/^https?:\/\//, "");
  // If the env value already ends in /v1 (unlikely but possible in some setups),
  // don't double it.
  const hostAndPath = noProto.endsWith("/v1") ? noProto : `${noProto}/v1`;
  return `${proto}://${hostAndPath}/ws?token=${encodeURIComponent(token)}`;
}

class WsClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<AnyHandler>>();
  private allHandlers = new Set<AnyHandler>();
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private attempts = 0;
  private wantOpen = false;
  private connectingPromise: Promise<void> | null = null;

  /**
   * Open (or ensure open) the socket. Safe to call repeatedly — becomes a
   * no-op if already open/opening.
   */
  connect(): Promise<void> {
    this.wantOpen = true;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return this.connectingPromise ?? Promise.resolve();
    }
    return this.doConnect();
  }

  private doConnect(): Promise<void> {
    const token = tokenStore.getAccess();
    if (!token) return Promise.resolve();

    let url: string;
    try {
      url = buildWsUrl(token);
    } catch (e) {
      console.warn("[ws] cannot build URL:", e);
      return Promise.resolve();
    }

    this.connectingPromise = new Promise<void>((resolve) => {
      const socket = new WebSocket(url);
      this.ws = socket;

      socket.onopen = () => {
        this.attempts = 0;
        this.startHeartbeat();
        resolve();
      };

      socket.onmessage = (ev) => {
        let event: WsServerEvent | null = null;
        try {
          event = JSON.parse(ev.data) as WsServerEvent;
        } catch {
          return;
        }
        if (!event || typeof event.type !== "string") return;
        this.dispatch(event);
      };

      socket.onclose = async (ev) => {
        this.stopHeartbeat();
        this.ws = null;
        this.connectingPromise = null;
        if (!this.wantOpen) return;

        // 1008 = auth failed. Try to refresh the token, then reconnect.
        if (ev.code === 1008) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) return; // refreshAccessToken redirects on hard failure
          this.scheduleReconnect(0);
          return;
        }
        this.scheduleReconnect();
      };

      socket.onerror = () => {
        // The `onclose` handler will run right after — do nothing here to
        // avoid double-scheduling reconnects.
      };
    });

    return this.connectingPromise;
  }

  /**
   * Cleanly close. Won't auto-reconnect.
   */
  disconnect() {
    this.wantOpen = false;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close(1000, "client-disconnect");
      } catch {}
      this.ws = null;
    }
    this.connectingPromise = null;
    this.attempts = 0;
  }

  private scheduleReconnect(delayOverride?: number) {
    if (!this.wantOpen) return;
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);

    const exp = Math.min(BACKOFF_MAX_MS, BACKOFF_MIN_MS * 2 ** this.attempts);
    const jitter = Math.random() * 0.3 * exp;
    const delay = delayOverride ?? Math.round(exp + jitter);
    this.attempts += 1;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.doConnect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      this.send({ type: "heartbeat" });
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private dispatch(event: WsServerEvent) {
    const typed = this.handlers.get(event.type);
    if (typed) typed.forEach((h) => h(event));
    this.allHandlers.forEach((h) => h(event));
  }

  /**
   * Subscribe to a specific event type. Returns an unsubscribe function.
   * Pass "*" to receive every event (useful for logging).
   */
  subscribe<T extends WsServerEvent["type"]>(
    type: T | "*",
    handler: (event: Extract<WsServerEvent, { type: T }>) => void
  ): () => void {
    if (type === "*") {
      this.allHandlers.add(handler as AnyHandler);
      return () => this.allHandlers.delete(handler as AnyHandler);
    }
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as AnyHandler);
    return () => set!.delete(handler as AnyHandler);
  }

  /**
   * Send a payload. No-ops silently if socket isn't open — callers who need
   * confirmed delivery should hit REST instead.
   */
  send(payload: WsClientEvent): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try {
      this.ws.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }
}

export const wsClient = new WsClient();
