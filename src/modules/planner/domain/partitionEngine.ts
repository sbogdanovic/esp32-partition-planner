import {
  APP_ALIGN,
  ENCRYPTION_SELECTION_DEFAULTS,
  KiB,
  MiB,
  PARTITION_TABLE_OFFSET,
  SECTOR
} from "@/modules/planner/domain/constants";
import {
  alignUp,
  formatBytes,
  toBytesFromKiB,
  toHex
} from "@/modules/planner/domain/formatters";
import { t } from "@/i18n";
import type {
  EncryptionLegendRow,
  PartitionEncryption,
  PartitionId,
  PartitionResult,
  PartitionRow,
  PartitionType,
  PlannerState
} from "@/modules/planner/domain/types";

export function buildPartitionResult(state: PlannerState): PartitionResult {
  const parts: PartitionRow[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const flashBytes = state.flashSizeMb * MiB;
  const alignedNvs = alignUp(toBytesFromKiB(state.nvsKiB), SECTOR);

  if (alignedNvs < 0x3000) {
    warnings.push(t("messages.warnings.nvsTooSmall"));
  }

  const firmwareTargetBytes = toBytesFromKiB(state.firmwareSizeKiB);
  const appSlotBytes = toBytesFromKiB(state.appSlotKiB);

  if (appSlotBytes < firmwareTargetBytes + (256 * KiB)) {
    warnings.push(t("messages.warnings.appHeadroom"));
  }

  if (appSlotBytes % APP_ALIGN !== 0) {
    warnings.push(t("messages.warnings.appAlign"));
  }

  let cursor = PARTITION_TABLE_OFFSET + SECTOR;

  pushPartition(parts, "nvs", "nvs", "data", "nvs", cursor, alignedNvs);
  cursor += alignedNvs;

  if (state.scheme !== "factory") {
    pushPartition(parts, "otadata", "otadata", "data", "ota", cursor, 0x2000);
    cursor += 0x2000;
  }

  if (state.includePhy) {
    pushPartition(parts, "phy_init", "phy_init", "data", "phy", cursor, 0x1000);
    cursor += 0x1000;
  }

  if (state.includeNvsKeys) {
    pushPartition(parts, "nvs_keys", "nvs_keys", "data", "nvs_keys", cursor, 0x1000);
    cursor += 0x1000;
  }

  if (state.includeCoredump) {
    const coredumpBytes = alignUp(toBytesFromKiB(state.coredumpKiB), SECTOR);
    pushPartition(parts, "coredump", "coredump", "data", "coredump", cursor, coredumpBytes);
    cursor += coredumpBytes;
  }

  cursor = alignUp(cursor, APP_ALIGN);
  const alignedAppSlot = alignUp(appSlotBytes, APP_ALIGN);

  if (state.scheme === "factory" || state.scheme === "ota") {
    pushPartition(parts, "factory", "factory", "app", "factory", cursor, alignedAppSlot);
    cursor += alignedAppSlot;
  }

  if (state.scheme === "ota" || state.scheme === "ota_no_factory") {
    pushPartition(parts, "ota_0", "ota_0", "app", "ota_0", cursor, alignedAppSlot);
    cursor += alignedAppSlot;

    pushPartition(parts, "ota_1", "ota_1", "app", "ota_1", cursor, alignedAppSlot);
    cursor += alignedAppSlot;
  }

  if (state.fsType !== "none") {
    const fsBytes = alignUp(toBytesFromKiB(state.fsKiB), SECTOR);
    pushPartition(parts, "storage", "storage", "data", state.fsType, cursor, fsBytes);
    cursor += fsBytes;
  }

  if (state.includeEfuse) {
    const efuseBytes = alignUp(toBytesFromKiB(state.efuseKiB), SECTOR);
    pushPartition(parts, "efuse_em", "efuse_em", "data", "efuse", cursor, efuseBytes);
    cursor += efuseBytes;
    warnings.push(t("messages.warnings.efuseProd"));
  }

  for (const part of parts) {
    const policy = getEncryptionPolicy(part);
    const userSelection = Boolean(state.encryptionSelections[part.id]);
    const encrypted = policy.locked || userSelection;

    part.encryption = {
      ...policy,
      encrypted,
      statusClass: policy.locked ? "auto" : encrypted ? "yes" : "no",
      statusLabel: policy.locked
        ? t("encryption.status.auto")
        : encrypted
          ? t("encryption.status.enabled")
          : t("encryption.status.off")
    };

    part.flags = encrypted ? "encrypted" : "";
  }

  const usedBytes = cursor;
  const remainingBytes = flashBytes - usedBytes;

  if (remainingBytes < 0) {
    errors.push(t("messages.errors.exceedsFlash", { size: formatBytes(Math.abs(remainingBytes)) }));
  } else if (remainingBytes < 128 * KiB) {
    warnings.push(t("messages.warnings.lowFreeSpace"));
  }

  if (state.fsType === "spiffs" && state.fsKiB > 0 && state.fsKiB < 256) {
    warnings.push(t("messages.warnings.spiffsSmall"));
  }

  return {
    parts,
    errors,
    warnings,
    csv: toPartitionCsv(parts),
    usedBytes,
    remainingBytes,
    flashBytes,
    encryptionLegend: buildEncryptionLegend(parts)
  };
}

export function getInitialEncryptionSelections(): Record<string, boolean> {
  return { ...ENCRYPTION_SELECTION_DEFAULTS };
}

function pushPartition(
  collection: PartitionRow[],
  id: PartitionId,
  name: string,
  type: PartitionType,
  subtype: string,
  offsetBytes: number,
  sizeBytes: number
): void {
  collection.push({
    id,
    name,
    type,
    subtype,
    offsetBytes,
    sizeBytes,
    flags: "",
    encryption: {
      locked: false,
      recommended: false,
      tooltip: "",
      encrypted: false,
      statusClass: "no",
      statusLabel: ""
    }
  });
}

function toPartitionCsv(parts: PartitionRow[]): string {
  const lines: string[] = [t("csv.header")];

  for (const part of parts) {
    lines.push([
      part.name,
      part.type,
      part.subtype,
      toHex(part.offsetBytes),
      toHex(part.sizeBytes),
      part.flags
    ].join(", "));
  }

  return `${lines.join("\n")}\n`;
}

function buildEncryptionLegend(parts: PartitionRow[]): EncryptionLegendRow[] {
  return parts.map((part) => ({
    id: part.id,
    label: `${part.name} (${part.type}/${part.subtype})`,
    encrypted: part.encryption.encrypted,
    locked: part.encryption.locked,
    recommended: part.encryption.recommended,
    tooltip: part.encryption.tooltip
  }));
}

function getEncryptionPolicy(part: PartitionRow): Omit<PartitionEncryption, "encrypted" | "statusClass" | "statusLabel"> {
  if (part.type === "app") {
    return {
      locked: true,
      recommended: true,
      tooltip: t("encryption.tooltip.app")
    };
  }

  if (part.type === "data" && part.subtype === "ota") {
    return {
      locked: true,
      recommended: true,
      tooltip: t("encryption.tooltip.otadata")
    };
  }

  if (part.type === "data" && part.subtype === "nvs_keys") {
    return {
      locked: true,
      recommended: true,
      tooltip: t("encryption.tooltip.nvsKeys")
    };
  }

  if (part.subtype === "nvs") {
    return {
      locked: false,
      recommended: true,
      tooltip: t("encryption.tooltip.nvs")
    };
  }

  if (part.subtype === "coredump") {
    return {
      locked: false,
      recommended: true,
      tooltip: t("encryption.tooltip.coredump")
    };
  }

  if (part.subtype === "efuse") {
    return {
      locked: false,
      recommended: false,
      tooltip: t("encryption.tooltip.efuse")
    };
  }

  if (part.id === "storage") {
    return {
      locked: false,
      recommended: false,
      tooltip: t("encryption.tooltip.storage")
    };
  }

  if (part.subtype === "phy") {
    return {
      locked: false,
      recommended: false,
      tooltip: t("encryption.tooltip.phy")
    };
  }

  return {
    locked: false,
    recommended: false,
    tooltip: t("encryption.tooltip.optional")
  };
}
