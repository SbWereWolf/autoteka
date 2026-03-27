<?php

declare(strict_types=1);

namespace Autoteka\DemoPromotion\Services;

use Autoteka\DemoPromotion\Support\PromotionImageStager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use ShopOperator\Models\Promotion;
use ShopOperator\Models\Shop;
use ShopOperator\MoonShine\Handlers\SavePromotionResourceHandler;

final class CreateDemoPromotionService
{
    public function __construct(
        private readonly SavePromotionResourceHandler $savePromotion,
        private readonly PromotionImageStager $imageStager,
    ) {
    }

    public function handle(Command $command): int
    {
        if (Promotion::query()->exists()) {
            $command->error('Таблица promotion уже не пустая. Сначала выполните demo:promo:purge.');

            return 1;
        }

        $shops = Shop::query()->orderBy('id')->get()->shuffle()->values();

        if ($shops->isEmpty()) {
            $command->warn('Магазины не найдены. Генерировать нечего.');

            return Command::SUCCESS;
        }

        $createdPromotions = 0;
        $createdImages = 0;
        $bucketCounts = [0, 0, 0, 0];

        try {
            foreach ($shops as $index => $shop) {
                $bucket = (int) floor(($index * 4) / $shops->count());
                $bucketCounts[$bucket]++;

                foreach ($this->promotionDefinitionsForBucket($bucket) as $definition) {
                    $payload = $this->makePromotionPayload($shop, $definition);
                    $createdImages += count($payload['gallery_entries']);

                    ($this->savePromotion)(new Promotion(), $payload);
                    $createdPromotions++;
                }
            }
        } catch (RuntimeException $e) {
            $command->error($e->getMessage());

            return 3;
        } finally {
            $this->imageStager->cleanup();
        }

        $command->info(sprintf(
            'Создано promotions: %d; изображений: %d; магазинов по корзинам: no=%d, future=%d, past=%d, mixed=%d.',
            $createdPromotions,
            $createdImages,
            $bucketCounts[0],
            $bucketCounts[1],
            $bucketCounts[2],
            $bucketCounts[3],
        ));

        return Command::SUCCESS;
    }

    /**
     * @return list<array{type: string, start_date: string, end_date: string}>
     */
    private function promotionDefinitionsForBucket(int $bucket): array
    {
        return match ($bucket) {
            0 => [],
            1 => $this->fixedTypeDefinitions('future'),
            2 => $this->fixedTypeDefinitions('past'),
            default => $this->mixedDefinitions(),
        };
    }

    /**
     * @return list<array{type: string, start_date: string, end_date: string}>
     */
    private function fixedTypeDefinitions(string $type): array
    {
        $result = [];
        $count = random_int(1, 5);

        for ($index = 0; $index < $count; $index++) {
            $result[] = $this->definitionForType($type);
        }

        return $result;
    }

    /**
     * @return list<array{type: string, start_date: string, end_date: string}>
     */
    private function mixedDefinitions(): array
    {
        $selectedTypes = [];

        foreach (['active', 'past', 'future'] as $type) {
            if ($this->chance(85)) {
                $selectedTypes[] = $type;
            }
        }

        if ($selectedTypes === []) {
            $selectedTypes[] = 'active';
        }

        $total = max(random_int(1, 5), count($selectedTypes));
        $assignedTypes = $selectedTypes;

        while (count($assignedTypes) < $total) {
            $assignedTypes[] = $selectedTypes[array_rand($selectedTypes)];
        }

        shuffle($assignedTypes);

        return array_map(fn (string $type): array => $this->definitionForType($type), $assignedTypes);
    }

    /**
     * @return array{type: string, start_date: string, end_date: string}
     */
    private function definitionForType(string $type): array
    {
        $today = now()->startOfDay();

        return match ($type) {
            'future' => $this->makeDefinition(
                'future',
                $today->copy()->addDays(7 + random_int(-4, 4)),
                $today->copy()->addDays(14 + random_int(-4, 4)),
            ),
            'past' => $this->makeDefinition(
                'past',
                $today->copy()->subDays(14 - random_int(-4, 4)),
                $today->copy()->subDays(7 - random_int(-4, 4)),
            ),
            default => $this->makeDefinition(
                'active',
                $today->copy()->addDays($this->pickWeightedOffset([-2, -1, 0])),
                $today->copy()->addDays($this->pickWeightedOffset([0, 1, 2])),
            ),
        };
    }

    /**
     * @param  array<int, int>  $offsets
     */
    private function pickWeightedOffset(array $offsets): int
    {
        $roll = random_int(1, 100);

        if ($roll <= 33) {
            return $offsets[0];
        }

        if ($roll <= 66) {
            return $offsets[1];
        }

        return $offsets[2];
    }

    /**
     * @return array{
     *     shop_id: int,
     *     title: string,
     *     description: string,
     *     start_date: string,
     *     end_date: string,
     *     is_published: bool,
     *     gallery_entries: list<array{file_path: string, original_name: string, sort: int, is_published: bool}>
     * }
     */
    private function makePromotionPayload(Shop $shop, array $definition): array
    {
        $galleryEntries = [];
        $imageCount = random_int(0, 5);

        for ($index = 0; $index < $imageCount; $index++) {
            $staged = $this->imageStager->stageRandomImage();
            $galleryEntries[] = [
                'file_path' => $staged['file_path'],
                'original_name' => $staged['original_name'],
                'sort' => $index,
                'is_published' => true,
            ];
        }

        $typeLabel = match ($definition['type']) {
            'future' => 'Будущая',
            'past' => 'Прошлая',
            default => 'Текущая',
        };

        return [
            'shop_id' => $shop->getKey(),
            'title' => sprintf('%s demo-акция %s %s', $typeLabel, $shop->title, $definition['start_date']),
            'description' => sprintf('Демо-акция для показа заказчику: %s.', mb_strtolower($typeLabel)),
            'start_date' => $definition['start_date'],
            'end_date' => $definition['end_date'],
            'is_published' => $this->chance(75),
            'gallery_entries' => $galleryEntries,
        ];
    }

    /**
     * @return array{type: string, start_date: string, end_date: string}
     */
    private function makeDefinition(string $type, \Carbon\CarbonInterface $start, \Carbon\CarbonInterface $end): array
    {
        if ($end->lt($start)) {
            $end = $start->copy();
        }

        return [
            'type' => $type,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
        ];
    }

    private function chance(int $percent): bool
    {
        return random_int(1, 100) <= $percent;
    }
}
