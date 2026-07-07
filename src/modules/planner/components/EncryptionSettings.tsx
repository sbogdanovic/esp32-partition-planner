import { useState } from "react";
import { t } from "@/i18n";
import type { PlannerViewModel } from "@/modules/planner/domain/types";

type EncryptionSettingsProps = {
  planner: PlannerViewModel;
};

export default function EncryptionSettings({ planner }: EncryptionSettingsProps): JSX.Element {
  const { result, state, actions } = planner;
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  return (
    <section className="enc-panel">
      <h3>{t("encryption.title")}</h3>
      <p className="enc-subtitle">
        {t("encryption.subtitle")}
      </p>

      <div className="enc-grid">
        {result.encryptionLegend.map((entry) => (
          <div key={entry.id} className="enc-option">
            <input
              id={`enc-${entry.id}`}
              type="checkbox"
              checked={entry.locked ? true : Boolean(state.encryptionSelections[entry.id])}
              disabled={entry.locked}
              onChange={(event) => actions.onEncryptionChange(entry.id, event.target.checked)}
            />
            <label htmlFor={`enc-${entry.id}`} className="enc-label">{entry.label}</label>
            <span className="enc-help">
              <button
                type="button"
                className={`pill ${entry.recommended ? "rec-yes" : "rec-no"}`}
                aria-label={entry.tooltip}
                aria-describedby={`enc-tip-${entry.id}`}
                aria-expanded={activeTooltipId === entry.id}
                onMouseEnter={() => setActiveTooltipId(entry.id)}
                onMouseLeave={() => setActiveTooltipId((current) => (current === entry.id ? null : current))}
                onFocus={() => setActiveTooltipId(entry.id)}
                onBlur={() => setActiveTooltipId((current) => (current === entry.id ? null : current))}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setActiveTooltipId((current) => (current === entry.id ? null : entry.id));
                }}
              >
                i
              </button>
              <span
                id={`enc-tip-${entry.id}`}
                role="tooltip"
                className={`enc-tooltip ${activeTooltipId === entry.id ? "visible" : ""}`}
              >
                <strong className="enc-tooltip-title">
                  {entry.locked
                    ? t("encryption.tooltipStatus.auto")
                    : entry.recommended
                      ? t("encryption.tooltipStatus.recommended")
                      : t("encryption.tooltipStatus.optional")}
                </strong>
                <span>{entry.tooltip}</span>
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
