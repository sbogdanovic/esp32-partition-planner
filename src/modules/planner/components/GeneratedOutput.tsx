import PartitionMap from "@/modules/planner/components/PartitionMap";
import { formatBytes } from "@/modules/planner/domain/formatters";
import { t } from "@/i18n";
import type { PlannerViewModel } from "@/modules/planner/domain/types";

type GeneratedOutputProps = {
  planner: PlannerViewModel;
};

export default function GeneratedOutput({ planner }: GeneratedOutputProps): JSX.Element {
  const { state, result } = planner;

  const summary = t("output.summary", {
    variant: planner.variantOptions.find((item) => item.value === state.variant)?.label || state.variant,
    flash: formatBytes(result.flashBytes),
    used: formatBytes(result.usedBytes),
    usedPercent: ((result.usedBytes / result.flashBytes) * 100).toFixed(1),
    free: formatBytes(Math.max(0, result.remainingBytes))
  });

  return (
    <section className="panel panel-output">
      <div className="output-head">
        <h2>{t("output.title")}</h2>
        <div className="actions">
          <button type="button" onClick={() => copyCsv(result.csv)}>{t("output.copy")}</button>
          <button type="button" onClick={() => downloadCsv(result.csv)}>{t("output.download")}</button>
        </div>
      </div>

      <div className="summary">{summary}</div>

      <div className="messages">
        {result.errors.length === 0 ? (
          <p className="msg ok">{t("output.layoutValid")}</p>
        ) : null}

        {result.errors.map((error) => (
          <p key={error} className="msg error">{error}</p>
        ))}

        {result.warnings.map((warning) => (
          <p key={warning} className="msg warn">{warning}</p>
        ))}
      </div>

      <PartitionMap result={result} />
      <pre className="csv">{result.csv}</pre>

      <p className="refs">
        {t("output.rulesPrefix")}
        <a href="https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/partition-tables.html" target="_blank" rel="noreferrer"> {t("output.partitionTables")}</a>
        {` ${t("output.and")} `}
        <a href="https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/storage/spiffs.html" target="_blank" rel="noreferrer"> {t("output.spiffsNotes")}</a>.
      </p>
    </section>
  );
}

async function copyCsv(csv: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(csv);
  } catch {
    // Clipboard APIs may be blocked for file:// pages.
  }
}

function downloadCsv(csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "partitions.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}
