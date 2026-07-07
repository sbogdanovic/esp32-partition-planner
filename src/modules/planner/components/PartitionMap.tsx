import { Badge } from "@/components/ui/badge";
import { PARTITION_COLORS } from "@/modules/planner/domain/constants";
import { formatBytes } from "@/modules/planner/domain/formatters";
import type { PartitionResult, PartitionRow } from "@/modules/planner/domain/types";

type PartitionMapProps = {
  result: PartitionResult;
};

export default function PartitionMap({ result }: PartitionMapProps): JSX.Element {
  const safeFlash = Math.max(result.flashBytes, 1);

  return (
    <div className="space-y-3">
      <div
        className="flex h-7 overflow-hidden rounded-full border border-border"
        style={{
          backgroundColor: "hsl(var(--muted))",
          backgroundImage: "repeating-linear-gradient(135deg, transparent 0, transparent 7px, hsl(var(--border)) 6px, hsl(var(--border)) 8px)"
        }}
      >
        {result.parts.map((part) => {
          const width = Math.max(Math.min((part.sizeBytes / safeFlash) * 100, 100), 0);
          return (
            <div
              key={part.id}
              className="relative min-w-[2px] border-l border-white/50 first:border-l-0"
              style={{ width: `${width.toFixed(4)}%`, background: getPartitionColor(part) }}
              title={part.name}
            />
          );
        })}
      </div>

      <div className="grid gap-2">
        {result.parts.map((part) => (
          <div key={part.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded-md border border-border/80 bg-background/80 px-3 py-2 text-sm">
            <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: getPartitionColor(part) }} />
            <span className="truncate">{part.name} ({part.type}/{part.subtype})</span>
            <span className="text-muted-foreground">{formatBytes(part.sizeBytes)}</span>
            <Badge variant={statusToBadge(part.encryption.statusClass)}>
              {part.encryption.statusLabel}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusToBadge(statusClass: "auto" | "yes" | "no"): "warning" | "success" | "muted" {
  if (statusClass === "auto") {
    return "warning";
  }

  if (statusClass === "yes") {
    return "success";
  }

  return "muted";
}

function getPartitionColor(part: PartitionRow): string {
  if (part.type === "app") {
    return PARTITION_COLORS.app;
  }

  return PARTITION_COLORS[part.subtype] || "#b8c0d9";
}
