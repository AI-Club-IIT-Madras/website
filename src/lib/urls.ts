/** All local links and assets work under both /website and a custom-domain root. */
export function localUrl(path: string): string {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}
export function academicYear(value: string): string {
  return `20${value.slice(0, 2)}–20${value.slice(3)}`;
}
