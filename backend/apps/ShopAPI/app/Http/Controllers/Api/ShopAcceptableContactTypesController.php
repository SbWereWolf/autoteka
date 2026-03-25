<?php

declare(strict_types=1);

namespace ShopAPI\Http\Controllers\Api;

use ShopAPI\Http\Controllers\Controller;
use ShopAPI\Models\Shop;
use Autoteka\SchemaDefinition\SchemaTables\SchemaContactType;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShop;
use Autoteka\SchemaDefinition\SchemaTables\SchemaShopContact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ShopAcceptableContactTypesController extends Controller
{
    public function __invoke(Request $request, string $code): JsonResponse
    {
        $schShop = new SchemaShop();
        $schContact = new SchemaShopContact();
        $schContactType = new SchemaContactType();

        $shop = Shop::query()
            ->with([
                'contacts' => static function ($query) use ($schContact): void {
                    $query
                        ->where($schContact->isPublished(), true)
                        ->orderBy($schContact->sort())
                        ->orderBy($schContact->id());
                },
                'contacts.contactType' => static function ($query) use ($schContactType): void {
                    $query->where($schContactType->isPublished(), true);
                },
            ])
            ->where($schShop->code(), $code)
            ->where($schShop->isPublished(), true)
            ->firstOrFail();

        $allowedTypes = collect($request->all())
            ->filter(static fn (mixed $value): bool => is_string($value))
            ->map(static fn (string $value): string => trim($value))
            ->filter()
            ->values();

        $response = [];
        foreach ($shop->contacts as $contact) {
            $typeCode = $contact->contactType?->code;
            if (! is_string($typeCode) || ! $allowedTypes->contains($typeCode)) {
                continue;
            }

            $response[$typeCode] ??= [];
            $response[$typeCode][] = $contact->value;
        }

        return response()->json((object) $response);
    }
}
