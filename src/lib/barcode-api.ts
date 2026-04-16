export interface OpenFoodFactsProduct {
  product_name: string;
  brands?: string;
  image_url?: string;
  nutriments: {
    "energy-kcal_100g"?: number;
    "energy-kcal_serving"?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
  };
  serving_size?: string;
  serving_quantity?: number;
}

export interface ScannedFood {
  name: string;
  brand: string;
  imageUrl: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingSize: string;
  servingGrams: number;
  barcode: string;
}

const BARCODE_CACHE_KEY = "zyrafit_barcode_cache";

function getCache(): Record<string, ScannedFood> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(BARCODE_CACHE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function setCache(barcode: string, food: ScannedFood) {
  const cache = getCache();
  cache[barcode] = food;
  localStorage.setItem(BARCODE_CACHE_KEY, JSON.stringify(cache));
}

export async function lookupBarcode(barcode: string): Promise<ScannedFood | null> {
  // Check local cache first
  const cached = getCache()[barcode];
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!res.ok) return null;

    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;

    const p: OpenFoodFactsProduct = json.product;
    const n = p.nutriments;

    const food: ScannedFood = {
      name: p.product_name || "Unknown Product",
      brand: p.brands || "",
      imageUrl: p.image_url || "",
      caloriesPer100g: Math.round(n["energy-kcal_100g"] || 0),
      proteinPer100g: Math.round((n.proteins_100g || 0) * 10) / 10,
      carbsPer100g: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
      fatPer100g: Math.round((n.fat_100g || 0) * 10) / 10,
      servingSize: p.serving_size || "100g",
      servingGrams: p.serving_quantity || 100,
      barcode,
    };

    // Cache it
    setCache(barcode, food);
    return food;
  } catch {
    return null;
  }
}

export function calculateNutrition(food: ScannedFood, grams: number) {
  const factor = grams / 100;
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
  };
}
