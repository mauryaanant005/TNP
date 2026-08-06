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
