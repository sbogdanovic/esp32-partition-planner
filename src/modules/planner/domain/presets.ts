import type { PlannerState, PresetId } from "@/modules/planner/domain/types";

type PresetConfig = Omit<
  PlannerState,
  "variant" | "flashSizeMb" | "preset" | "encryptionSelections"
>;

type PresetRule = {
  configForFlash: (flashMb: number) => PresetConfig;
};

export const PRESETS: Record<PresetId, PresetRule> = {
  balanced: {
    configForFlash(flashMb) {
      if (flashMb <= 2) {
        return baseConfig({
          scheme: "factory",
          firmwareSizeKiB: 512,
          appSlotKiB: 768,
          fsType: "spiffs",
          fsKiB: 256
        });
      }

      if (flashMb <= 4) {
        return baseConfig({
          scheme: "ota_no_factory",
          firmwareSizeKiB: 704,
          appSlotKiB: 1024,
          fsType: "spiffs",
          fsKiB: 512
        });
      }

      if (flashMb <= 8) {
        return baseConfig({
          scheme: "ota",
          firmwareSizeKiB: 1024,
          appSlotKiB: 1536,
          fsType: "spiffs",
          fsKiB: 1024
        });
      }

      if (flashMb <= 16) {
        return baseConfig({
          scheme: "ota",
          firmwareSizeKiB: 1536,
          appSlotKiB: 2560,
          fsType: "spiffs",
          fsKiB: 2048
        });
      }

      return baseConfig({
        scheme: "ota",
        firmwareSizeKiB: 2560,
        appSlotKiB: 4096,
        nvsKiB: 32,
        fsType: "spiffs",
        fsKiB: 4096
      });
    }
  },

  max_app: {
    configForFlash(flashMb) {
      if (flashMb <= 2) {
        return baseConfig({
          scheme: "factory",
          firmwareSizeKiB: 768,
          appSlotKiB: 1024,
          nvsKiB: 16,
          fsType: "none",
          fsKiB: 0
        });
      }

      if (flashMb <= 4) {
        return baseConfig({
          scheme: "ota_no_factory",
          firmwareSizeKiB: 1024,
          appSlotKiB: 1408,
          nvsKiB: 16,
          fsType: "none",
          fsKiB: 0
        });
      }

      if (flashMb <= 8) {
        return baseConfig({
          scheme: "ota_no_factory",
          firmwareSizeKiB: 2048,
          appSlotKiB: 2816,
          nvsKiB: 16,
          fsType: "none",
          fsKiB: 0
        });
      }

      return baseConfig({
        scheme: "ota_no_factory",
        firmwareSizeKiB: 3072,
        appSlotKiB: 5632,
        nvsKiB: 24,
        fsType: "none",
        fsKiB: 0
      });
    }
  },

  max_storage: {
    configForFlash(flashMb) {
      if (flashMb <= 2) {
        return baseConfig({
          scheme: "factory",
          firmwareSizeKiB: 384,
          appSlotKiB: 640,
          fsType: "spiffs",
          fsKiB: 768
        });
      }

      if (flashMb <= 4) {
        return baseConfig({
          scheme: "ota_no_factory",
          firmwareSizeKiB: 640,
          appSlotKiB: 896,
          fsType: "spiffs",
          fsKiB: 1536
        });
      }

      if (flashMb <= 8) {
        return baseConfig({
          scheme: "ota_no_factory",
          firmwareSizeKiB: 896,
          appSlotKiB: 1152,
          fsType: "spiffs",
          fsKiB: 4096
        });
      }

      return baseConfig({
        scheme: "ota_no_factory",
        firmwareSizeKiB: 1024,
        appSlotKiB: 1408,
        fsType: "spiffs",
        fsKiB: flashMb >= 32 ? 24576 : 8192
      });
    }
  },

  production_secure: {
    configForFlash(flashMb) {
      if (flashMb <= 4) {
        return baseConfig({
          scheme: "ota_no_factory",
          firmwareSizeKiB: 704,
          appSlotKiB: 1024,
          nvsKiB: 32,
          includeNvsKeys: true,
          includeCoredump: true,
          coredumpKiB: 96,
          fsType: "littlefs",
          fsKiB: 384
        });
      }

      if (flashMb <= 8) {
        return baseConfig({
          scheme: "ota",
          firmwareSizeKiB: 1024,
          appSlotKiB: 1408,
          nvsKiB: 32,
          includeNvsKeys: true,
          includeCoredump: true,
          coredumpKiB: 128,
          fsType: "littlefs",
          fsKiB: 768
        });
      }

      return baseConfig({
        scheme: "ota",
        firmwareSizeKiB: 1536,
        appSlotKiB: 2432,
        nvsKiB: 32,
        includeNvsKeys: true,
        includeCoredump: true,
        coredumpKiB: 256,
        fsType: "littlefs",
        fsKiB: 1536
      });
    }
  }
};

export function getPresetConfig(presetId: PresetId, flashMb: number): PresetConfig {
  const preset = PRESETS[presetId] || PRESETS.balanced;
  return preset.configForFlash(flashMb);
}

function baseConfig(override: Partial<PresetConfig>): PresetConfig {
  return {
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
    ...override
  };
}
