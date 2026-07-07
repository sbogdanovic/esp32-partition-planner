import { KiB, MiB } from "@/modules/planner/domain/constants";

export function toBytesFromKiB(value: number): number {
  return Math.max(value, 0) * KiB;
}

export function alignUp(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}

export function toHex(value: number): string {
  return `0x${value.toString(16)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= MiB) {
    return `${(bytes / MiB).toFixed(2)} MiB`;
  }

  return `${Math.round(bytes / KiB)} KiB`;
}

export function toNumber(value: string | number, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
