import { useMemo, useReducer } from "react";
import {
  PRESET_OPTIONS,
  VARIANTS
} from "@/modules/planner/domain/constants";
import { t } from "@/i18n";
import {
  buildPartitionResult,
  getInitialEncryptionSelections
} from "@/modules/planner/domain/partitionEngine";
import { getPresetConfig } from "@/modules/planner/domain/presets";
import { toNumber } from "@/modules/planner/domain/formatters";
import type {
  PlannerFieldChangeKey,
  PlannerState,
  PlannerToggleChangeKey,
  PlannerViewModel,
  PresetId,
  VariantId
} from "@/modules/planner/domain/types";

const INITIAL_VARIANT: VariantId = "esp32";
const INITIAL_PRESET: PresetId = "balanced";

type PlannerAction =
  | { type: "variant.changed"; value: VariantId }
  | { type: "flash.changed"; value: number }
  | { type: "preset.changed"; value: PresetId }
  | { type: "field.changed"; name: PlannerFieldChangeKey; value: string }
  | { type: "toggle.changed"; name: PlannerToggleChangeKey; checked: boolean }
  | { type: "encryption.changed"; id: string; checked: boolean };

export default function usePlanner(): PlannerViewModel {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const result = useMemo(() => buildPartitionResult(state), [state]);

  const variantOptions = useMemo(
    () => Object.keys(VARIANTS).map((value) => ({ value: value as VariantId, label: t(`options.variants.${value}`) })),
    []
  );

  const flashSizeOptions = useMemo(
    () => VARIANTS[state.variant].flashSizesMb.map((value) => ({ value, label: t("options.flashMb", { size: value }) })),
    [state.variant]
  );

  const presetOptions = useMemo(
    () => PRESET_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    []
  );

  return {
    state,
    result,
    variantOptions,
    flashSizeOptions,
    presetOptions,
    actions: {
      onVariantChange: (value) => dispatch({ type: "variant.changed", value }),
      onFlashSizeChange: (value) => dispatch({ type: "flash.changed", value: toNumber(value, state.flashSizeMb) }),
      onPresetChange: (value) => dispatch({ type: "preset.changed", value }),
      onFieldChange: (name, value) => dispatch({ type: "field.changed", name, value }),
      onToggleChange: (name, checked) => dispatch({ type: "toggle.changed", name, checked }),
      onEncryptionChange: (id, checked) => dispatch({ type: "encryption.changed", id, checked })
    }
  };
}

function createInitialState(): PlannerState {
  const defaultFlashMb = VARIANTS[INITIAL_VARIANT].defaultMb;
  const presetConfig = getPresetConfig(INITIAL_PRESET, defaultFlashMb);

  return {
    variant: INITIAL_VARIANT,
    flashSizeMb: defaultFlashMb,
    preset: INITIAL_PRESET,
    ...presetConfig,
    encryptionSelections: getInitialEncryptionSelections()
  };
}

function reducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case "variant.changed": {
      const nextVariant = action.value;
      const nextDefaultFlash = VARIANTS[nextVariant].defaultMb;
      const presetConfig = getPresetConfig(state.preset, nextDefaultFlash);

      return {
        ...state,
        variant: nextVariant,
        flashSizeMb: nextDefaultFlash,
        ...presetConfig,
        encryptionSelections: getInitialEncryptionSelections()
      };
    }

    case "flash.changed": {
      const presetConfig = getPresetConfig(state.preset, action.value);
      return {
        ...state,
        flashSizeMb: action.value,
        ...presetConfig,
        encryptionSelections: getInitialEncryptionSelections()
      };
    }

    case "preset.changed": {
      const presetConfig = getPresetConfig(action.value, state.flashSizeMb);
      return {
        ...state,
        preset: action.value,
        ...presetConfig,
        encryptionSelections: getInitialEncryptionSelections()
      };
    }

    case "field.changed": {
      const currentValue = state[action.name];
      const nextValue = typeof currentValue === "number"
        ? toNumber(action.value, currentValue)
        : action.value;

      return {
        ...state,
        [action.name]: nextValue
      };
    }

    case "toggle.changed": {
      return {
        ...state,
        [action.name]: action.checked
      };
    }

    case "encryption.changed": {
      return {
        ...state,
        encryptionSelections: {
          ...state.encryptionSelections,
          [action.id]: action.checked
        }
      };
    }

    default:
      return state;
  }
}
