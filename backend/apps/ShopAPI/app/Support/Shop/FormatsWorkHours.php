<?php

declare(strict_types=1);

namespace ShopAPI\Support\Shop;

use ShopAPI\Models\Shop;
use ShopAPI\Models\ShopSchedule;

final class FormatsWorkHours
{
    private const WEEKDAY_LABELS = [
        1 => 'Пн',
        2 => 'Вт',
        3 => 'Ср',
        4 => 'Чт',
        5 => 'Пт',
        6 => 'Сб',
        7 => 'Вс',
    ];

    public static function fromShop(Shop $shop): string
    {
        $parts = [];

        foreach ($shop->schedules->sortBy(['sort', 'weekday']) as $schedule) {
            if (! $schedule instanceof ShopSchedule || ! $schedule->is_published) {
                continue;
            }

            $parts[] = self::formatSchedule($schedule);
        }

        return implode("\n", array_filter($parts));
    }

    public static function formatSchedule(ShopSchedule $schedule): string
    {
        $label = self::WEEKDAY_LABELS[$schedule->weekday] ?? (string) $schedule->weekday;
        if ($schedule->time_from === '00:00' && $schedule->time_to === '00:00') {
            return $label . ' ' . config('autoteka.always_open_label');
        }

        return sprintf('%s %s-%s', $label, $schedule->time_from, $schedule->time_to);
    }
}
