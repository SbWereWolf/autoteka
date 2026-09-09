import { ref } from "vue";
import type { Ref } from "vue";

// Два канала с общим приёмом «сброс + перезапись»: aria-live озвучивает
// только изменение значения, поэтому один и тот же текст подряд нужно
// сначала обнулить, иначе второе «Ссылка скопирована» не прозвучит.
//
// message  — служебные объявления, читает только sr-only-блок App.vue.
// notice   — видимые сообщения, на них подписана плашка AppToast.
const message = ref("");
const notice = ref("");

function emit(target: Ref<string>, text: string): void {
  target.value = "";
  if (
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
  ) {
    window.requestAnimationFrame(() => {
      target.value = text;
    });
    return;
  }

  target.value = text;
}

// Только для программ чтения экрана: сопровождает то, что и так видно
// на экране (смена кадра, состояние каталога, снятие фильтра).
function announce(text: string): void {
  emit(message, text);
}

// Результат, которого на экране не видно (буфер обмена, отказ шаринга):
// показываем плашкой и одновременно озвучиваем — иначе незрячий
// пользователь потеряет то, что зрячий прочитает в плашке.
function notify(text: string): void {
  emit(message, text);
  emit(notice, text);
}

export function useAnnouncer() {
  return { message, notice, announce, notify };
}
