import axios from "axios";
import { SERVER_URL } from "@/constant";

// Centralized API client. The frontend (served by Nginx at the apex domain)
// and the Django API (served at api.<domain>) are separate origins in
// production, so every backend call needs an absolute base URL and
// `credentials: "include"` to send/receive the session + CSRF cookies
// cross-origin. SERVER_URL is "" in local dev (Vite's dev-server proxy
// handles same-origin relative requests instead).

export const api = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
});

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${SERVER_URL}${path}`, { ...init, credentials: "include" });
}

// DRF now paginates every list endpoint by default (T-15), so a list response
// is `{count, next, previous, results}` rather than a bare array. Endpoints
// that are plain APIViews still return an array, and older callers were
// written against that shape, so this accepts both.
//
// It only reads the first page. That is correct for the small, filtered lists
// it is used on; anything that can exceed PAGE_SIZE (50) needs real pagination
// UI, not this helper.
export function toList<T = unknown>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

// Builds a ws(s):// URL pointing at the API host for a given path (e.g.
// "/ws/notifications/"). In production SERVER_URL is an absolute
// "https://api.<domain>" origin - the API's own WebSocket route lives on
// that same host (TCET hosting standard 11.4: Traefik can route a
// dedicated socket.<domain> hostname to this same api container). In local
// dev SERVER_URL is "" (same-origin via Vite's proxy), so this falls back
// to the current page's own host.
export function buildWebSocketUrl(path: string): string {
  if (SERVER_URL) {
    const apiUrl = new URL(SERVER_URL);
    const wsProtocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${apiUrl.host}${path}`;
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}
