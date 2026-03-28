<?php

declare(strict_types=1);

namespace ShopAPI\Support\Gallery;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

final class GalleryItemBuilder
{
    /**
     * @param  Collection<int, object>  $images
     * @param  Collection<int, object>  $videos
     * @return array<int, array<string, int|string>>
     */
    public function build(Collection $images, Collection $videos): array
    {
        $items = [
            ...$images->map(fn (object $image): array => $this->imageItem($image))->all(),
            ...$videos->map(fn (object $video): array => $this->videoItem($video))->all(),
        ];

        usort($items, fn (array $left, array $right): int => $this->compare($left, $right));

        return array_values($items);
    }

    /**
     * @return array{id: int, type: string, src: string, sort: int}
     */
    private function imageItem(object $image): array
    {
        return [
            'id' => (int) $image->id,
            'type' => 'image',
            'src' => Storage::disk((string) config('autoteka.media.disk'))->url((string) $image->file_path),
            'sort' => (int) $image->sort,
        ];
    }

    /**
     * @return array{id: int, type: string, src: string, poster: string, mime: string, sort: int}
     */
    private function videoItem(object $video): array
    {
        return [
            'id' => (int) $video->id,
            'type' => 'video',
            'src' => Storage::disk((string) config('autoteka.media.disk'))->url((string) $video->file_path),
            'poster' => Storage::disk((string) config('autoteka.media.disk'))->url((string) $video->poster_path),
            'mime' => (string) $video->mime,
            'sort' => (int) $video->sort,
        ];
    }

    private function compare(array $left, array $right): int
    {
        $sortCompare = ((int) $left['sort']) <=> ((int) $right['sort']);
        if ($sortCompare !== 0) {
            return $sortCompare;
        }

        $typeCompare = $this->typePriority((string) $left['type'])
            <=> $this->typePriority((string) $right['type']);
        if ($typeCompare !== 0) {
            return $typeCompare;
        }

        return ((int) $left['id']) <=> ((int) $right['id']);
    }

    private function typePriority(string $type): int
    {
        return $type === 'image' ? 0 : 1;
    }
}
