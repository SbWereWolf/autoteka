export function mapCodesToNames(
  codes: string[],
  map: Map<string, string>,
): string[] {
  return codes.map((code) => map.get(code) ?? `[unknown:${code}]`);
}
