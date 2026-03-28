<?php

declare(strict_types=1);

namespace ShopOperator\MoonShine\Resources;

use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotion;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotionGalleryVideo;
use Autoteka\SchemaDefinition\SchemaTables\SchemaPromotionImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Js;
use MoonShine\Crud\Attributes\SaveHandler;
use MoonShine\Laravel\Pages\Crud\FormPage;
use MoonShine\Laravel\Pages\Crud\IndexPage;
use MoonShine\Laravel\Resources\ModelResource;
use MoonShine\MenuManager\Attributes\Group;
use MoonShine\MenuManager\Attributes\Order;
use MoonShine\Support\Attributes\Icon;
use MoonShine\Support\Enums\Action;
use MoonShine\Support\Enums\PageType;
use MoonShine\Support\ListOf;
use MoonShine\UI\Fields\Date;
use MoonShine\UI\Fields\File;
use MoonShine\UI\Fields\Hidden;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Image;
use MoonShine\UI\Fields\Json;
use MoonShine\UI\Fields\Number;
use MoonShine\UI\Fields\Preview;
use MoonShine\UI\Fields\Switcher;
use MoonShine\UI\Fields\Textarea;
use MoonShine\UI\Fields\Text;
use ShopOperator\Models\Promotion;
use ShopOperator\Models\PromotionGalleryVideo;
use ShopOperator\Models\PromotionImage;
use ShopOperator\Models\Shop;
use ShopOperator\MoonShine\Handlers\SavePromotionResourceHandler;
use ShopOperator\MoonShine\Pages\OperatorDetailPage;
use ShopOperator\MoonShine\Pages\PromotionFormPage;
use ShopOperator\Support\Media\UploadFileNameGenerator;
use ShopOperator\Support\Media\UploadOriginalNameStore;

#[SaveHandler(SavePromotionResourceHandler::class)]
#[Icon('megaphone')]
#[Group('Данные', 'database')]
#[Order(60)]
class PromotionResource extends ModelResource
{
    protected string $model = Promotion::class;

    protected string $column = 'title';

    protected array $with = [
        'shop',
        'galleryImages',
        'galleryVideos',
    ];

    protected ?PageType $redirectAfterSave = PageType::DETAIL;

    protected function activeActions(): ListOf
    {
        return parent::activeActions()->except(
            Action::CREATE,
            Action::DELETE,
            Action::MASS_DELETE,
        );
    }

    public function hasAction(Action ...$actions): bool
    {
        foreach ($actions as $action) {
            if ($action === Action::CREATE) {
                if (! request()->routeIs('moonshine.crud.create', 'moonshine.crud.store')) {
                    return false;
                }

                continue;
            }

            if (! parent::hasAction($action)) {
                return false;
            }
        }

        return true;
    }

    protected function pages(): array
    {
        return [
            IndexPage::class,
            PromotionFormPage::class,
            FormPage::class,
            OperatorDetailPage::class,
        ];
    }

    public function getTitle(): string
    {
        return 'Рекламные акции';
    }

    public function hasValidCreateShopContext(): bool
    {
        return false;
    }

    protected function indexFields(): iterable
    {
        $schema = new SchemaPromotion();

        return [
            ID::make()->sortable(),
            Preview::make('Код', formatted: fn (Promotion $promotion): string => (string) $promotion->code),
            Text::make('Название', $schema->title())->sortable(),
            Preview::make('Магазин', formatted: fn (Promotion $promotion): string => $this->shopReferenceHtml($promotion)),
            Date::make('Дата начала', $schema->startDate())->sortable(),
            Date::make('Дата окончания', $schema->endDate())->sortable(),
            Switcher::make('Опубликована', $schema->isPublished()),
            Preview::make('Создана', formatted: fn (Promotion $promotion): string => $promotion->created_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Обновлена', formatted: fn (Promotion $promotion): string => $promotion->updated_at?->format('d.m.Y H:i') ?? ''),
        ];
    }

    protected function detailFields(): iterable
    {
        return [
            ID::make(),
            Preview::make('Код', formatted: fn (Promotion $promotion): string => (string) $promotion->code),
            Preview::make('Название', formatted: fn (Promotion $promotion): string => (string) $promotion->title),
            Preview::make('Описание', formatted: fn (Promotion $promotion): string => (string) $promotion->description),
            Preview::make('Магазин', formatted: fn (Promotion $promotion): string => $this->shopReferenceHtml($promotion)),
            Preview::make('Дата начала', formatted: fn (Promotion $promotion): string => $this->formatDate($promotion->start_date)),
            Preview::make('Дата окончания', formatted: fn (Promotion $promotion): string => $this->formatDate($promotion->end_date)),
            Preview::make('Опубликована', formatted: fn (Promotion $promotion): string => $promotion->is_published ? 'Да' : 'Нет'),
            Preview::make('Создана', formatted: fn (Promotion $promotion): string => $promotion->created_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Обновлена', formatted: fn (Promotion $promotion): string => $promotion->updated_at?->format('d.m.Y H:i') ?? ''),
            Preview::make('Галерея', formatted: fn (Promotion $promotion): string => $this->galleryDetailHtml($promotion)),
            Preview::make('Видео галереи', formatted: fn (Promotion $promotion): string => $this->galleryVideoDetailHtml($promotion)),
        ];
    }

    protected function formFields(): iterable
    {
        $schema = new SchemaPromotion();
        $imageSchema = new SchemaPromotionImage();
        $videoSchema = new SchemaPromotionGalleryVideo();
        $shop = $this->formContextShop();

        return [
            ID::make(),
            Preview::make('Код', formatted: fn (Promotion $promotion): string => $this->codePreview($promotion, $shop)),
            Preview::make('Магазин', formatted: fn (): string => $this->shopReferenceHtml(shop: $shop)),
            Text::make('Название', $schema->title())
                ->required(),
            Textarea::make('Описание', $schema->description())
                ->required(),
            Date::make('Дата начала', $schema->startDate())
                ->required(),
            Date::make('Дата окончания', $schema->endDate())
                ->required(),
            Switcher::make('Опубликована', $schema->isPublished())
                ->default(false),
            Json::make('Галерея', 'gallery_entries')
                ->fields([
                    Hidden::make(column: $imageSchema->id()),
                    Hidden::make(column: $imageSchema->filePath()),
                    Hidden::make(column: $imageSchema->originalName()),
                    Image::make('Файл', $imageSchema->filePath())
                        ->disk((string) config('autoteka.media.disk'))
                        ->dir((string) config('autoteka.media.promotion_gallery_dir'))
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
                    Number::make('Sort', $imageSchema->sort())
                        ->default(0)
                        ->min(0)
                        ->required(),
                    Switcher::make('Опубликован', $imageSchema->isPublished())
                        ->default(true),
                ])
                ->vertical()
                ->creatable(true)
                ->removable(),
            Json::make('Видео галереи', 'gallery_video_entries')
                ->fields([
                    Hidden::make(column: $videoSchema->id()),
                    Hidden::make(column: $videoSchema->originalName()),
                    Hidden::make(column: $videoSchema->posterOriginalName()),
                    Hidden::make(column: $videoSchema->mime()),
                    File::make('Видеофайл', $videoSchema->filePath())
                        ->disk((string) config('autoteka.media.disk'))
                        ->dir((string) config('autoteka.media.promotion_gallery_video_dir'))
                        ->allowedExtensions(['mp4', 'webm'])
                        ->customName(static function (mixed $file): string {
                            if (! $file instanceof UploadedFile) {
                                return UploadFileNameGenerator::generateFromName((string) $file);
                            }

                            $stored = UploadFileNameGenerator::generateFromName($file->getClientOriginalName());
                            app(UploadOriginalNameStore::class)->register($stored, $file->getClientOriginalName());

                            return $stored;
                        })
                        ->removable(),
                    Image::make('Poster', $videoSchema->posterPath())
                        ->disk((string) config('autoteka.media.disk'))
                        ->dir((string) config('autoteka.media.promotion_gallery_video_poster_dir'))
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
                    Number::make('Sort', $videoSchema->sort())
                        ->default(0)
                        ->min(0)
                        ->required(),
                    Switcher::make('Опубликован', $videoSchema->isPublished())
                        ->default(true),
                ])
                ->vertical()
                ->creatable(true)
                ->removable(),
        ];
    }

    private function formContextShop(): ?Shop
    {
        $itemId = (int) request()->route('resourceItem', 0);

        if ($itemId > 0) {
            return Promotion::query()
                ->with('shop')
                ->find($itemId)
                ?->shop;
        }

        return null;
    }

    private function formatDate(mixed $value): string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        return trim((string) $value);
    }

    private function codePreview(Promotion $promotion, ?Shop $shop): string
    {
        if ($promotion->code !== '') {
            return (string) $promotion->code;
        }

        if (! $shop instanceof Shop) {
            return 'Будет сгенерирован автоматически';
        }

        return $shop->code . '-slug-title';
    }

    private function shopReferenceHtml(?Promotion $promotion = null, ?Shop $shop = null): string
    {
        $resolvedShop = $shop ?? $promotion?->shop;

        if (! $resolvedShop instanceof Shop) {
            return '—';
        }

        $shopLabel = htmlspecialchars(
            $this->shopDisplayName($resolvedShop),
            ENT_QUOTES | ENT_HTML5,
            'UTF-8',
        );
        $href = route('moonshine.crud.show', [
            'resourceUri' => 'shop-resource',
            'resourceItem' => $resolvedShop->getKey(),
        ]);
        $hrefAttr = htmlspecialchars($href, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return '<div class="flex flex-wrap items-center gap-2">'
            . '<a class="btn btn-primary btn-sm" href="' . $hrefAttr . '">Перейти в магазин</a>'
            . '<span>' . $shopLabel . '</span>'
            . '</div>';
    }

    private function shopDisplayName(Shop $shop): string
    {
        $city = trim((string) ($shop->city?->title ?? ''));
        $title = trim((string) $shop->title);

        if ($city === '') {
            return $title !== '' ? $title : '—';
        }

        return $city . ': ' . ($title !== '' ? $title : '—');
    }

    private function galleryDetailHtml(Promotion $promotion): string
    {
        if ($promotion->galleryImages->isEmpty()) {
            return '—';
        }

        $disk = Storage::disk((string) config('autoteka.media.disk'));
        $schema = new SchemaPromotionImage();
        $parts = [];

        foreach (
            $promotion->galleryImages
                ->sortBy([
                    [$schema->sort(), 'asc'],
                    [$schema->id(), 'asc'],
                ])
                ->values() as $image
        ) {
            $path = trim((string) $image->file_path);
            if ($path === '') {
                continue;
            }

            $url = $disk->url($path);
            $alt = basename($path).($image->is_published ? '' : ' (скрыто)');
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

    private function galleryVideoDetailHtml(Promotion $promotion): string
    {
        if ($promotion->galleryVideos->isEmpty()) {
            return '—';
        }

        $disk = Storage::disk((string) config('autoteka.media.disk'));
        $schema = new SchemaPromotionGalleryVideo();
        $parts = [];

        foreach (
            $promotion->galleryVideos
                ->sortBy([
                    [$schema->sort(), 'asc'],
                    [$schema->id(), 'asc'],
                ])
                ->values() as $video
        ) {
            $posterPath = trim((string) $video->poster_path);
            if ($posterPath === '') {
                continue;
            }

            $url = $disk->url($posterPath);
            $alt = basename((string) $video->file_path).($video->is_published ? '' : ' (скрыто)');
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
}
