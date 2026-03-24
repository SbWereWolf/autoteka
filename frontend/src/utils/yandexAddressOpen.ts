export function buildYandexNavigatorMapSearchUrl(address: string): string {
  const q = address.trim();
  return `yandexnavi://map_search?text=${encodeURIComponent(q)}`;
}

export function buildYandexMapsWebUrl(address: string): string {
  const q = address.trim();
  return `https://yandex.ru/maps/?text=${encodeURIComponent(q)}`;
}

/** Открывает Яндекс.Навигатор по тексту адреса (диплинк `map_search`). */
export function openYandexNavigatorMapSearch(address: string): void {
  const q = address.trim();
  if (!q) {
    return;
  }

  window.location.href = buildYandexNavigatorMapSearchUrl(q);
}
