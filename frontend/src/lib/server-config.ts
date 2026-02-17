const DEFAULT_SERVER_ORIGIN = "http://localhost:2500";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function toWebSocketUrl(httpUrl: string): string {
  if (httpUrl.startsWith("https://")) {
    return `wss://${httpUrl.slice("https://".length)}`;
  }
  if (httpUrl.startsWith("http://")) {
    return `ws://${httpUrl.slice("http://".length)}`;
  }
  return httpUrl;
}

const serverOrigin = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SERVER_URL || DEFAULT_SERVER_ORIGIN,
);

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || `${serverOrigin}/api`;

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "";

export const DEFAULT_WS_URL = `${toWebSocketUrl(serverOrigin)}/ws`;
