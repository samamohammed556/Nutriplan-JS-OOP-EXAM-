const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

const NUTRITION_URL = "https://nutriplan-api.vercel.app/api/nutrition/analyze";
const USDA_API_KEY = "rg8wTBrnF9CKJkKjqj9b8TBrqmLkttGwRKwnJP8K";
export const SERVINGS = 4;
const CATEGORY_NUTRITION = {
  Beef: { calories: 550, protein: 40, carbs: 20, fat: 35 },
  Chicken: { calories: 450, protein: 38, carbs: 35, fat: 15 },
  Dessert: { calories: 400, protein: 5, carbs: 60, fat: 16 },
  Lamb: { calories: 580, protein: 38, carbs: 18, fat: 38 },
  Miscellaneous: { calories: 420, protein: 18, carbs: 45, fat: 18 },
  Pasta: { calories: 520, protein: 18, carbs: 75, fat: 14 },
  Pork: { calories: 560, protein: 35, carbs: 22, fat: 35 },
  Seafood: { calories: 380, protein: 34, carbs: 22, fat: 16 },
  Side: { calories: 220, protein: 6, carbs: 30, fat: 8 },
  Starter: { calories: 260, protein: 10, carbs: 25, fat: 14 },
  Vegan: { calories: 340, protein: 12, carbs: 50, fat: 10 },
  Vegetarian: { calories: 380, protein: 14, carbs: 50, fat: 14 },
  Breakfast: { calories: 360, protein: 16, carbs: 40, fat: 14 },
  Goat: { calories: 480, protein: 36, carbs: 15, fat: 30 },
};
const DEFAULT_NUTRITION = { calories: 450, protein: 20, carbs: 45, fat: 18 };

export class MealApi {
  constructor() {
    this.nutritionCache = {};
  }

  async request(path) {
    const response = await fetch(BASE_URL + path);
    if (!response.ok) {
      throw new Error("Request failed (" + response.status + ")");
    }
    return response.json();
  }

  async getCategories() {
    const data = await this.request("/categories.php");
    return data.categories || [];
  }

  async getAreas() {
    const data = await this.request("/list.php?a=list");
    const areas = data.meals || [];
    return areas.filter((item, index) => areas.findIndex((other) => other.strArea === item.strArea) === index);
  }

  async searchByName(query) {
    const data = await this.request("/search.php?s=" + encodeURIComponent(query));
    return data.meals || [];
  }

  async filterByCategory(category) {
    const data = await this.request("/filter.php?c=" + encodeURIComponent(category));
    return data.meals || [];
  }

  async filterByArea(area) {
    const data = await this.request("/filter.php?a=" + encodeURIComponent(area));
    return data.meals || [];
  }

  async filterByIngredient(ingredient) {
    const data = await this.request("/filter.php?i=" + encodeURIComponent(ingredient));
    return data.meals || [];
  }

  async getMealById(id) {
    const data = await this.request("/lookup.php?i=" + id);
    return data.meals ? data.meals[0] : null;
  }

  async getDefaultMeals() {
    const meals = await this.searchByName("chicken");
    return meals.slice(0, 25);
  }

  async getFullMeals(list) {
    const requests = list.slice(0, 25).map((meal) => this.getMealById(meal.idMeal).catch(() => null));
    const meals = await Promise.all(requests);
    return meals.filter(Boolean);
  }

  async searchAll(query) {
    const text = query.trim();

    let meals = await this.searchByName(text);
    if (meals.length > 0) return meals.slice(0, 25);

    meals = await this.filterByIngredient(text.replace(/\s+/g, "_"));
    if (meals.length > 0) return this.getFullMeals(meals);

    const area = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    meals = await this.filterByArea(area);
    return this.getFullMeals(meals);
  }

  async getNutrition(meal) {
    if (this.nutritionCache[meal.idMeal]) return this.nutritionCache[meal.idMeal];

    let nutrition = null;
    if (USDA_API_KEY) {
      try {
        nutrition = await this.analyzeMeal(meal);
      } catch (error) {
        console.error("Nutrition API failed, using estimate", error);
      }
    }

    if (!nutrition) nutrition = this.estimateNutrition(meal);
    this.nutritionCache[meal.idMeal] = nutrition;
    return nutrition;
  }

  async analyzeMeal(meal) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const name = (meal["strIngredient" + i] || "").trim();
      const measure = (meal["strMeasure" + i] || "").trim();
      if (name) ingredients.push((measure + " " + name).trim());
    }

    const response = await fetch(NUTRITION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": USDA_API_KEY },
      body: JSON.stringify({ recipeName: meal.strMeal, ingredients: ingredients }),
    });
    if (!response.ok) throw new Error("Nutrition request failed (" + response.status + ")");

    const data = await response.json();
    console.log("Nutrition API response:", data);

    const found = findNutrients(data);
    if (!found) throw new Error("Could not find nutrition values in the response");

    const divide = found.isPerServing ? 1 : SERVINGS;
    const read = (value) => Math.round(((Number(value) || 0) / divide) * 10) / 10;
    const values = found.values;

    const readOptional = (names) => {
      const value = pickValue(values, names);
      return value === null ? null : read(value);
    };

    return {
      calories: Math.round(read(values.calories)),
      protein: read(values.protein),
      carbs: read(values.carbs ?? values.carbohydrates),
      fat: read(values.fat),
      fiber: read(values.fiber),
      sugar: read(values.sugar),
      saturatedFat: readOptional(["saturatedfat", "saturated", "satfat"]),
      cholesterol: readOptional(["cholesterol"]),
      sodium: readOptional(["sodium"]),
      isEstimated: false,
    };
  }

  estimateNutrition(meal) {
    const base = CATEGORY_NUTRITION[meal.strCategory] || DEFAULT_NUTRITION;
    return { ...base, fiber: 5, sugar: 8, isEstimated: true };
  }
}

function findNutrients(data, path = "") {
  if (!data || typeof data !== "object") return null;

  if ("calories" in data && "protein" in data) {
    return { values: data, isPerServing: /per_?serving/i.test(path) };
  }

  let result = null;
  for (const key of Object.keys(data)) {
    const found = findNutrients(data[key], path + "." + key);
    if (found && found.isPerServing) return found;
    if (found && !result) result = found;
  }
  return result;
}

function pickValue(values, names) {
  for (const key of Object.keys(values)) {
    const clean = key.toLowerCase().replace(/[^a-z]/g, "");
    if (names.includes(clean)) {
      const raw = values[key];
      const number = typeof raw === "object" && raw !== null ? raw.amount ?? raw.value : raw;
      if (number !== null && number !== "" && Number.isFinite(Number(number))) return Number(number);
    }
  }
  return null;
}