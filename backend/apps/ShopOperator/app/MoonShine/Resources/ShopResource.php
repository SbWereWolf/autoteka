<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Resources;

use ShopOperator\Models\Category;
use ShopOperator\Models\City;
use ShopOperator\Models\ContactType;
use ShopOperator\Models\Feature;
use ShopOperator\Models\Shop;
use ShopOperator\MoonShine\Handlers\SaveShopResourceHandler;
use ShopOperator\Support\Media\UploadFileNameGenerator;
use ShopOperator\Support\Media\UploadOriginalNameStore;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use MoonShine\Crud\Attributes\SaveHandler;
use MoonShine\Laravel\Pages\Crud\FormPage;
use MoonShine\Laravel\Pages\Crud\IndexPage;
use MoonShine\Laravel\Resources\ModelResource;
use MoonShine\MenuManager\Attributes\Group;
use MoonShine\MenuManager\Attributes\Order;
use MoonShine\Support\Attributes\Icon;
use MoonShine\Support\Enums\Action;
use MoonShine\Support\ListOf;
use MoonShine\UI\Fields\Date;
use MoonShine\UI\Fields\Hidden;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Image;
use MoonShine\UI\Fields\Json;
use MoonShine\UI\Fields\Number;
use MoonShine\UI\Fields\Preview;
use MoonShine\UI\Fields\Select;
use MoonShine\UI\Fields\Switcher;
use MoonShine\UI\Fields\Textarea;
use MoonShine\UI\Fields\Text;

#[SaveHandler(SaveShopResourceHandler::class)]
#[Icon('building-storefront')]
#[Group('Данные', 'database')]
#[Order(50)]
class ShopResource extends ModelResource
{
    protected string $model = Shop::class;

    protected string $column = 'title';

    protected array $with = [
        'city',
        'categories',
        'features',
        'contacts.contactType',
        'galleryImages',
        'schedules',
        'scheduleNotes',
    ];

    protected function activeActions(): ListOf
    {
        return parent::activeActions()->except(Action::VIEW, Action::DELETE, Action::MASS_DELETE);
    }

    protected function pages(): array
    {
        return [
            IndexPage::class,
            FormPage::class,
        ];
    }

    public function getTitle(): string
    {
        return 'Магазины';
    }

    protected function search(): array
    {
        return ['id', 'title', 'description', 'site_url'];
    }

    protected function modifyItemQueryBuilder(Builder $builder): Builder
    {
        return $builder->with($this->with);
    }

    protected function indexFields(): iterable
    {
        return [
            ID::make()->sortable(),
            Text::make('Название', 'title')->sortable(),
            Text::make('Город', 'city.title'),
            Number::make('Sort', 'sort')->sortable(),
            Switcher::make('Опубликован', 'is_published'),
            Preview::make('Создан', formatted: fn ($item) => $item->created_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Обновлён', formatted: fn ($item) => $item->updated_at?->format('d.m.Y H:i') ?? ''),
        ];
    }

    protected function formFields(): iterable
    {
        return [
            ID::make(),
            Text::make('Название', 'title')
                ->required(),
            Number::make('Sort', 'sort')
                ->default(0)
                ->min(0)
                ->required(),
            Select::make('Город', 'city_id')
                ->options($this->cityOptions())
                ->searchable()
                ->required(),
            Switcher::make('Опубликован', 'is_published')
                ->default(true),
            Textarea::make('Описание', 'description'),
            Text::make('Ссылка на сайт', 'site_url')
                ->placeholder('https://example.com'),
            Image::make('Картинка плитки', 'thumb_path')
                ->disk((string) config('autoteka.media.disk'))
                ->dir((string) config('autoteka.media.shop_thumb_dir'))
                ->allowedExtensions(['jpg', 'jpeg', 'png', 'webp'])
                ->customName(static function (mixed $file): string {
                    if (! $file instanceof UploadedFile) {
                        return UploadFileNameGenerator::generateFromName((string) $file);
                    }

                    $stored = UploadFileNameGenerator::generateFromName($file->getClientOriginalName());
                    app(UploadOriginalNameStore::class)->register($stored, $file->getClientOriginalName());

                    return $stored;
                })
                ->removable(),
            Json::make('Категории', 'category_links')
                ->fields([
                    Select::make('Категория', 'category_id')
                        ->options($this->categoryOptions())
                        ->searchable()
                        ->required(),
                ])
                ->vertical()
                ->creatable(true)
                ->reorderable(false),
            Json::make('Фичи', 'feature_links')
                ->fields([
                    Select::make('Фича', 'feature_id')
                        ->options($this->featureOptions())
                        ->searchable()
                        ->required(),
                ])
                ->vertical()
                ->creatable(true)
                ->reorderable(false),
            Json::make('Контакты', 'contact_entries')
                ->fields([
                    Hidden::make(column: 'id'),
                    Select::make('Тип', 'contact_type_id')
                        ->options($this->contactTypeOptions())
                        ->searchable()
                        ->required(),
                    Text::make('Значение', 'value')
                        ->required(),
                    Number::make('Sort', 'sort')
                        ->default(0)
                        ->min(0),
                    Switcher::make('Опубликован', 'is_published')
                        ->default(true),
                ])
                ->vertical()
                ->creatable(true),
            Json::make('Галерея', 'gallery_entries')
                ->fields([
                    Hidden::make(column: 'id'),
                    Image::make('Файл', 'file_path')
                        ->disk((string) config('autoteka.media.disk'))
                        ->dir((string) config('autoteka.media.shop_gallery_dir'))
                        ->allowedExtensions(['jpg', 'jpeg', 'png', 'webp'])
                        ->customName(static function (mixed $file): string {
                            if (! $file instanceof UploadedFile) {
                                return UploadFileNameGenerator::generateFromName((string) $file);
                            }

                            $stored = UploadFileNameGenerator::generateFromName($file->getClientOriginalName());
                            app(UploadOriginalNameStore::class)->register($stored, $file->getClientOriginalName());

                            return $stored;
                        })
                        ->removable(),
                    Number::make('Sort', 'sort')
                        ->default(0)
                        ->min(0),
                    Switcher::make('Опубликован', 'is_published')
                        ->default(true),
                ])
                ->vertical()
                ->creatable(true),
            Json::make('Расписание по дням', 'schedule_entries')
                ->fields([
                    Hidden::make(column: 'id'),
                    Select::make('День недели', 'weekday')
                        ->options($this->weekdayOptions())
                        ->required(),
                    Text::make('Начало', 'time_from')
                        ->customAttributes(['type' => 'time', 'step' => 60])
                        ->required(),
                    Text::make('Конец', 'time_to')
                        ->customAttributes(['type' => 'time', 'step' => 60])
                        ->required(),
                    Number::make('Sort', 'sort')
                        ->default(0)
                        ->min(0),
                    Switcher::make('Опубликован', 'is_published')
                        ->default(true),
                ])
                ->vertical()
                ->creatable(true, 7),
            Textarea::make('Текст расписания', 'schedule_note_text'),
            Date::make('Создан', 'created_at')->format('d.m.Y H:i'),
            Date::make('Обновлён', 'updated_at')->format('d.m.Y H:i'),
        ];
    }

    private function cityOptions(): array
    {
        return City::query()
            ->orderBy('sort')
            ->orderBy('id')
            ->pluck('title', 'id')
            ->all();
    }

    private function categoryOptions(): array
    {
        return Category::query()
            ->orderBy('sort')
            ->orderBy('id')
            ->pluck('title', 'id')
            ->all();
    }

    private function featureOptions(): array
    {
        return Feature::query()
            ->orderBy('sort')
            ->orderBy('id')
            ->pluck('title', 'id')
            ->all();
    }

    private function contactTypeOptions(): array
    {
        return ContactType::query()
            ->orderBy('sort')
            ->orderBy('id')
            ->pluck('title', 'id')
            ->all();
    }

    private function weekdayOptions(): array
    {
        return [
            1 => 'Понедельник',
            2 => 'Вторник',
            3 => 'Среда',
            4 => 'Четверг',
            5 => 'Пятница',
            6 => 'Суббота',
            7 => 'Воскресенье',
        ];
    }
}
