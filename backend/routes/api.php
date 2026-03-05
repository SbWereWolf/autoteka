<?php

declare(strict_types=1);

use App\Http\Controllers\Api\CategoryListController;
use App\Http\Controllers\Api\CityCatalogController;
use App\Http\Controllers\Api\CityListController;
use App\Http\Controllers\Api\FeatureListController;
use App\Http\Controllers\Api\ShopAcceptableContactTypesController;
use App\Http\Controllers\Api\ShopShowController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/city-list', CityListController::class);
    Route::get('/category-list', CategoryListController::class);
    Route::get('/feature-list', FeatureListController::class);
    Route::get('/city/{code}', CityCatalogController::class);
    Route::get('/shop/{code}', ShopShowController::class);
    Route::post('/shop/{code}/acceptable-contact-types', ShopAcceptableContactTypesController::class);
});
