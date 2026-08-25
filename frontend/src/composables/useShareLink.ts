import { useAnnouncer } from "./useAnnouncer";

type SharePayload = {
  title: string;
  url: string;
};

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

function copyWithExecCommand(url: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = url;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-100vh";
  textarea.style.left = "-100vw";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, url.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}

export function useShareLink() {
  const { announce } = useAnnouncer();

  async function share(payload: SharePayload): Promise<void> {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: payload.title,
          url: payload.url,
        });
      } catch (error) {
        // Пользователь закрыл системный лист — это не ошибка, молчим.
        if (isAbortError(error)) {
          return;
        }
        announce("Не удалось поделиться ссылкой");
      }
      return;
    }

    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(payload.url);
        announce("Ссылка скопирована");
      } catch {
        announce("Не удалось поделиться ссылкой");
      }
      return;
    }

    if (copyWithExecCommand(payload.url)) {
      announce("Ссылка скопирована");
      return;
    }

    announce("Не удалось поделиться ссылкой");
  }

  return { share };
}
