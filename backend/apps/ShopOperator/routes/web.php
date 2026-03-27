<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use ShopOperator\Http\Controllers\CreatePromotionDraftController;

Route::prefix('admin')
    ->middleware(config('moonshine.auth.middleware', []))
    ->name('shop-operator.')
    ->group(function (): void {
        Route::post(
            'shops/{shop}/promotions/create-draft',
            CreatePromotionDraftController::class,
        )->name('promotions.create-draft');
    });

Route::redirect('/', '/admin');
