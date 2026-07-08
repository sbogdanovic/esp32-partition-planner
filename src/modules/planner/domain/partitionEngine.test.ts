import { describe, expect, it } from "vitest";
import { buildPartitionResult, getDefaultPartitionOrder } from "@/modules/planner/domain/partitionEngine";
import type { PlannerState } from "@/modules/planner/domain/types";

const DEFAULT_ORDER = getDefaultPartitionOrder();

function makeState(overrides: Partial<PlannerState> = {}): PlannerState {
  return {
    variant: "esp32",
    flashSizeMb: 4,
    preset: "balanced",
    scheme: "ota_no_factory",
    firmwareSizeKiB: 704,
    appSlotKiB: 1024,
    nvsKiB: 24,
    includePhy: true,
    includeNvsKeys: false,
    includeEfuse: false,
    efuseKiB: 16,
    includeCoredump: false,
    coredumpKiB: 64,
    fsType: "spiffs",
    fsKiB: 512,
    encryptionSelections: {
      nvs: true,
      phy_init: false,
      coredump: true,
      storage: false,
      efuse_em: false
    },
    partitionOrder: [...DEFAULT_ORDER],
    ...overrides
  };
}

describe("buildPartitionResult", () => {
  it("adds overflow error when layout exceeds flash", () => {
    const result = buildPartitionResult(
      makeState({
        scheme: "ota",
        appSlotKiB: 1536,
        fsKiB: 2048,
        includeCoredump: true,
        coredumpKiB: 512
      })
    );

    expect(result.errors.some((message) => message.includes("exceeds flash size"))).toBe(true);
  });

  it("reports app-too-small as error and does not emit headroom warning", () => {
    const result = buildPartitionResult(
      makeState({
        firmwareSizeKiB: 1024,
        appSlotKiB: 960
      })
    );

    expect(result.errors.some((message) => message.includes("smaller than firmware target"))).toBe(true);
    expect(result.warnings.some((message) => message.includes("256 KiB headroom"))).toBe(false);
  });

  it("aligns app partitions to 64 KiB boundaries", () => {
    const result = buildPartitionResult(makeState({ appSlotKiB: 1100 }));
    const appPartitions = result.parts.filter((part) => part.type === "app");

    expect(appPartitions.length).toBeGreaterThan(0);

    for (const part of appPartitions) {
      expect(part.offsetBytes % 0x10000).toBe(0);
      expect(part.sizeBytes % 0x10000).toBe(0);
    }
  });

  it("keeps efuse partition last in default order when enabled", () => {
    const result = buildPartitionResult(makeState({ includeEfuse: true, efuseKiB: 20, includeCoredump: true }));
    const lastPartition = result.parts[result.parts.length - 1];

    expect(lastPartition.name).toBe("efuse_em");
    expect(lastPartition.subtype).toBe("efuse");
  });

  it("follows custom order for enabled partitions", () => {
    const result = buildPartitionResult(
      makeState({
        includeNvsKeys: true,
        includeCoredump: true,
        partitionOrder: [
          "coredump",
          "nvs",
          "nvs_keys",
          "otadata",
          "phy_init",
          "factory",
          "ota_0",
          "ota_1",
          "storage",
          "efuse_em"
        ]
      })
    );

    const coredumpIndex = result.parts.findIndex((part) => part.id === "coredump");
    const nvsIndex = result.parts.findIndex((part) => part.id === "nvs");

    expect(coredumpIndex).toBeGreaterThanOrEqual(0);
    expect(nvsIndex).toBeGreaterThanOrEqual(0);
    expect(coredumpIndex).toBeLessThan(nvsIndex);
  });

  it("allows storage after efuse when user reorders that way", () => {
    const result = buildPartitionResult(
      makeState({
        includeEfuse: true,
        fsType: "spiffs",
        partitionOrder: [
          "nvs",
          "nvs_keys",
          "otadata",
          "phy_init",
          "factory",
          "ota_0",
          "ota_1",
          "efuse_em",
          "coredump",
          "storage"
        ]
      })
    );

    const storageIndex = result.parts.findIndex((part) => part.id === "storage");
    const efuseIndex = result.parts.findIndex((part) => part.id === "efuse_em");

    expect(storageIndex).toBeGreaterThanOrEqual(0);
    expect(efuseIndex).toBeGreaterThanOrEqual(0);
    expect(storageIndex).toBeGreaterThan(efuseIndex);
  });

  it("allows storage before coredump when user reorders that way", () => {
    const result = buildPartitionResult(
      makeState({
        includeEfuse: false,
        fsType: "spiffs",
        includeCoredump: true,
        partitionOrder: [
          "nvs",
          "nvs_keys",
          "otadata",
          "phy_init",
          "factory",
          "ota_0",
          "ota_1",
          "storage",
          "coredump",
          "efuse_em"
        ]
      })
    );

    const storageIndex = result.parts.findIndex((part) => part.id === "storage");
    const coredumpIndex = result.parts.findIndex((part) => part.id === "coredump");
    expect(storageIndex).toBeGreaterThanOrEqual(0);
    expect(coredumpIndex).toBeGreaterThanOrEqual(0);
    expect(storageIndex).toBeLessThan(coredumpIndex);
  });

  it("does not add CSV encrypted flags for auto-encrypted partitions", () => {
    const result = buildPartitionResult(makeState());
    const appPartition = result.parts.find((part) => part.type === "app");
    const otaDataPartition = result.parts.find((part) => part.subtype === "ota");

    expect(appPartition).toBeDefined();
    expect(otaDataPartition).toBeDefined();
    expect(appPartition?.encryption.statusClass).toBe("auto");
    expect(otaDataPartition?.encryption.statusClass).toBe("auto");
    expect(appPartition?.flags).toBe("");
    expect(otaDataPartition?.flags).toBe("");
  });

  it("applies user-selected encryption flags for optional partitions", () => {
    const result = buildPartitionResult(
      makeState({
        includeCoredump: true,
        encryptionSelections: {
          nvs: true,
          phy_init: true,
          coredump: false,
          storage: true,
          efuse_em: false
        }
      })
    );

    const nvs = result.parts.find((part) => part.id === "nvs");
    const phy = result.parts.find((part) => part.id === "phy_init");
    const storage = result.parts.find((part) => part.id === "storage");
    const coredump = result.parts.find((part) => part.id === "coredump");

    expect(nvs?.flags).toBe("encrypted");
    expect(phy?.flags).toBe("encrypted");
    expect(storage?.flags).toBe("encrypted");
    expect(coredump?.flags).toBe("");
  });

  it("renders CSV header and encrypted flag columns correctly", () => {
    const result = buildPartitionResult(
      makeState({
        encryptionSelections: {
          nvs: true,
          phy_init: false,
          coredump: true,
          storage: true,
          efuse_em: false
        }
      })
    );

    const lines = result.csv.trim().split("\n");
    expect(lines[0]).toBe("# Name, Type, SubType, Offset, Size, Flags");

    const nvsRow = lines.find((line) => line.startsWith("nvs,"));
    const storageRow = lines.find((line) => line.startsWith("storage,"));
    const appRow = lines.find((line) => line.startsWith("ota_0,"));

    expect(nvsRow).toContain(", encrypted");
    expect(storageRow).toContain(", encrypted");
    expect(appRow).not.toContain(", encrypted");
  });
});
