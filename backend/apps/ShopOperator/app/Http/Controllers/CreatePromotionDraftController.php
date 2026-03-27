<?php

declare(strict_types=1);

namespace ShopOperator\Http\Controllers;

use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use ShopOperator\Models\Promotion;
use ShopOperator\Models\Shop;
use ShopOperator\Support\Promotion\PromotionCodeGenerator;

final class CreatePromotionDraftController
{
    public function __invoke(Shop $shop): RedirectResponse
    {
        $schema = new SchemaPromotion();
        $timestamp = now();
        $title = sprintf('%s %s', $shop->title, $timestamp->format('Y-m-d H:i'));

        $promotion = DB::transaction(static function () use (
            $schema,
            $shop,
            $timestamp,
            $title,
        ): Promotion {
            $promotion = new Promotion();
            $promotion->fill([
                $schema->shopId() => $shop->getKey(),
                $schema->code() => PromotionCodeGenerator::generate($promotion, $shop, $title),
                $schema->title() => $title,
                $schema->description() => 'рекламная акция ' . $shop->title,
                $schema->startDate() => $timestamp->copy()->addDays(7)->toDateString(),
                $schema->endDate() => $timestamp->copy()->addDays(7)->toDateString(),
                $schema->isPublished() => false,
            ]);
            $promotion->save();

            return $promotion;
        });

        return redirect()->to(route('moonshine.crud.edit', [
            'resourceUri' => 'promotion-resource',
            'resourceItem' => $promotion->getKey(),
        ]));
    }
}
