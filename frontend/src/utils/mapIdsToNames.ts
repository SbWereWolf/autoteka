export function mapIdsToNames(
  ids: string[],
  map: Map<string, string>,
): string[] {
  return ids.map((id) => map.get(id) ?? `[unknown:${id}]`);
}
