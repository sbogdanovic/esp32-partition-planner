import EncryptionSettings from "@/modules/planner/components/EncryptionSettings";
import { t } from "@/i18n";
import {
  CheckboxField,
  NumberField,
  SelectField
} from "@/modules/planner/components/Field";
import type { PlannerViewModel, SchemeId, SelectOption } from "@/modules/planner/domain/types";

const SCHEME_OPTIONS: Array<{ value: SchemeId; labelKey: string }> = [
  { value: "factory", labelKey: "options.scheme.factory" },
  { value: "ota", labelKey: "options.scheme.ota" },
  { value: "ota_no_factory", labelKey: "options.scheme.otaNoFactory" }
];

const FILESYSTEM_OPTIONS: Array<SelectOption<string> & { labelKey: string }> = [
  { value: "none", labelKey: "options.fs.none", label: "" },
  { value: "spiffs", labelKey: "options.fs.spiffs", label: "" },
  { value: "littlefs", labelKey: "options.fs.littlefs", label: "" },
  { value: "fat", labelKey: "options.fs.fat", label: "" }
];

type PlannerFormProps = {
  planner: PlannerViewModel;
};

export default function PlannerForm({ planner }: PlannerFormProps): JSX.Element {
  const { state, actions } = planner;

  return (
    <section className="panel panel-config">
      <div className="panel-head">
        <h1>{t("planner.title")}</h1>
        <p className="subtitle">
          {t("planner.subtitle")}
          <strong> {t("planner.csvName")}</strong>.
        </p>
      </div>

      <form className="form-grid" autoComplete="off">
        <SelectField
          label={t("fields.variant")}
          name="variant"
          value={state.variant}
          options={planner.variantOptions}
          onChange={(value) => actions.onVariantChange(value as PlannerViewModel["state"]["variant"])}
        />

        <SelectField
          label={t("fields.flashSize")}
          name="flashSize"
          value={state.flashSizeMb}
          options={planner.flashSizeOptions}
          onChange={actions.onFlashSizeChange}
        />

        <SelectField
          label={t("fields.scheme")}
          name="scheme"
          value={state.scheme}
          options={SCHEME_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
          onChange={(value) => actions.onFieldChange("scheme", value)}
        />

        <SelectField
          label={t("fields.preset")}
          name="preset"
          value={state.preset}
          options={planner.presetOptions}
          hint={t("fields.presetHint")}
          onChange={(value) => actions.onPresetChange(value as PlannerViewModel["state"]["preset"])}
        />

        <NumberField
          label={t("fields.firmwareSize")}
          name="firmwareSizeKiB"
          value={state.firmwareSizeKiB}
          min={256}
          step={64}
          hint={t("fields.firmwareSizeHint")}
          onChange={(value) => actions.onFieldChange("firmwareSizeKiB", value)}
        />

        <NumberField
          label={t("fields.appSlotSize")}
          name="appSlotKiB"
          value={state.appSlotKiB}
          min={320}
          step={64}
          hint={t("fields.appSlotSizeHint")}
          onChange={(value) => actions.onFieldChange("appSlotKiB", value)}
        />

        <NumberField
          label={t("fields.nvsSize")}
          name="nvsKiB"
          value={state.nvsKiB}
          min={12}
          step={4}
          hint={t("fields.nvsSizeHint")}
          onChange={(value) => actions.onFieldChange("nvsKiB", value)}
        />

        <CheckboxField
          name="includePhy"
          checked={state.includePhy}
          label={t("fields.includePhy")}
          onChange={(checked) => actions.onToggleChange("includePhy", checked)}
        />

        <CheckboxField
          name="includeNvsKeys"
          checked={state.includeNvsKeys}
          label={t("fields.includeNvsKeys")}
          onChange={(checked) => actions.onToggleChange("includeNvsKeys", checked)}
        />

        <CheckboxField
          name="includeCoredump"
          checked={state.includeCoredump}
          label={t("fields.includeCoredump")}
          onChange={(checked) => actions.onToggleChange("includeCoredump", checked)}
        />

        {state.includeCoredump ? (
          <NumberField
            label={t("fields.coredumpSize")}
            name="coredumpKiB"
            value={state.coredumpKiB}
            min={16}
            step={4}
            hint={t("fields.kibHint")}
            onChange={(value) => actions.onFieldChange("coredumpKiB", value)}
          />
        ) : null}

        <CheckboxField
          name="includeEfuse"
          checked={state.includeEfuse}
          label={t("fields.includeEfuse")}
          onChange={(checked) => actions.onToggleChange("includeEfuse", checked)}
        />

        {state.includeEfuse ? (
          <NumberField
            label={t("fields.efuseSize")}
            name="efuseKiB"
            value={state.efuseKiB}
            min={4}
            step={4}
            hint={t("fields.efuseSizeHint")}
            onChange={(value) => actions.onFieldChange("efuseKiB", value)}
          />
        ) : null}

        <SelectField
          label={t("fields.dataFs")}
          name="fsType"
          value={state.fsType}
          options={FILESYSTEM_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
          onChange={(value) => actions.onFieldChange("fsType", value)}
        />

        {state.fsType !== "none" ? (
          <NumberField
            label={t("fields.dataFsSize")}
            name="fsKiB"
            value={state.fsKiB}
            min={64}
            step={4}
            hint={t("fields.kibHint")}
            onChange={(value) => actions.onFieldChange("fsKiB", value)}
          />
        ) : null}
      </form>

      <EncryptionSettings planner={planner} />
    </section>
  );
}
