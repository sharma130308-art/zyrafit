const BARCODE_CACHE_KEY = "zyrafit_barcode_cache";
function getCache() {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(BARCODE_CACHE_KEY);
  return stored ? JSON.parse(stored) : {};
}
function setCache(barcode, food) {
  const cache = getCache();
  cache[barcode] = food;
  localStorage.setItem(BARCODE_CACHE_KEY, JSON.stringify(cache));
}
async function lookupBarcode(barcode) {
  const cached = getCache()[barcode];
  if (cached) return cached;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { signal: AbortSignal.timeout(8e3) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    const n = p.nutriments;
    const food = {
      name: p.product_name || "Unknown Product",
      brand: p.brands || "",
      imageUrl: p.image_url || "",
      caloriesPer100g: Math.round(n["energy-kcal_100g"] || 0),
      proteinPer100g: Math.round((n.proteins_100g || 0) * 10) / 10,
      carbsPer100g: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
      fatPer100g: Math.round((n.fat_100g || 0) * 10) / 10,
      servingSize: p.serving_size || "100g",
      servingGrams: p.serving_quantity || 100,
      barcode
    };
    setCache(barcode, food);
    return food;
  } catch {
    return null;
  }
}
function calculateNutrition(food, grams) {
  const factor = grams / 100;
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10
  };
}
export {
  calculateNutrition,
  lookupBarcode
};
