<?php

declare(strict_types=1);

namespace App\Support\Media;

final class UploadOriginalNameStore
{
    private const SESSION_KEY = 'upload_original_names';

    public function register(string $storedNameOrPath, string $originalName): void
    {
        $storedNameOrPath = trim($storedNameOrPath);
        $originalName = trim($originalName);
        if ($storedNameOrPath === '' || $originalName === '' || ! function_exists('session')) {
            return;
        }

        session()->put(self::SESSION_KEY.'.'.$storedNameOrPath, $originalName);
    }

    public function pullByPath(?string $storedPath): ?string
    {
        $storedPath = trim((string) $storedPath);
        if ($storedPath === '' || ! function_exists('session')) {
            return null;
        }

        $fullPathKey = self::SESSION_KEY.'.'.$storedPath;
        $nameOnlyKey = self::SESSION_KEY.'.'.basename($storedPath);
        $original = session()->pull($fullPathKey);
        if (is_string($original) && $original !== '') {
            return $original;
        }

        $original = session()->pull($nameOnlyKey);

        return is_string($original) && $original !== '' ? $original : null;
    }
}

