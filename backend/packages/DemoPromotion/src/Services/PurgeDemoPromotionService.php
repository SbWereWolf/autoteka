<?php

declare(strict_types=1);

namespace Autoteka\DemoPromotion\Services;

use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotion;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotionImage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use ShopOperator\Models\Promotion;
use ShopOperator\MoonShine\Handlers\SavePromotionResourceHandler;

final class PurgeDemoPromotionService
{
    public function __construct(
        private readonly SavePromotionResourceHandler $savePromotion,
    ) {
    }

    public function handle(Command $command): int
    {
        $promotionSchema = new SchemaPromotion();
        $imageSchema = new SchemaPromotionImage();

        $shopIdsWithImages = DB::table($imageSchema->table())
            ->join($promotionSchema->table(), $promotionSchema->dotId(), '=', $imageSchema->dotPromotionId())
            ->groupBy($promotionSchema->dotShopId())
            ->pluck($promotionSchema->dotShopId())
            ->map(static fn (mixed $value): int => (int) $value)
            ->filter(static fn (int $value): bool => $value > 0)
            ->values();

        $processedPromotions = 0;
        $deletedPromotions = 0;
        $residualAfterCleanup = 0;

        if ($shopIdsWithImages->isNotEmpty()) {
            $promotions = Promotion::query()
                ->whereIn($promotionSchema->shopId(), $shopIdsWithImages->all())
                ->with('galleryImages')
                ->get();

            foreach ($promotions as $promotion) {
                ($this->savePromotion)($promotion, [
                    $promotionSchema->shopId() => (int) $promotion->shop_id,
                    $promotionSchema->title() => (string) $promotion->title,
                    $promotionSchema->description() => (string) $promotion->description,
                    $promotionSchema->startDate() => $promotion->getAttribute($promotionSchema->startDate())?->format('Y-m-d')
                        ?? (string) $promotion->start_date,
                    $promotionSchema->endDate() => $promotion->getAttribute($promotionSchema->endDate())?->format('Y-m-d')
                        ?? (string) $promotion->end_date,
                    $promotionSchema->isPublished() => (bool) $promotion->is_published,
                    'gallery_entries' => [],
                ]);
                $processedPromotions++;
            }

            $residualAfterCleanup = (int) DB::table($imageSchema->table())->count();
        }

        $deletedPromotions = (int) DB::table($promotionSchema->table())->delete();
        $finalResidual = (int) DB::table($imageSchema->table())->count();

        $command->info(sprintf(
            'Очищено promotions через save-flow: %d; удалено promotions SQL: %d; остаток gallery rows после cleanup: %d; после SQL: %d.',
            $processedPromotions,
            $deletedPromotions,
            $residualAfterCleanup,
            $finalResidual,
        ));

        if ($residualAfterCleanup > 0 || $finalResidual > 0) {
            $command->warn('После завершения purge остались строки в promotion_gallery_image.');

            return 1;
        }

        return Command::SUCCESS;
    }
}
