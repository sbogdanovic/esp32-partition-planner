import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { t } from "@/i18n";
import type { PlannerViewModel } from "@/modules/planner/domain/types";

type EncryptionSettingsProps = {
  planner: PlannerViewModel;
};

export default function EncryptionSettings({ planner }: EncryptionSettingsProps): JSX.Element {
  const { result, state, actions } = planner;

  return (
    <section className="mt-6 space-y-4">
      <Separator />
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{t("encryption.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("encryption.subtitle")}</p>
      </div>

      <TooltipProvider delayDuration={100}>
        <div className="grid gap-2">
          {result.encryptionLegend.map((entry) => (
            <div key={entry.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-border/80 bg-background/80 px-3 py-2">
              <Checkbox
                id={`enc-${entry.id}`}
                checked={entry.locked ? true : Boolean(state.encryptionSelections[entry.id])}
                disabled={entry.locked}
                onCheckedChange={(value) => actions.onEncryptionChange(entry.id, Boolean(value))}
              />

              <div className="min-w-0">
                <Label htmlFor={`enc-${entry.id}`} className="font-mono text-xs md:text-sm">
                  {entry.label}
                </Label>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-full" aria-label={entry.tooltip}>
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <Badge variant={entry.locked ? "warning" : entry.recommended ? "success" : "muted"}>
                      {entry.locked
                        ? t("encryption.tooltipStatus.auto")
                        : entry.recommended
                          ? t("encryption.tooltipStatus.recommended")
                          : t("encryption.tooltipStatus.optional")}
                    </Badge>
                    <p className="text-xs leading-relaxed text-slate-200">{entry.tooltip}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>
      </TooltipProvider>
    </section>
  );
}
