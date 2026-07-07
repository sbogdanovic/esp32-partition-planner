export type VariantId =
  | "esp32"
  | "esp32s2"
  | "esp32s3"
  | "esp32c2"
  | "esp32c3"
  | "esp32c6"
  | "esp32h2";

export type PresetId =
  | "balanced"
  | "max_app"
  | "max_storage"
  | "production_secure";

export type SchemeId = "factory" | "ota" | "ota_no_factory";
export type FsType = "none" | "spiffs" | "littlefs" | "fat";

export type PartitionId =
  | "nvs"
  | "otadata"
  | "phy_init"
  | "nvs_keys"
  | "coredump"
  | "factory"
  | "ota_0"
  | "ota_1"
  | "storage"
  | "efuse_em";

export type PartitionType = "app" | "data";

export interface SelectOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

export interface PlannerState {
  variant: VariantId;
  flashSizeMb: number;
  preset: PresetId;
  scheme: SchemeId;
  firmwareSizeKiB: number;
  appSlotKiB: number;
  nvsKiB: number;
  includePhy: boolean;
  includeNvsKeys: boolean;
  includeEfuse: boolean;
  efuseKiB: number;
  includeCoredump: boolean;
  coredumpKiB: number;
  fsType: FsType;
  fsKiB: number;
  encryptionSelections: Record<string, boolean>;
}

export interface PartitionEncryption {
  locked: boolean;
  recommended: boolean;
  tooltip: string;
  encrypted: boolean;
  statusClass: "auto" | "yes" | "no";
  statusLabel: string;
}

export interface PartitionRow {
  id: PartitionId;
  name: string;
  type: PartitionType;
  subtype: string;
  offsetBytes: number;
  sizeBytes: number;
  flags: string;
  encryption: PartitionEncryption;
}

export interface EncryptionLegendRow {
  id: PartitionId;
  label: string;
  encrypted: boolean;
  locked: boolean;
  recommended: boolean;
  tooltip: string;
}

export interface PartitionResult {
  parts: PartitionRow[];
  errors: string[];
  warnings: string[];
  csv: string;
  usedBytes: number;
  remainingBytes: number;
  flashBytes: number;
  encryptionLegend: EncryptionLegendRow[];
}

export interface PlannerViewModel {
  state: PlannerState;
  result: PartitionResult;
  variantOptions: SelectOption<VariantId>[];
  flashSizeOptions: SelectOption<number>[];
  presetOptions: SelectOption<PresetId>[];
  actions: {
    onVariantChange: (value: VariantId) => void;
    onFlashSizeChange: (value: string) => void;
    onPresetChange: (value: PresetId) => void;
    onFieldChange: <K extends keyof PlannerState>(name: K, value: string) => void;
    onToggleChange: <K extends keyof PlannerState>(name: K, checked: boolean) => void;
    onEncryptionChange: (id: string, checked: boolean) => void;
  };
}
