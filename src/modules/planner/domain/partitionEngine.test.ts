import { describe, expect, it } from "vitest";
import { buildPartitionResult } from "@/modules/planner/domain/partitionEngine";
import type { PlannerState } from "@/modules/planner/domain/types";

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

  it("aligns app partitions to 64 KiB boundaries", () => {
    const result = buildPartitionResult(makeState({ appSlotKiB: 1100 }));
    const appPartitions = result.parts.filter((part) => part.type === "app");

    expect(appPartitions.length).toBeGreaterThan(0);

    for (const part of appPartitions) {
      expect(part.offsetBytes % 0x10000).toBe(0);
      expect(part.sizeBytes % 0x10000).toBe(0);
    }
  });

  it("keeps efuse partition as the last partition when enabled", () => {
    const result = buildPartitionResult(makeState({ includeEfuse: true, efuseKiB: 20 }));
    const lastPartition = result.parts[result.parts.length - 1];

    expect(lastPartition.name).toBe("efuse_em");
    expect(lastPartition.subtype).toBe("efuse");
  });

  it("forces encrypted flags for app and otadata partitions", () => {
    const result = buildPartitionResult(makeState());
    const appPartition = result.parts.find((part) => part.type === "app");
    const otaDataPartition = result.parts.find((part) => part.subtype === "ota");

    expect(appPartition).toBeDefined();
    expect(otaDataPartition).toBeDefined();
    expect(appPartition?.flags).toBe("encrypted");
    expect(otaDataPartition?.flags).toBe("encrypted");
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
    expect(appRow).toContain(", encrypted");
  });
});
