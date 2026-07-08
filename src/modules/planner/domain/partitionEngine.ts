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

const DEFAULT_PARTITION_ORDER: PartitionId[] = [
  "nvs",
  "nvs_keys",
  "otadata",
  "phy_init",
  "factory",
  "ota_0",
  "ota_1",
  "coredump",
  "storage",
  "efuse_em"
];

export function getDefaultPartitionOrder(): PartitionId[] {
  return [...DEFAULT_PARTITION_ORDER];
}

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

  if (appSlotBytes < firmwareTargetBytes) {
    errors.push(t("messages.errors.appTooSmall"));
  } else if (appSlotBytes < firmwareTargetBytes + (256 * KiB)) {
    warnings.push(t("messages.warnings.appHeadroom"));
  }

  if (appSlotBytes % APP_ALIGN !== 0) {
    warnings.push(t("messages.warnings.appAlign"));
  }

  const effectiveOrder = getEffectiveOrder(state);
  let cursor = PARTITION_TABLE_OFFSET + SECTOR;
  const alignedAppSlot = alignUp(appSlotBytes, APP_ALIGN);

  for (const id of effectiveOrder) {
    if (id === "nvs") {
      pushPartition(parts, "nvs", "nvs", "data", "nvs", cursor, alignedNvs);
      cursor += alignedNvs;
      continue;
    }

    if (id === "nvs_keys") {
      pushPartition(parts, "nvs_keys", "nvs_keys", "data", "nvs_keys", cursor, 0x1000);
      cursor += 0x1000;
      continue;
    }

    if (id === "otadata") {
      pushPartition(parts, "otadata", "otadata", "data", "ota", cursor, 0x2000);
      cursor += 0x2000;
      continue;
    }

    if (id === "phy_init") {
      pushPartition(parts, "phy_init", "phy_init", "data", "phy", cursor, 0x1000);
      cursor += 0x1000;
      continue;
    }

    if (id === "factory") {
      cursor = alignUp(cursor, APP_ALIGN);
      pushPartition(parts, "factory", "factory", "app", "factory", cursor, alignedAppSlot);
      cursor += alignedAppSlot;
      continue;
    }

    if (id === "ota_0") {
      cursor = alignUp(cursor, APP_ALIGN);
      pushPartition(parts, "ota_0", "ota_0", "app", "ota_0", cursor, alignedAppSlot);
      cursor += alignedAppSlot;
      continue;
    }

    if (id === "ota_1") {
      cursor = alignUp(cursor, APP_ALIGN);
      pushPartition(parts, "ota_1", "ota_1", "app", "ota_1", cursor, alignedAppSlot);
      cursor += alignedAppSlot;
      continue;
    }

    if (id === "coredump") {
      const coredumpBytes = alignUp(toBytesFromKiB(state.coredumpKiB), SECTOR);
      pushPartition(parts, "coredump", "coredump", "data", "coredump", cursor, coredumpBytes);
      cursor += coredumpBytes;
      continue;
    }

    if (id === "storage") {
      const fsBytes = alignUp(toBytesFromKiB(state.fsKiB), SECTOR);
      pushPartition(parts, "storage", "storage", "data", state.fsType, cursor, fsBytes);
      cursor += fsBytes;
      continue;
    }

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

            // Flags represent explicit CSV partition flags, not implicit runtime encryption behavior.
            part.flags = userSelection ? "encrypted" : "";
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

function getEffectiveOrder(state: PlannerState): PartitionId[] {
  const requested = state.partitionOrder.length > 0
    ? state.partitionOrder
    : DEFAULT_PARTITION_ORDER;

  const unique: PartitionId[] = [];
  for (const id of requested) {
    if (!unique.includes(id)) {
      unique.push(id);
    }
  }

  for (const id of DEFAULT_PARTITION_ORDER) {
    if (!unique.includes(id)) {
      unique.push(id);
    }
  }

  return unique.filter((id) => isEnabled(id, state));
}

function isEnabled(id: PartitionId, state: PlannerState): boolean {
  if (id === "nvs") {
    return true;
  }

  if (id === "nvs_keys") {
    return state.includeNvsKeys;
  }

  if (id === "otadata") {
    return state.scheme !== "factory";
  }

  if (id === "phy_init") {
    return state.includePhy;
  }

  if (id === "factory") {
    return state.scheme === "factory" || state.scheme === "ota";
  }

  if (id === "ota_0" || id === "ota_1") {
    return state.scheme === "ota" || state.scheme === "ota_no_factory";
  }

  if (id === "coredump") {
    return state.includeCoredump;
  }

  if (id === "storage") {
    return state.fsType !== "none";
  }

  if (id === "efuse_em") {
    return state.includeEfuse;
  }

  return false;
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
