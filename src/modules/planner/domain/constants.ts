import type { PresetId, VariantId } from "@/modules/planner/domain/types";

export const KiB = 1024;
export const MiB = 1024 * 1024;
export const SECTOR = 0x1000;
export const APP_ALIGN = 0x10000;
export const PARTITION_TABLE_OFFSET = 0x8000;

export const VARIANTS: Record<VariantId, { flashSizesMb: number[]; defaultMb: number }> = {
  esp32: { flashSizesMb: [4, 8, 16], defaultMb: 4 },
  esp32s2: { flashSizesMb: [2, 4, 8, 16], defaultMb: 4 },
  esp32s3: { flashSizesMb: [4, 8, 16, 32], defaultMb: 8 },
  esp32c2: { flashSizesMb: [2, 4], defaultMb: 4 },
  esp32c3: { flashSizesMb: [2, 4, 8, 16], defaultMb: 4 },
  esp32c6: { flashSizesMb: [4, 8, 16], defaultMb: 8 },
  esp32h2: { flashSizesMb: [2, 4], defaultMb: 4 }
};

export const PRESET_OPTIONS: Array<{ value: PresetId; labelKey: string }> = [
  { value: "balanced", labelKey: "options.presets.balanced" },
  { value: "max_app", labelKey: "options.presets.maxApp" },
  { value: "max_storage", labelKey: "options.presets.maxStorage" },
  { value: "production_secure", labelKey: "options.presets.productionSecure" }
];

export const PARTITION_COLORS: Record<string, string> = {
  app: "#f4a259",
  nvs: "#66c2a5",
  ota: "#6fa8dc",
  phy: "#7f8c8d",
  nvs_keys: "#ffd166",
  efuse: "#c084fc",
  coredump: "#ef476f",
  spiffs: "#9ad0f5",
  littlefs: "#4ecdc4",
  fat: "#95d5b2",
  unused: "#d9dee9"
};

export const ENCRYPTION_SELECTION_DEFAULTS: Record<string, boolean> = {
  nvs: true,
  phy_init: false,
  coredump: true,
  storage: false,
  efuse_em: false
};
