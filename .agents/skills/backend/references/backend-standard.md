# Backend standard

## Stack

- Laravel 12+
- PHP 8.2+
- MoonShine 4.8+
- SQLite 3.35+
- Composer path packages

## Target architecture

- `backend/packages/SchemaDefinition` — only schema DB truth
- `backend/packages/*` — shared business packages
- `backend/apps/ShopOperator` — MoonShine runtime
- `backend/apps/ShopAPI` — API runtime

## Main rule for code placement

If logic must survive interface changes, it is not runtime code.

### How to do it

```php
final class GenerateWorkingHoursController
{
    public function __invoke(
        GenerateWorkingHoursRequest $request,
        GenerateWorkingHours $action,
    ): JsonResponse {
        $action->handle(new GenerateWorkingHoursData(
            shopId: $request->integer('shop_id'),
        ));

        return response()->json(['status' => 'ok']);
    }
}
```

```php
final class WorkingHoursResource extends ModelResource
{
    public function afterCreated(Model $item): void
    {
        app(GenerateWorkingHours::class)->handle(
            new GenerateWorkingHoursData(shopId: (int) $item->getKey())
        );
    }
}
```

### How not to do it

```php
final class GenerateWorkingHoursController
{
    public function __invoke(Request $request): JsonResponse
    {
        foreach ($this->buildSlots($request->integer('shop_id')) as $slot) {
            ShopSchedule::create($slot);
        }

        return response()->json(['status' => 'ok']);
    }
}
```

```php
final class WorkingHoursResource extends ModelResource
{
    public function afterCreated(Model $item): void
    {
        foreach ($this->buildSlots((int) $item->getKey()) as $slot) {
            ShopSchedule::create($slot);
        }
    }
}
```

The bad version duplicates the same algorithm in two runtimes.

## SchemaDefinition

`backend/packages/SchemaDefinition` may contain only:

- migrations;
- schema enums/constants/contracts;
- provider that wires schema loading.

It must not contain use cases or domain rules.

## Working hours

Generation of working hours is package logic, not MoonShine resource logic and not API controller logic.

## Code generation

Generation of `code` may stay in runtime/infrastructure only when it is purely technical normalization. If it becomes a reusable rule or part of data meaning, move it into a shared package.

## Testing

For new business logic, write the package test first.

- unit/package test for rule or use case;
- feature test only for runtime wiring.

## Transactions

Start a transaction in the use case that owns the business operation, not in controller or MoonShine resource.
