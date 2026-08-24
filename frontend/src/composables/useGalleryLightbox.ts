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

export function useGalleryLightbox(params: UseGalleryLightboxParams) {
  let lightbox: PhotoSwipeLightbox | null = null;

  function destroyLightbox() {
    lightbox?.destroy();
    lightbox = null;
  }

  async function buildSlide(
    image: GalleryImageItem,
  ): Promise<SlideData> {
    const size =
      naturalSizeOf(params.resolveImageElement(image)) ??
      (await loadSize(image.src));

    if (!size) {
      // Размеры неизвестны — отдаём кадр без них, а не с выдуманными.
      return { src: image.src };
    }

    return {
      src: image.src,
      width: size.width,
      height: size.height,
    };
  }

  /**
   * Открыть лайтбокс на кадре карусели frameIndex.
   * На видеокадре не открывается вовсе.
   */
  async function openAt(frameIndex: number): Promise<void> {
    const items = params.items();
    const frame = items[frameIndex];
    if (!frame || frame.type !== "image") {
      return;
    }

    const images = items.filter(
      (item): item is GalleryImageItem => item.type === "image",
    );
    // Индекс кадра карусели → индекс внутри списка одних фотографий.
    const photoIndex = images.findIndex(
      (image) => image.id === frame.id,
    );
    if (photoIndex < 0) {
      return;
    }

    const slides = await Promise.all(images.map(buildSlide));

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
    lightbox = new PhotoSwipeLightbox(options);
    lightbox.init();
    lightbox.loadAndOpen(photoIndex);
  }

  onBeforeUnmount(destroyLightbox);

  return { openAt };
}
