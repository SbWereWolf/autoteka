import { onBeforeUnmount } from "vue";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import type { PhotoSwipeOptions, SlideData } from "photoswipe";
import type { GalleryImageItem, GalleryItem } from "../types";

type SlideSize = {
  width: number;
  height: number;
};

type UseGalleryLightboxParams = {
  /** Текущий список кадров карусели (фото + видео). */
  items: () => GalleryItem[];
  /** Уже отрисованный <img> этого кадра — источник natural-размеров. */
  resolveImageElement: (
    item: GalleryImageItem,
  ) => HTMLImageElement | null;
};

/*
 * Тип кадра для библиотеки. Всё, что не "image", она считает произвольным
 * содержимым: не ищет размеры, не рисует плейсхолдер и не даёт зумить
 * (Content.isZoomable() возвращает isImageContent()).
 */
const VIDEO_SLIDE_TYPE = "video";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Размеры уже загруженного элемента; null — картинка ещё не догрузилась. */
function naturalSizeOf(
  element: HTMLImageElement | null,
): SlideSize | null {
  if (!element) {
    return null;
  }

  if (element.naturalWidth > 0 && element.naturalHeight > 0) {
    return {
      width: element.naturalWidth,
      height: element.naturalHeight,
    };
  }

  return null;
}

/** Догрузить картинку ради размеров. null — файл не открылся. */
function loadSize(src: string): Promise<SlideSize | null> {
  return new Promise<SlideSize | null>((resolve) => {
    if (typeof Image === "undefined") {
      resolve(null);
      return;
    }

    const probe = new Image();

    probe.onload = () => {
      resolve(naturalSizeOf(probe));
    };
    probe.onerror = () => {
      resolve(null);
    };

    probe.src = src;
  });
}

function pauseVideoIn(element: Element | undefined): void {
  const video = element?.querySelector("video");
  if (video instanceof HTMLVideoElement) {
    video.pause();
  }
}

export function useGalleryLightbox(params: UseGalleryLightboxParams) {
  let lightbox: PhotoSwipeLightbox | null = null;

  function destroyLightbox() {
    lightbox?.destroy();
    lightbox = null;
  }

  async function buildSlide(item: GalleryItem): Promise<SlideData> {
    if (item.type === "video") {
      /*
       * Размеров у видео нет — бэкенд их не отдаёт, и брать их неоткуда.
       * Библиотека это переживает: при нулевых width/height она берёт
       * zoom-уровень 1 и растягивает кадр на весь вьюпорт
       * (slide.js updateContentSize: `… || this.pswp.viewportSize.x`).
       * Само видео вписывается в кадр через object-fit в lightbox.css.
       */
      return { type: VIDEO_SLIDE_TYPE };
    }

    const size =
      naturalSizeOf(params.resolveImageElement(item)) ??
      (await loadSize(item.src));

    if (!size) {
      // Размеры неизвестны — отдаём кадр без них, а не с выдуманными.
      return { src: item.src };
    }

    return {
      src: item.src,
      width: size.width,
      height: size.height,
    };
  }

  /** Открыть лайтбокс на кадре карусели frameIndex (индекс сквозной). */
  async function openAt(frameIndex: number): Promise<void> {
    const items = params.items();
    if (!items[frameIndex]) {
      return;
    }

    const slides = await Promise.all(items.map(buildSlide));

    const reducedMotion = prefersReducedMotion();
    const options: PhotoSwipeOptions = {
      dataSource: slides,
      pswpModule: () => import("photoswipe"),
      showHideAnimationType: reducedMotion ? "none" : "zoom",
      showAnimationDuration: reducedMotion ? 0 : undefined,
      hideAnimationDuration: reducedMotion ? 0 : undefined,
      zoomAnimationDuration: reducedMotion ? 0 : undefined,
    };

    // Пересоздаём на каждое открытие: dataSource и prefers-reduced-motion
    // могли измениться с прошлого раза.
    destroyLightbox();
    const instance = new PhotoSwipeLightbox(options);
    const videos = new Set<HTMLVideoElement>();

    /*
     * Своё содержимое кадра: гасим штатную сборку элемента и подставляем
     * собственный узел. Обёртка — div.pswp__content, как делает сама
     * библиотека для html-кадров: он пропускает клики сквозь себя, а
     * дочернее видео их получает (photoswipe.css: .pswp__content
     * pointer-events none, .pswp__content > * — auto), поэтому нативные
     * контролы работают. DOM строим узлами, а не innerHTML: ссылки
     * приходят с бэкенда.
     */
    instance.on("contentLoad", (event) => {
      const item = items[event.content.index];
      if (!item || item.type !== "video") {
        return;
      }

      event.preventDefault();

      const holder = document.createElement("div");
      holder.className = "pswp__content shop-lightbox-video";

      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.poster = item.poster;

      const source = document.createElement("source");
      source.src = item.src;
      source.type = item.mime;

      video.append(source);
      holder.append(video);
      videos.add(video);

      event.content.element = holder;
    });

    // Ушли с кадра — видео на паузу.
    instance.on("contentDeactivate", (event) => {
      pauseVideoIn(event.content.element);
    });

    // Закрыли лайтбокс — останавливаем всё, что успело заиграть.
    instance.on("close", () => {
      videos.forEach((video) => {
        video.pause();
      });
    });

    instance.on("destroy", () => {
      videos.clear();
    });

    lightbox = instance;
    instance.init();
    instance.loadAndOpen(frameIndex);
  }

  onBeforeUnmount(destroyLightbox);

  return { openAt };
}
