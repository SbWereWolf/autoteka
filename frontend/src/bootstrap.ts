import { apiClient } from "./api/HttpApiClient";
import { initState } from "./state";

export async function bootstrapAppState() {
  const [cities, categories, features] = await Promise.all([
    apiClient.getCityList(),
    apiClient.getCategoryList(),
    apiClient.getFeatureList(),
  ]);

  initState({
    cities,
    categories,
    features,
    defaultThemeId: "a-neutral",
  });
}
