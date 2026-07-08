import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PARTITION_COLORS } from "@/modules/planner/domain/constants";
import { getDefaultPartitionOrder } from "@/modules/planner/domain/partitionEngine";
import { formatBytes } from "@/modules/planner/domain/formatters";
import { t } from "@/i18n";
import type { PartitionId, PartitionResult, PartitionRow } from "@/modules/planner/domain/types";

type PartitionMapProps = {
  result: PartitionResult;
  partitionOrder: PartitionId[];
  onPartitionOrderChange: (order: PartitionId[]) => void;
};

export default function PartitionMap({
  result,
  partitionOrder,
  onPartitionOrderChange
}: PartitionMapProps): JSX.Element {
  const safeFlash = Math.max(result.flashBytes, 1);
  const [draggingId, setDraggingId] = useState<PartitionId | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const visibleOrder = partitionOrder.filter((id) => result.parts.some((part) => part.id === id));
  const defaultVisibleOrder = getDefaultPartitionOrder().filter((id) => result.parts.some((part) => part.id === id));
  const isReordered = visibleOrder.length === defaultVisibleOrder.length
    ? visibleOrder.some((id, index) => id !== defaultVisibleOrder[index])
    : true;

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
        {visibleOrder.map((id, index) => {
          const part = result.parts.find((item) => item.id === id);
          if (!part) {
            return null;
          }

          const isDropBefore = dropIndex === index;

          return (
            <div key={part.id} className="relative">
              {isDropBefore ? (
                <div className="-top-1 absolute left-3 right-3 h-1 rounded-full bg-primary/70 transition-all" />
              ) : null}

              <div
                draggable
                onDragStart={() => {
                  setDraggingId(part.id);
                  setDropIndex(index);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDropIndex(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropIndex(index);
                }}
                onDrop={(event) => {
                  event.preventDefault();

                  if (!draggingId) {
                    return;
                  }

                  const next = visibleOrder.filter((item) => item !== draggingId);
                  const target = next.indexOf(part.id);
                  if (target < 0) {
                    return;
                  }

                  next.splice(target, 0, draggingId);
                  onPartitionOrderChange(next);
                  setDropIndex(null);
                }}
                className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded-md border border-border/80 bg-background/80 px-3 py-2 text-sm transition-colors ${draggingId === part.id ? "opacity-70" : "opacity-100"} cursor-pointer hover:bg-background active:cursor-grabbing`}
                title="Drag to reorder"
              >
                <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: getPartitionColor(part) }} />
                <span className="truncate">{part.name} ({part.type}/{part.subtype})</span>
                <span className="text-muted-foreground">{formatBytes(part.sizeBytes)}</span>
                <Badge variant={statusToBadge(part.encryption.statusClass)}>
                  {part.encryption.statusLabel}
                </Badge>
              </div>
            </div>
          );
        })}

        {dropIndex === visibleOrder.length ? (
          <div className="h-1 rounded-full bg-primary/70 transition-all" />
        ) : null}

        {isReordered ? (
          <div className="pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onPartitionOrderChange(getDefaultPartitionOrder())}
            >
              {t("output.orderReset")}
            </Button>
          </div>
        ) : null}
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
