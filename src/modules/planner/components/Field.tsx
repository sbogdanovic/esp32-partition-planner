import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { SelectOption } from "@/modules/planner/domain/types";

type SelectFieldProps<T extends string | number> = {
  label: string;
  name: string;
  value: T;
  options: Array<SelectOption<T>>;
  hint?: string;
  onChange: (value: string) => void;
};

export function SelectField<T extends string | number>({
  label,
  name,
  value,
  options,
  hint = "",
  onChange
}: SelectFieldProps<T>): JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Select name={name} value={String(value)} onValueChange={onChange}>
        <SelectTrigger id={name}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  name: string;
  value: number;
  min: number;
  step: number;
  hint?: string;
  onChange: (value: string) => void;
};

export function NumberField({
  label,
  name,
  value,
  min,
  step,
  hint = "",
  onChange
}: NumberFieldProps): JSX.Element {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type="number"
        name={name}
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type CheckboxFieldProps = {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function CheckboxField({ label, name, checked, onChange }: CheckboxFieldProps): JSX.Element {
  return (
    <div className="col-span-full flex items-center gap-3 rounded-md border border-border/80 bg-background/80 px-3 py-2">
      <Checkbox
        id={name}
        checked={checked}
        onCheckedChange={(value) => onChange(Boolean(value))}
      />
      <Label htmlFor={name} className="text-sm font-medium">{label}</Label>
    </div>
  );
}
