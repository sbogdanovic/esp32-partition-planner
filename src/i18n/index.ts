import en from "@/i18n/en.json";

type Dictionary = Record<string, unknown>;

export function t(path: string, params: Record<string, string | number> = {}): string {
  const raw = resolvePath(en, path);
  if (typeof raw !== "string") {
    return path;
  }

  return raw.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

function resolvePath(dictionary: Dictionary, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((current, segment) => {
      if (typeof current === "object" && current !== null && segment in (current as Dictionary)) {
        return (current as Dictionary)[segment];
      }
      return undefined;
    }, dictionary);
}
