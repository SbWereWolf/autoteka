import { apiClient } from "./api/HttpApiClient";
import { initState, state } from "./state";

export async function bootstrapAppState() {
  state.citySelectionError = true;

  const [citiesResult, categoriesResult, featuresResult] =
    await Promise.allSettled([
      apiClient.getCityList(),
      apiClient.getCategoryList(),
      apiClient.getFeatureList(),
    ]);

  if (citiesResult.status === "rejected") {
    throw citiesResult.reason;
  }

  state.citySelectionError = citiesResult.value.length === 0;

  if (categoriesResult.status === "rejected") {
    throw categoriesResult.reason;
  }

  if (featuresResult.status === "rejected") {
    throw featuresResult.reason;
  }

  await initState({
    cities: citiesResult.value,
    categories: categoriesResult.value,
    features: featuresResult.value,
  });
}
