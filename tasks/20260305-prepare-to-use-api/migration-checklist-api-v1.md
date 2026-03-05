# Autoteka: Migration Checklist (API Contract v1)

Отмечай пункты галочками в PR.

---

## Stage 0 — Baseline
- [ ] Добавлены unit-тесты сортировки (UT-01)
- [ ] Добавлены e2e smoke (E2E-01..E2E-03 минимум)
- [ ] Добавлен `check:mocks` (хотя бы минимально для legacy)
- [ ] CI прогоняет: check → unit → e2e → build

---

## Stage 1a — Enrich mocks (data-only)
- [ ] Сгенерирован `docs/` план миграции (этот пакет)
- [ ] Создан `city-list.json` с `sort`
- [ ] Создан `category-list.json` с `id/name/sort`
- [ ] Создан `feature-list.json` с `id/name/sort`
- [ ] `shops.json` расширен: `cityId/categoryIds/featureIds` (legacy поля сохранены)
- [ ] `npm run check:mocks` проходит

---

## Stage 1b — Switch shops reading (NO fallback)
- [ ] CatalogPage читает `cityId/categoryIds/featureIds`
- [ ] sortShops работает по ID
- [ ] ShopPage читает `categoryIds/featureIds`
- [ ] Любая нехватка полей валится тестами/валидатором
- [ ] unit + e2e + build проходят

---

## Stage 2 — Switch dicts reading & state ids
- [ ] CitySelect читает `city-list`
- [ ] CategoryChips читает `category-list`
- [ ] FeatureSelect читает `feature-list`
- [ ] state хранит ID-шники (cityId/categoryIds/featureId)
- [ ] дефолты берутся как “первый элемент после sort”
- [ ] unit + e2e проходят

---

## Stage 3 — Show all categories & features on ShopPage
- [ ] В карточке рендерятся категории (ID → name)
- [ ] В карточке рендерятся фичи (ID → name)
- [ ] E2E проверяет наличие этих блоков

---

## Stage 4 — Contacts via acceptable-contact-types
- [ ] ShopPage не читает `shop.contacts`
- [ ] GET shop возвращает ShopPublic без contacts (в переходном мок-режиме)
- [ ] POST acceptable types возвращает сгруппированные контакты
- [ ] UT-04 покрывает фильтрацию/группировку

---

## Stage 5 — ApiClient everywhere (no direct mocks imports)
- [ ] Введён `ApiClient` с методами 1:1
- [ ] `MockApiClient` возвращает Promise и делает поиск/пагинацию
- [ ] Ни один компонент не импортирует `src/mocks/*` напрямую
- [ ] UT-05/UT-06 покрывают пагинацию/поиск

---

## Stage 6 — Errors & resilience
- [ ] UI states: loading/empty/error
- [ ] 404 shop/city → заглушка + назад
- [ ] E2E-04 (404) проходит
