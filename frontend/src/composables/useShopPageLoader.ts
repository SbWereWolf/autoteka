import {
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from "vue";
import { apiClient } from "../api/HttpApiClient";
import { ApiError } from "../api/ApiClient";
import { uiConfig } from "../config/ui";
import type { ContactsResponse, PromotionPublic, Shop } from "../types";
import { SHOP_ACCEPTABLE_CONTACT_TYPES } from "./useShopContactRows";

type ShopPageLoaderSources = {
  shopCode: MaybeRefOrGetter<string>;
};

class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === "AbortError"
  ) || (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

function isTransientError(error: unknown): boolean {
  if (error instanceof TimeoutError) {
    return true;
  }

  if (error instanceof ApiError) {
    return error.status >= 500;
  }

  return error instanceof TypeError;
}

function createAbortError(): DOMException {
  return new DOMException("Aborted", "AbortError");
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(createAbortError());
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function withAttemptTimeout<T>(
  executor: (signal: AbortSignal) => Promise<T>,
  parentSignal: AbortSignal,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;

  const abortFromParent = () => {
    controller.abort(parentSignal.reason);
  };

  if (parentSignal.aborted) {
    controller.abort(parentSignal.reason);
  } else {
    parentSignal.addEventListener("abort", abortFromParent, {
      once: true,
    });
  }

  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort(new TimeoutError(timeoutMs));
  }, timeoutMs);

  try {
    return await executor(controller.signal);
  } catch (error) {
    if (timedOut) {
      throw new TimeoutError(timeoutMs);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    parentSignal.removeEventListener("abort", abortFromParent);
  }
}

async function withRetry<T>(
  executor: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await withAttemptTimeout(
        executor,
        signal,
        uiConfig.shopPageLoader.requestTimeoutMs,
      );
    } catch (error) {
      if (signal.aborted || isAbortError(error)) {
        throw error;
      }

      if (
        !isTransientError(error) ||
        attempt >= uiConfig.shopPageLoader.retryCount
      ) {
        throw error;
      }

      attempt += 1;
      await delay(uiConfig.shopPageLoader.retryDelayMs, signal);
    }
  }
}

export function useShopPageLoader(
  sources: ShopPageLoaderSources,
) {
  const shop = ref<Shop | null>(null);
  const promotions = ref<PromotionPublic[]>([]);
  const contacts = ref<ContactsResponse>({});
  const isLoading = ref(true);
  const loadError = ref(false);
  const notFound = ref(false);
  const contactsLoadError = ref(false);
  const promoSettled = ref(false);

  let activeController: AbortController | null = null;
  let loadToken = 0;

  function resetState() {
    shop.value = null;
    promotions.value = [];
    contacts.value = {};
    isLoading.value = true;
    loadError.value = false;
    notFound.value = false;
    contactsLoadError.value = false;
    promoSettled.value = false;
  }

  async function loadContacts(
    code: string,
    signal: AbortSignal,
    token: number,
  ) {
    contacts.value = {};
    contactsLoadError.value = false;

    try {
      const response = await withRetry(
        (requestSignal) =>
          apiClient.postAcceptableContactTypes(
            code,
            [...SHOP_ACCEPTABLE_CONTACT_TYPES],
            { signal: requestSignal },
          ),
        signal,
      );

      if (token !== loadToken || signal.aborted) {
        return;
      }

      contacts.value = response;
    } catch (error) {
      if (token !== loadToken || signal.aborted || isAbortError(error)) {
        return;
      }

      contacts.value = {};
      contactsLoadError.value = true;
    }
  }

  async function loadShopPage() {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    loadToken += 1;
    const token = loadToken;
    const shopCode = toValue(sources.shopCode).trim();
    let shopResolved = false;
    let halfTimeoutReached = false;

    resetState();

    if (shopCode === "") {
      loadError.value = true;
      isLoading.value = false;
      return;
    }

    const maybeFinishInitialLoading = () => {
      if (token !== loadToken || controller.signal.aborted) {
        return;
      }

      if (shopResolved && (promoSettled.value || halfTimeoutReached)) {
        isLoading.value = false;
      }
    };

    const halfTimeoutId = window.setTimeout(() => {
      halfTimeoutReached = true;
      maybeFinishInitialLoading();
    }, uiConfig.shopPageLoader.halfTimeoutMs);

    const promoRequest = withRetry(
      (requestSignal) =>
        apiClient.getShopPromotions(shopCode, {
          signal: requestSignal,
        }),
      controller.signal,
    )
      .then((response) => {
        if (token !== loadToken || controller.signal.aborted) {
          return;
        }

        promotions.value = response;
        promoSettled.value = true;
        isLoading.value = false;
      })
      .catch((error) => {
        if (
          token !== loadToken ||
          controller.signal.aborted ||
          isAbortError(error)
        ) {
          return;
        }

        promoSettled.value = true;
        console.error("Promotion request failed", error);
        maybeFinishInitialLoading();
      });

    const shopRequest = withRetry(
      (requestSignal) =>
        apiClient.getShop(shopCode, {
          signal: requestSignal,
        }),
      controller.signal,
    )
      .then((response) => {
        if (token !== loadToken || controller.signal.aborted) {
          return;
        }

        shop.value = response;
        shopResolved = true;
        maybeFinishInitialLoading();
        void loadContacts(shopCode, controller.signal, token);
      })
      .catch((error) => {
        if (
          token !== loadToken ||
          controller.signal.aborted ||
          isAbortError(error)
        ) {
          return;
        }

        shopResolved = true;

        if (error instanceof ApiError && error.status === 404) {
          notFound.value = true;
          isLoading.value = false;
          return;
        }

        if (promoSettled.value) {
          isLoading.value = false;
          return;
        }

        loadError.value = true;
        isLoading.value = false;
      });

    await Promise.allSettled([promoRequest, shopRequest]);
    window.clearTimeout(halfTimeoutId);

    if (activeController === controller) {
      activeController = null;
    }
  }

  watch(
    () => toValue(sources.shopCode),
    () => {
      void loadShopPage();
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    activeController?.abort();
  });

  return {
    shop,
    promotions,
    contacts,
    isLoading,
    loadError,
    notFound,
    contactsLoadError,
    promoSettled,
    loadShopPage,
  };
}
