<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ShopAcceptableContactTypesController extends Controller
{
    public function __invoke(Request $request, string $code): JsonResponse
    {
        $shop = Shop::query()
            ->with([
                'contacts' => static fn ($query) => $query
                    ->where('is_published', true)
                    ->orderBy('sort')
                    ->orderBy('id'),
                'contacts.contactType' => static fn ($query) => $query
                    ->where('is_published', true),
            ])
            ->where('code', $code)
            ->where('is_published', true)
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

        return response()->json($response);
    }
}
