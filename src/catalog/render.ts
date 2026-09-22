import type { ImagePosition } from "./schema";

export const escapeHtml = (value: unknown): string => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

export const escapeAttribute = escapeHtml;

export const imagePositionCss = (position: ImagePosition): string => escapeAttribute(typeof position === "string" ? position : `${position.x}% ${position.y}%`);

export const itemNumber = (index: number): string => String(index + 1).padStart(2, "0");

export const catalogAssetPath = (baseUrl: string, path: string): string => `${baseUrl}${path.replace(/^\/+/, "")}`;
