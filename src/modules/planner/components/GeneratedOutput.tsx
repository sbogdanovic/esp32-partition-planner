import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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
    <Card className="border-border/70 bg-card/95 shadow-lg backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-xl">{t("output.title")}</CardTitle>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => copyCsv(result.csv)}>{t("output.copy")}</Button>
          <Button type="button" variant="outline" onClick={() => downloadCsv(result.csv)}>{t("output.download")}</Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
      <div className="rounded-lg border border-border/80 bg-background/80 p-3 text-sm font-medium">{summary}</div>

      <div className="space-y-2">
        {result.errors.length === 0 ? (
          <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {t("output.layoutValid")}
          </div>
        ) : null}

        {result.errors.map((error) => (
          <div key={error} className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ))}

        {result.warnings.map((warning) => (
          <div key={warning} className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{warning}</div>
        ))}
      </div>

      <PartitionMap result={result} />
      <pre className="max-h-[65vh] min-h-[360px] overflow-auto rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">{result.csv}</pre>

      <p className="text-sm text-muted-foreground">
        <Badge variant="outline" className="mr-2">ESP-IDF</Badge>
        {t("output.rulesPrefix")}
        <a href="https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/partition-tables.html" target="_blank" rel="noreferrer"> {t("output.partitionTables")}</a>
        {` ${t("output.and")} `}
        <a href="https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/storage/spiffs.html" target="_blank" rel="noreferrer"> {t("output.spiffsNotes")}</a>.
      </p>
      </CardContent>
    </Card>
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
