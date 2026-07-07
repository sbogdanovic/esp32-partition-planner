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
    <label className="field">
      <span>{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <small>{hint}</small> : null}
    </label>
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
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        name={name}
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
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
    <label className="check-field">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
