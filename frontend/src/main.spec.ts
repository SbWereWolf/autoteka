import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const mount = vi.fn();
  const use = vi.fn();
  const createApp = vi.fn();
  const bootstrapAppState = vi.fn();
  const router = {};

  return {
    bootstrapAppState,
    createApp,
    mount,
    router,
    use,
  };
});

vi.mock("@fontsource-variable/manrope/index.css", () => ({}));
vi.mock("vue", () => ({
  createApp: mocks.createApp,
}));
vi.mock("./App.vue", () => ({ default: {} }));
vi.mock("./router", () => ({ default: mocks.router }));
vi.mock("./bootstrap", () => ({
  bootstrapAppState: mocks.bootstrapAppState,
}));

describe("application entry point", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.bootstrapAppState.mockReset();
    mocks.createApp.mockReset();
    mocks.use.mockReset();
    mocks.mount.mockReset();
    mocks.use.mockReturnValue({ mount: mocks.mount });
    mocks.createApp.mockReturnValue({ use: mocks.use });
  });

  it("монтирует приложение после успешного bootstrap", async () => {
    mocks.bootstrapAppState.mockResolvedValue(undefined);

    await import("./main");
    await vi.dynamicImportSettled();

    expect(mocks.bootstrapAppState).toHaveBeenCalledOnce();
    expect(mocks.mount).toHaveBeenCalledOnce();
    expect(mocks.mount).toHaveBeenCalledWith("#app");
  });

  it("поглощает ошибку bootstrap и всё равно монтирует приложение", async () => {
    mocks.bootstrapAppState.mockRejectedValue(
      new Error("bootstrap failed"),
    );

    await import("./main");
    await vi.dynamicImportSettled();

    expect(mocks.bootstrapAppState).toHaveBeenCalledOnce();
    expect(mocks.createApp).toHaveBeenCalledOnce();
    expect(mocks.use).toHaveBeenCalledWith(mocks.router);
    expect(mocks.mount).toHaveBeenCalledOnce();
    expect(mocks.mount).toHaveBeenCalledWith("#app");
  });
});
