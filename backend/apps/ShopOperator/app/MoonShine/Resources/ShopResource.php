<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Resources;

use ShopOperator\Models\Category;
use ShopOperator\Models\City;
use ShopOperator\Models\ContactType;
use ShopOperator\Models\Feature;
use ShopOperator\Models\Shop;
use ShopOperator\Models\ShopContact;
use ShopOperator\Models\ShopGalleryImage;
use ShopOperator\Models\ShopSchedule;
use ShopOperator\MoonShine\Handlers\SaveShopResourceHandler;
use ShopOperator\Support\MoonShine\SortDefault;
use ShopOperator\Support\Media\UploadFileNameGenerator;
use ShopOperator\Support\Media\UploadOriginalNameStore;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Js;
use MoonShine\Crud\Attributes\SaveHandler;
use MoonShine\Laravel\Pages\Crud\DetailPage;
use MoonShine\Laravel\Pages\Crud\FormPage;
use MoonShine\Laravel\Pages\Crud\IndexPage;
use MoonShine\Laravel\Resources\ModelResource;
use MoonShine\MenuManager\Attributes\Group;
use MoonShine\MenuManager\Attributes\Order;
use MoonShine\Support\Attributes\Icon;
use MoonShine\Support\Enums\Action;
use MoonShine\Support\Enums\PageType;
use MoonShine\Support\ListOf;
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
    ];

    protected ?PageType $redirectAfterSave = PageType::DETAIL;

    protected function activeActions(): ListOf
    {
        return parent::activeActions()->except(Action::DELETE, Action::MASS_DELETE);
    }

    protected function pages(): array
    {
        return [
            IndexPage::class,
            FormPage::class,
            DetailPage::class,
        ];
    }

    public function getTitle(): string
    {
        return 'Магазины';
    }

    protected function search(): array
    {
        return ['id', 'code', 'title', 'description', 'site_url'];
    }

    protected function detailFields(): iterable
    {
        return [
            ID::make(),
            Preview::make('Код', formatted: fn (Shop $shop): string => (string) ($shop->code ?? '')),
            Preview::make('Название', formatted: fn (Shop $shop): string => (string) ($shop->title ?? '')),
            Preview::make('Sort', formatted: fn (Shop $shop): string => (string) (int) ($shop->sort ?? 0)),
            Preview::make('Город', formatted: fn (Shop $shop): string => $shop->city?->title ?? '—'),
            Preview::make('Опубликован', formatted: fn (Shop $shop): string => $shop->is_published ? 'Да' : 'Нет'),
            Preview::make('Описание', formatted: fn (Shop $shop): string => trim((string) ($shop->description ?? '')) !== '' ? (string) $shop->description : '—'),
            Preview::make('Ссылка на сайт', formatted: fn (Shop $shop): string => trim((string) ($shop->site_url ?? '')) !== '' ? (string) $shop->site_url : '—'),
            Preview::make('Слоган', formatted: fn (Shop $shop): string => trim((string) ($shop->slogan ?? '')) !== '' ? (string) $shop->slogan : '—'),
            Preview::make('Широта', formatted: fn (Shop $shop): string => $shop->latitude !== null ? (string) $shop->latitude : '—'),
            Preview::make('Долгота', formatted: fn (Shop $shop): string => $shop->longitude !== null ? (string) $shop->longitude : '—'),
            Preview::make('Текст расписания', formatted: fn (Shop $shop): string => trim((string) ($shop->schedule_note ?? '')) !== '' ? (string) $shop->schedule_note : '—'),
            Image::make('Логотип', 'thumb_path')
                ->disk((string) config('autoteka.media.disk'))
                ->dir((string) config('autoteka.media.shop_thumb_dir')),
            Preview::make('Создан', formatted: fn (Shop $shop): string => $shop->created_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Обновлён', formatted: fn (Shop $shop): string => $shop->updated_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Категории', formatted: function (Shop $shop): string {
                if ($shop->categories->isEmpty()) {
                    return '—';
                }

                return $shop->categories
                    ->map(function (Category $c): string {
                        $pub = (bool) ($c->pivot->is_published ?? true);

                        return $c->title.($pub ? '' : ' (не опубликовано)');
                    })
                    ->join('; ');
            }),
            Preview::make('Фичи', formatted: function (Shop $shop): string {
                if ($shop->features->isEmpty()) {
                    return '—';
                }

                return $shop->features
                    ->map(function (Feature $f): string {
                        $pub = (bool) ($f->pivot->is_published ?? true);

                        return $f->title.($pub ? '' : ' (не опубликовано)');
                    })
                    ->join('; ');
            }),
            Preview::make('Контакты', formatted: function (Shop $shop): string {
                if ($shop->contacts->isEmpty()) {
                    return '—';
                }

                return $shop->contacts
                    ->sortBy('sort')
                    ->values()
                    ->map(function ($c): string {
                        $type = $c->contactType?->title ?? '?';
                        $pub = $c->is_published ? '' : ' (скрыт)';

                        return "{$type}: {$c->value}{$pub}";
                    })
                    ->join('; ');
            }),
            Preview::make('Галерея', formatted: fn (Shop $shop): string => $this->galleryDetailHtml($shop)),
            Preview::make('Расписание по дням', formatted: function (Shop $shop): string {
                if ($shop->schedules->isEmpty()) {
                    return '—';
                }

                $days = $this->weekdayOptions();

                return $shop->schedules
                    ->sortBy('sort')
                    ->values()
                    ->map(function (ShopSchedule $s) use ($days): string {
                        $day = $days[$s->weekday] ?? (string) $s->weekday;
                        $pub = $s->is_published ? '' : ' (скрыто)';

                        return "{$day}: {$s->time_from}–{$s->time_to}{$pub}";
                    })
                    ->join('; ');
            }),
        ];
    }

    protected function modifyItemQueryBuilder(Builder $builder): Builder
    {
        return $builder->with($this->with);
    }

    protected function indexFields(): iterable
    {
        return [
            ID::make()->sortable(),
            Preview::make('Код', formatted: fn ($item) => (string) ($item->code ?? '')),
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
            Preview::make('Код', formatted: fn ($item) => (string) ($item->code ?? '')),
            Text::make('Название', 'title')
                ->required()
                ->placeholder('Например: АвтоТека на Гоголя'),
            Number::make('Sort', 'sort')
                ->default(SortDefault::nextShopSort(SortDefault::cityIdFromRequest()))
                ->min(0)
                ->required(),
            Select::make('Город', 'city_id')
                ->options($this->cityOptions())
                ->searchable()
                ->placeholder('Выберите город')
                ->required(),
            Switcher::make('Опубликован', 'is_published')
                ->default(true),
            Textarea::make('Описание', 'description')
                ->placeholder('Кратко опишите магазин, чем полезен клиенту'),
            Text::make('Ссылка на сайт', 'site_url')
                ->placeholder('https://example.com'),
            Text::make('Слоган', 'slogan')
                ->placeholder('Например: Всё для вашего авто'),
            Number::make('Широта', 'latitude')
                ->step(0.000001)
                ->placeholder('55.0287'),
            Number::make('Долгота', 'longitude')
                ->step(0.000001)
                ->placeholder('82.9235'),
            Textarea::make('Текст расписания', 'schedule_note')
                ->placeholder('Например: Воскресенье — выходной'),
            Image::make('Логотип', 'thumb_path')
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
                        ->placeholder('Выберите категорию')
                        ->required(),
                    Switcher::make('Опубликован', 'is_published')
                        ->default(true),
                ])
                ->vertical()
                ->creatable(true)
                ->reorderable(false)
                ->removable(),
            Json::make('Фичи', 'feature_links')
                ->fields([
                    Select::make('Фича', 'feature_id')
                        ->options($this->featureOptions())
                        ->searchable()
                        ->placeholder('Выберите фичу')
                        ->required(),
                    Switcher::make('Опубликован', 'is_published')
                        ->default(true),
                ])
                ->vertical()
                ->creatable(true)
                ->reorderable(false)
                ->removable(),
            Json::make('Контакты', 'contact_entries')
                ->fields([
                    Hidden::make(column: 'id'),
                    Select::make('Тип', 'contact_type_id')
                        ->options($this->contactTypeOptions())
                        ->searchable()
                        ->placeholder('Тип контакта')
                        ->required(),
                    Text::make('Значение', 'value')
                        ->required()
                        ->placeholder('+7 900 000-00-00'),
                    Number::make('Sort', 'sort')
                        ->default($this->nestedSortDefault(ShopContact::class))
                        ->min(0)
                        ->required(),
                    Switcher::make('Опубликован', 'is_published')
                        ->default(true),
                ])
                ->vertical()
                ->creatable(true)
                ->removable(),
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
                        ->default($this->nestedSortDefault(ShopGalleryImage::class))
                        ->min(0)
                        ->required(),
                    Switcher::make('Опубликован', 'is_published')
                        ->default(true),
                ])
                ->vertical()
                ->creatable(true)
                ->removable(),
            Json::make('Расписание по дням', 'schedule_entries')
                ->fields([
                    Hidden::make(column: 'id'),
                    Select::make('День недели', 'weekday')
                        ->options($this->weekdayOptions())
                        ->placeholder('День')
                        ->required(),
                    Text::make('Начало', 'time_from')
                        ->customAttributes([
                            'type' => 'time',
                            'step' => 900,
                            'lang' => 'ru',
                        ], override: true)
                        ->required(),
                    Text::make('Конец', 'time_to')
                        ->customAttributes([
                            'type' => 'time',
                            'step' => 900,
                            'lang' => 'ru',
                        ], override: true)
                        ->required(),
                    Number::make('Sort', 'sort')
                        ->default($this->nestedSortDefault(ShopSchedule::class))
                        ->min(0)
                        ->required(),
                    Switcher::make('Опубликован', 'is_published')
                        ->default(true),
                ])
                ->vertical()
                ->creatable(true, 7)
                ->removable(),
            Preview::make('Создан', formatted: fn ($item) => $item->created_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Обновлён', formatted: fn ($item) => $item->updated_at?->format('d.m.Y H:i') ?? ''),
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

    /**
     * Миниатюры в один ряд (с переносом), как у логотипа: без «стопки» images-row MoonShine.
     */
    private function galleryDetailHtml(Shop $shop): string
    {
        if ($shop->galleryImages->isEmpty()) {
            return '—';
        }

        $disk = Storage::disk((string) config('autoteka.media.disk'));

        $parts = [];
        foreach ($shop->galleryImages->sortBy('sort')->values() as $img) {
            $path = trim((string) $img->file_path);
            if ($path === '') {
                continue;
            }

            $url = $disk->url($path);
            $alt = basename($path).($img->is_published ? '' : ' (скрыто)');
            $srcAttr = htmlspecialchars($url, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $altAttr = htmlspecialchars($alt, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $srcJs = (string) Js::from($url);

            $parts[] =
                '<div class="zoom-in h-10 w-10 shrink-0 overflow-hidden rounded-md bg-white dark:bg-base-700 cursor-pointer">'
                .'<img class="h-full w-full object-cover" src="'.$srcAttr.'" alt="'.$altAttr.'" '
                .'@click.stop="$dispatch(\'img-popup\', { open: true, src: '.$srcJs.', wide: false, auto: false, styles: \'\' })"'
                .'></div>';
        }

        if ($parts === []) {
            return '—';
        }

        return '<div class="flex flex-wrap gap-2 items-start">'.implode('', $parts).'</div>';
    }

    /**
     * @param  class-string<ShopContact|ShopGalleryImage|ShopSchedule>  $modelClass
     */
    private function nestedSortDefault(string $modelClass): int
    {
        $shopId = $this->editingShopId();

        return $shopId !== null
            ? SortDefault::forShopOwned($modelClass, $shopId)
            : 10;
    }

    private function editingShopId(): ?int
    {
        $raw = request()->route('resourceItem');
        if ($raw === null || $raw === '') {
            return null;
        }

        $id = (int) $raw;

        return $id > 0 ? $id : null;
    }
}
