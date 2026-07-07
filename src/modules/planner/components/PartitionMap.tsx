import { PARTITION_COLORS } from "@/modules/planner/domain/constants";
import { formatBytes } from "@/modules/planner/domain/formatters";
import { t } from "@/i18n";
import type { PartitionResult, PartitionRow } from "@/modules/planner/domain/types";

type PartitionMapProps = {
  result: PartitionResult;
};

export default function PartitionMap({ result }: PartitionMapProps): JSX.Element {
  const safeFlash = Math.max(result.flashBytes, 1);

  return (
    <div className="partition-map">
      <div className="map-track">
        {result.parts.map((part) => {
          const width = Math.max(Math.min((part.sizeBytes / safeFlash) * 100, 100), 0);
          return (
            <div
              key={part.id}
              className="seg"
              style={{ width: `${width.toFixed(4)}%`, background: getPartitionColor(part) }}
              data-label={part.name}
            />
          );
        })}

        {result.remainingBytes > 0 ? (
          <div
            className="seg unused"
            style={{
              width: `${Math.min((result.remainingBytes / safeFlash) * 100, 100).toFixed(4)}%`,
              background: PARTITION_COLORS.unused
            }}
            data-label={t("map.free")}
          />
        ) : null}
      </div>

      <div className="map-legend">
        {result.parts.map((part) => (
          <div key={part.id} className="legend-row">
            <span className="dot" style={{ background: getPartitionColor(part) }} />
            <span>{part.name} ({part.type}/{part.subtype})</span>
            <span>{formatBytes(part.sizeBytes)}</span>
            <span className={`enc ${part.encryption.statusClass}`}>
              {part.encryption.statusLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getPartitionColor(part: PartitionRow): string {
  if (part.type === "app") {
    return PARTITION_COLORS.app;
  }

  return PARTITION_COLORS[part.subtype] || "#b8c0d9";
}
