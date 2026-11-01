import { GOALS } from "../state/appState.js";
import { SERVINGS } from "../api/mealdb.js";

export function escapeHtml(text = "") {
  return String(text).replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });
}

export function getIngredients(meal) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal["strIngredient" + i];
    const measure = meal["strMeasure" + i];
    if (name && name.trim()) {
      list.push({ name: name.trim(), measure: (measure || "").trim() });
    }
  }
  return list;
}

export function getSteps(text = "") {
  let steps = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 2 && !/^step\s*\d+$/i.test(line))
    .map((line) => line.replace(/^step\s*\d+[:.\-\s]*/i, "").replace(/^\d+[.)]\s*/, ""));

  if (steps.length === 1) {
    steps = steps[0].split(/(?<=\.)\s+/);
  }
  return steps.filter(Boolean);
}

export function getYoutubeEmbed(url = "") {
  if (!url) return "";
  if (url.includes("watch?v=")) {
    return url.split("watch?v=")[1].split("&")[0];
  }
  if (url.includes("youtu.be/")) {
    return url.split("youtu.be/")[1].split("?")[0];
  }
  return "";
}

function shorten(text = "") {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "Delicious recipe to try!";
  return clean.length > 100 ? clean.slice(0, 100).trim() + "..." : clean;
}

export function spinner() {
  return `
    <div class="flex items-center justify-center py-12" style="grid-column: 1 / -1">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>`;
}

export function emptyState(title, text, icon = "fa-search", isLarge = false) {
  const circle = isLarge ? "w-20 h-20" : "w-16 h-16";
  const iconSize = isLarge ? "text-3xl" : "text-2xl";
  const titleSize = isLarge ? "text-xl" : "text-lg";
  const textSize = isLarge ? "text-base" : "text-sm";
  return `
    <div class="flex flex-col items-center justify-center py-12 text-center" style="grid-column: 1 / -1">
      <div class="${circle} bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid ${icon} text-gray-400 ${iconSize}"></i>
      </div>
      <p class="text-gray-500 ${titleSize}">${escapeHtml(title)}</p>
      <p class="text-gray-400 ${textSize} mt-2">${escapeHtml(text)}</p>
    </div>`;
}

export function errorState(message) {
  return `
    <div class="flex flex-col items-center justify-center py-12 text-center" style="grid-column: 1 / -1">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
      </div>
      <p class="text-gray-500 text-lg">Something went wrong</p>
      <p class="text-gray-400 text-sm mt-2">${escapeHtml(message)}</p>
      <button data-retry class="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all">
        <i class="fa-solid fa-rotate-right mr-1"></i>Try again
      </button>
    </div>`;
}

const CATEGORY_STYLES = {
  Beef: {
    icon: "fa-drumstick-bite",
    card: "from-red-50 to-rose-50 border-red-200 hover:border-red-400",
    badge: "from-red-400 to-rose-500",
  },
  Chicken: {
    icon: "fa-drumstick-bite",
    card: "from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400",
    badge: "from-orange-400 to-amber-500",
  },
  Dessert: {
    icon: "fa-cake-candles",
    card: "from-pink-50 to-rose-50 border-pink-200 hover:border-pink-400",
    badge: "from-pink-400 to-rose-500",
  },
  Lamb: {
    icon: "fa-drumstick-bite",
    card: "from-orange-50 to-amber-50 border-orange-200 hover:border-orange-400",
    badge: "from-orange-400 to-orange-500",
  },
  Miscellaneous: {
    icon: "fa-bowl-rice",
    card: "from-slate-50 to-gray-50 border-slate-200 hover:border-slate-400",
    badge: "from-slate-400 to-gray-600",
  },
  Pasta: {
    icon: "fa-bowl-food",
    card: "from-yellow-50 to-amber-50 border-yellow-200 hover:border-yellow-400",
    badge: "from-yellow-400 to-amber-500",
  },
  Pork: {
    icon: "fa-bacon",
    card: "from-rose-50 to-red-50 border-rose-200 hover:border-rose-400",
    badge: "from-rose-400 to-red-500",
  },
  Seafood: {
    icon: "fa-fish",
    card: "from-blue-50 to-cyan-50 border-cyan-200 hover:border-cyan-400",
    badge: "from-blue-400 to-cyan-500",
  },
  Side: {
    icon: "fa-bowl-rice",
    card: "from-green-50 to-emerald-50 border-green-200 hover:border-green-400",
    badge: "from-green-400 to-emerald-500",
  },
  Starter: {
    icon: "fa-utensils",
    card: "from-teal-50 to-cyan-50 border-teal-200 hover:border-teal-400",
    badge: "from-teal-400 to-cyan-500",
  },
  Vegan: {
    icon: "fa-leaf",
    card: "from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400",
    badge: "from-emerald-400 to-green-500",
  },
  Vegetarian: {
    icon: "fa-seedling",
    card: "from-lime-50 to-green-50 border-lime-200 hover:border-lime-400",
    badge: "from-lime-400 to-green-500",
  },
};

const DEFAULT_CATEGORY_STYLE = {
  icon: "fa-utensils",
  card: "from-stone-50 to-gray-50 border-stone-200 hover:border-stone-400",
  badge: "from-stone-400 to-gray-500",
};

export function categoryCard(category) {
  const name = category.strCategory;
  const style = CATEGORY_STYLES[name] || DEFAULT_CATEGORY_STYLE;
  return `
    <div class="category-card bg-gradient-to-br ${style.card} rounded-xl p-3 border hover:shadow-md cursor-pointer transition-all group"
         data-category="${escapeHtml(name)}">
      <div class="flex items-center gap-2.5">
        <div class="text-white w-9 h-9 bg-gradient-to-br ${style.badge} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
          <i class="fa-solid ${style.icon}"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-900">${escapeHtml(name)}</h3>
        </div>
      </div>
    </div>`;
}

export function areaButton(area, label, isActive) {
  const style = isActive
    ? "bg-emerald-600 text-white hover:bg-emerald-700"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";
  return `
    <button data-area="${escapeHtml(area)}"
            class="px-4 py-2 ${style} rounded-full font-medium text-sm whitespace-nowrap transition-all">
      ${escapeHtml(label)}
    </button>`;
}

export function recipeCard(meal, isListView) {
  const category = meal.strCategory || "";
  const area = meal.strArea || "";
  const description = shorten(meal.strInstructions);
  const title = `
    <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
      ${escapeHtml(meal.strMeal)}
    </h3>
    <p class="text-xs text-gray-600 mb-3 line-clamp-2">${escapeHtml(description)}</p>
    <div class="flex items-center justify-between text-xs">
      <span class="font-semibold text-gray-900">
        <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${escapeHtml(category)}
      </span>
      <span class="font-semibold text-gray-500">
        <i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHtml(area)}
      </span>
    </div>`;

  if (isListView) {
    return `
      <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex h-40"
           data-meal-id="${meal.idMeal}">
        <div class="relative overflow-hidden shrink-0" style="width: 110px">
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
               src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}" loading="lazy" />
        </div>
        <div class="p-4 flex-1">${title}</div>
      </div>`;
  }

  return `
    <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
         data-meal-id="${meal.idMeal}">
      <div class="relative h-48 overflow-hidden">
        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
             src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}" loading="lazy" />
        <div class="absolute bottom-3 left-3 flex gap-2">
          <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">
            <i class="fa-solid fa-tag text-emerald-600 mr-1"></i>${escapeHtml(category)}
          </span>
          <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">
            <i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHtml(area)}
          </span>
        </div>
      </div>
      <div class="p-4">${title}</div>
    </div>`;
}

function nutritionRow(label, value, unit, goal, color) {
  const percent = Math.min(100, Math.round((value / goal) * 100));
  return `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full ${color}"></div>
        <span class="text-gray-700">${label}</span>
      </div>
      <span class="font-bold text-gray-900">${value}${unit}</span>
    </div>
    <div class="w-full bg-gray-100 rounded-full h-2">
      <div class="${color} h-2 rounded-full" style="width: ${percent}%"></div>
    </div>`;
}

function otherNutrition(nutrition) {
  const rows = [];
  if (nutrition.cholesterol != null) rows.push(["Cholesterol", nutrition.cholesterol]);
  if (nutrition.sodium != null) rows.push(["Sodium", nutrition.sodium]);
  if (rows.length === 0) return "";

  return `
    <div class="mt-6 pt-6 border-t border-gray-100">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Other</h3>
      <div class="grid grid-cols-2 gap-3 text-sm">
        ${rows.map(([label, value]) => `<div class="flex justify-between"><span class="text-gray-600">${label}</span><span class="font-medium">${value}mg</span></div>`).join("")}
      </div>
    </div>`;
}

export function mealDetailsHtml(meal, nutrition) {
  const ingredients = getIngredients(meal);
  const steps = getSteps(meal.strInstructions);
  const videoId = getYoutubeEmbed(meal.strYoutube);

  const ingredientsHtml = ingredients
    .map(
      (item) => `
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
        <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300" />
        <span class="text-gray-700">
          <span class="font-medium text-gray-900">${escapeHtml(item.measure)}</span> ${escapeHtml(item.name)}
        </span>
      </div>`
    )
    .join("");

  const stepsHtml = steps
    .map(
      (step, index) => `
      <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
        <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${index + 1}</div>
        <p class="text-gray-700 leading-relaxed pt-2">${escapeHtml(step)}</p>
      </div>`
    )
    .join("");

  const videoHtml = videoId
    ? `
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i class="fa-solid fa-video text-red-500"></i>Video Tutorial
        </h2>
        <div class="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
          <iframe src="https://www.youtube.com/embed/${videoId}" class="absolute inset-0 w-full h-full"
                  frameborder="0" referrerpolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen></iframe>
        </div>
      </div>`
    : "";

  return `
    <div class="max-w-7xl mx-auto">
      <button id="back-to-meals-btn" class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6 transition-colors">
        <i class="fa-solid fa-arrow-left"></i><span>Back to Recipes</span>
      </button>

      <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div class="relative h-80 md:h-96">
          <img src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-8">
            <div class="flex items-center gap-3 mb-3">
              <span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${escapeHtml(meal.strCategory)}</span>
              <span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${escapeHtml(meal.strArea)}</span>
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">${escapeHtml(meal.strMeal)}</h1>
            <div class="flex items-center gap-6 text-white/90">
              <span class="flex items-center gap-2"><i class="fa-solid fa-clock"></i><span>30 min</span></span>
              <span class="flex items-center gap-2"><i class="fa-solid fa-utensils"></i><span>${SERVINGS} servings</span></span>
              <span class="flex items-center gap-2"><i class="fa-solid fa-fire"></i><span>${nutrition.calories} cal/serving</span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 mb-8">
        <button id="log-meal-btn" class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all">
          <i class="fa-solid fa-clipboard-list"></i><span>Log This Meal</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fa-solid fa-list-check text-emerald-600"></i>Ingredients
              <span class="text-sm font-normal text-gray-500 ml-auto">${ingredients.length} items</span>
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${ingredientsHtml}</div>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fa-solid fa-shoe-prints text-emerald-600"></i>Instructions
            </h2>
            <div class="space-y-4">${stepsHtml}</div>
          </div>

          ${videoHtml}
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fa-solid fa-chart-pie text-emerald-600"></i>Nutrition Facts
            </h2>
            <p class="text-sm text-gray-500 mb-4">Per serving${nutrition.isEstimated ? " (estimated)" : ""}</p>
            <div class="text-center py-4 mb-4 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl">
              <p class="text-sm text-gray-600">Calories per serving</p>
              <p class="text-4xl font-bold text-emerald-600">${nutrition.calories}</p>
              <p class="text-xs text-gray-500 mt-1">Total: ${Math.round(nutrition.calories * SERVINGS)} cal</p>
            </div>
            <div class="space-y-4">
              ${nutritionRow("Protein", nutrition.protein, "g", GOALS.protein, "bg-emerald-500")}
              ${nutritionRow("Carbs", nutrition.carbs, "g", 300, "bg-blue-500")}
              ${nutritionRow("Fat", nutrition.fat, "g", GOALS.fat, "bg-purple-500")}
              ${nutritionRow("Fiber", nutrition.fiber, "g", 28, "bg-orange-500")}
              ${nutritionRow("Sugar", nutrition.sugar, "g", 50, "bg-pink-500")}
              ${nutrition.saturatedFat != null ? nutritionRow("Saturated Fat", nutrition.saturatedFat, "g", 20, "bg-red-500") : ""}
            </div>
            ${otherNutrition(nutrition)}
          </div>
        </div>
      </div>
    </div>`;
}

const GRADE_COLORS = {
  a: "bg-green-500",
  b: "bg-lime-500",
  c: "bg-yellow-500",
  d: "bg-orange-500",
  e: "bg-red-500",
  unknown: "bg-gray-400",
};

const NOVA_COLORS = {
  1: "bg-green-500",
  2: "bg-lime-500",
  3: "bg-orange-500",
  4: "bg-red-500",
};

const PRODUCT_CATEGORIES = [
  { id: "breakfast-cereals", label: "Breakfast Cereals", icon: "fa-wheat-awn", color: "from-amber-500 to-orange-500" },
  { id: "beverages", label: "Beverages", icon: "fa-bottle-water", color: "from-blue-500 to-cyan-500" },
  { id: "snacks", label: "Snacks", icon: "fa-cookie", color: "from-purple-500 to-pink-500" },
  { id: "dairies", label: "Dairy Products", icon: "fa-cheese", color: "from-cyan-400 to-blue-500" },
  { id: "fruits", label: "Fruits", icon: "fa-apple-whole", color: "from-red-500 to-rose-500" },
  { id: "vegetables", label: "Vegetables", icon: "fa-carrot", color: "from-green-500 to-emerald-500" },
  { id: "breads", label: "Breads", icon: "fa-bread-slice", color: "from-amber-600 to-yellow-500" },
  { id: "meats", label: "Meats", icon: "fa-drumstick-bite", color: "from-red-600 to-rose-600" },
  { id: "frozen-foods", label: "Frozen Foods", icon: "fa-snowflake", color: "from-cyan-500 to-blue-600" },
  { id: "sauces", label: "Sauces & Condiments", icon: "fa-bottle-droplet", color: "from-orange-500 to-red-500" },
];

export function productCategoryButtons() {
  return PRODUCT_CATEGORIES.map(
    (item) => `
    <button data-product-category="${item.id}"
            class="px-6 py-3 bg-gradient-to-r ${item.color} text-white rounded-xl font-semibold whitespace-nowrap flex items-center gap-2 hover:shadow-lg transition-all">
      <i class="fa-solid ${item.icon}"></i>${item.label}
    </button>`
  ).join("");
}

export function productCard(product) {
  const n = product.nutrients;
  const gradeColor = GRADE_COLORS[product.nutritionGrade] || GRADE_COLORS.unknown;
  const gradeText = product.nutritionGrade === "unknown" ? "N/A" : product.nutritionGrade;
  const novaHtml = product.novaGroup
    ? `<div class="absolute top-2 right-2 ${NOVA_COLORS[product.novaGroup] || "bg-gray-400"} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" title="NOVA ${product.novaGroup}">${product.novaGroup}</div>`
    : "";
  const imageHtml = product.image
    ? `<img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" />`
    : `<i class="fa-solid fa-box-open text-gray-300 text-4xl"></i>`;

  return `
    <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group" data-barcode="${product.barcode}">
      <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        ${imageHtml}
        <div class="absolute top-2 left-2 ${gradeColor} text-white text-xs font-bold px-2 py-1 rounded uppercase">Nutri-Score ${gradeText}</div>
        ${novaHtml}
      </div>
      <div class="p-4">
        <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${escapeHtml(product.brand || "Unknown brand")}</p>
        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${escapeHtml(product.name)}</h3>
        <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span><i class="fa-solid fa-fire mr-1"></i>${n.calories} kcal/100g</span>
        </div>
        <div class="grid grid-cols-4 gap-1 text-center">
          <div class="bg-emerald-50 rounded p-1.5"><p class="text-xs font-bold text-emerald-700">${n.protein}g</p><p class="text-[10px] text-gray-500">Protein</p></div>
          <div class="bg-blue-50 rounded p-1.5"><p class="text-xs font-bold text-blue-700">${n.carbs}g</p><p class="text-[10px] text-gray-500">Carbs</p></div>
          <div class="bg-purple-50 rounded p-1.5"><p class="text-xs font-bold text-purple-700">${n.fat}g</p><p class="text-[10px] text-gray-500">Fat</p></div>
          <div class="bg-orange-50 rounded p-1.5"><p class="text-xs font-bold text-orange-700">${n.sugar}g</p><p class="text-[10px] text-gray-500">Sugar</p></div>
        </div>
        <button class="add-product-btn w-full mt-3 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all"
                data-barcode="${product.barcode}">
          <i class="fa-solid fa-plus mr-1"></i>Add to Food Log
        </button>
      </div>
    </div>`;
}

export function foodLogPage() {
  return `
    <div class="max-w-7xl mx-auto">
      <div class="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold mb-2"><i class="fa-solid fa-clipboard-list mr-2"></i>Daily Food Log</h2>
            <p class="opacity-90">Track and monitor your daily nutrition intake</p>
          </div>
          <div class="text-right">
            <p class="text-sm opacity-80">Today</p>
            <p class="text-xl font-bold" id="foodlog-date"></p>
          </div>
        </div>
      </div>

      <div id="foodlog-today-section" class="bg-white rounded-2xl p-6 mb-6 border-2 border-gray-200">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fa-solid fa-fire text-orange-500 mr-2"></i>Today's Nutrition
        </h3>
        <div id="progress-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"></div>
        <div class="border-t border-gray-200 pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 id="logged-title" class="text-sm font-semibold text-gray-700">Logged Items (0)</h4>
            <button id="clear-foodlog" class="text-red-500 hover:text-red-600 text-sm font-medium" style="display: none">
              <i class="fa-solid fa-trash mr-1"></i>Clear All
            </button>
          </div>
          <div id="logged-items-list" class="space-y-2"></div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 mb-6 border-2 border-gray-200">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fa-solid fa-calendar-week text-indigo-500 mr-2"></i>Weekly Overview
        </h3>
        <div id="weekly-days" class="grid grid-cols-7 gap-2"></div>
      </div>

      <div id="weekly-stats" class="grid grid-cols-1 md:grid-cols-3 gap-4"></div>
    </div>`;
}

const PROGRESS_CARDS = [
  { key: "calories", label: "Calories", unit: "kcal", text: "text-emerald-600", bar: "bg-emerald-500" },
  { key: "protein", label: "Protein", unit: "g", text: "text-blue-600", bar: "bg-blue-500" },
  { key: "carbs", label: "Carbs", unit: "g", text: "text-amber-600", bar: "bg-amber-500" },
  { key: "fat", label: "Fat", unit: "g", text: "text-purple-600", bar: "bg-purple-500" },
];

export function progressCards(totals) {
  return PROGRESS_CARDS.map((card) => {
    const value = totals[card.key];
    const goal = GOALS[card.key];
    const percent = Math.min(100, Math.round((value / goal) * 100));
    const isOver = value > goal;
    const textColor = isOver ? "text-red-600" : card.text;
    const barColor = isOver ? "bg-red-500" : card.bar;

    return `
      <div class="bg-gray-50 rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">${card.label}</span>
          <span class="text-sm font-semibold ${textColor}">${percent}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div class="${barColor} h-2 rounded-full progress-bar" style="width: ${Math.min(100, percent)}%"></div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="font-bold ${textColor}">${value} ${card.unit}</span>
          <span class="text-gray-400">/ ${goal} ${card.unit}</span>
        </div>
      </div>`;
  }).join("");
}

// Converts any stored time (e.g. "17:19" or "5:19 PM") to 12-hour format like "5:19 PM"
function formatTime(time = "") {
  const text = String(time).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return text.replace(/\u202f/g, " ");

  let hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return hours + ":" + minutes + " " + suffix;
}

// Styles for the logged item row (desktop + small screens), injected once
function injectLogRowStyles() {
  if (typeof document === "undefined" || document.getElementById("log-row-styles")) return;
  const style = document.createElement("style");
  style.id = "log-row-styles";
  style.textContent = `
    .log-row { display:flex; align-items:center; gap:20px; padding:16px 20px; margin-bottom:10px; background:#f9fafb; border-radius:1rem; }
    .log-img { width:72px; height:72px; border-radius:.75rem; object-fit:cover; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:#e5e7eb; color:#6b7280; }
    .log-info { flex:1; min-width:0; }
    .log-name { font-size:.95rem; font-weight:700; color:#111827; margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .log-sub { font-size:.8rem; color:#6b7280; margin-bottom:4px; }
    .log-dot { margin:0 6px; }
    .log-type { color:#059669; font-weight:500; }
    .log-time { font-size:.7rem; color:#9ca3af; }
    .log-cal { text-align:center; padding:0 4px; }
    .log-cal-value { font-size:1.2rem; font-weight:700; color:#059669; line-height:1.2; }
    .log-cal-unit { font-size:.75rem; color:#6b7280; margin-top:2px; }
    .log-pills { display:flex; gap:8px; }
    .log-pill { padding:5px 10px; border-radius:.5rem; font-size:.75rem; white-space:nowrap; }
    .log-remove { color:#9ca3af; padding:8px; font-size:.9rem; background:none; border:0; cursor:pointer; }
    .log-remove:hover { color:#ef4444; }
    @media (max-width: 768px) {
      .log-row { gap:12px; padding:12px 14px; margin-bottom:8px; }
      .log-img { width:56px; height:56px; }
      .log-name { font-size:.875rem; }
      .log-sub { font-size:.75rem; margin-bottom:3px; }
      .log-time { font-size:.65rem; }
      .log-cal-value { font-size:1.05rem; }
      .log-cal-unit { font-size:.7rem; }
      .log-pills { display:none; }
      .log-remove { padding:6px; font-size:.85rem; }
    }`;
  document.head.appendChild(style);
}

export function loggedItemRow(item) {
  injectLogRowStyles();

  const imageHtml = item.image
    ? `<img src="${item.image}" alt="${escapeHtml(item.name)}" class="log-img" />`
    : `<div class="log-img"><i class="fa-solid fa-utensils"></i></div>`;
  const label = item.type === "meal" ? "Recipe" : "Product";

  return `
    <div class="log-row">
      ${imageHtml}
      <div class="log-info">
        <p class="log-name">${escapeHtml(item.name)}</p>
        <p class="log-sub">
          ${escapeHtml(item.amount || "")}<span class="log-dot">&bull;</span><span class="log-type">${label}</span>
        </p>
        <p class="log-time">${formatTime(item.time)}</p>
      </div>
      <div class="log-cal">
        <p class="log-cal-value">${item.calories}</p>
        <p class="log-cal-unit">kcal</p>
      </div>
      <div class="log-pills">
        <span class="log-pill" style="background:#eff6ff;color:#4b6a9b">${item.protein}g P</span>
        <span class="log-pill" style="background:#fefce8;color:#7c6a3a">${item.carbs}g C</span>
        <span class="log-pill" style="background:#faf5ff;color:#6b5b8f">${item.fat}g F</span>
      </div>
      <button class="log-remove" data-remove-id="${item.id}" aria-label="Remove item">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>`;
}

export function emptyLogState() {
  return `
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-utensils text-gray-400 text-3xl"></i>
      </div>
      <p class="text-gray-500 text-lg">No food logged today</p>
      <p class="text-gray-400 text-sm mt-2">Start tracking your nutrition by logging meals or scanning products</p>
      <div class="flex items-center gap-3 mt-6">
        <button data-go="home" class="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all">
          <i class="fa-solid fa-plus mr-2"></i>Browse Recipes
        </button>
        <button data-go="products" class="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all">
          <i class="fa-solid fa-barcode mr-2"></i>Scan Product
        </button>
      </div>
    </div>`;
}

export function weeklyDays(days) {
  return days
    .map((day) => {
      let valueColor = "text-gray-300";
      let unitColor = "text-gray-300";
      if (day.calories > 0) {
        valueColor = "text-emerald-600";
        unitColor = "text-emerald-600";
      }
      const background = day.isToday ? "bg-indigo-100" : "";
      const itemsHtml =
        day.itemCount > 0 ? `<p class="text-xs text-gray-400 mt-1">${day.itemCount} items</p>` : "";

      return `
        <div class="text-center rounded-xl py-2 ${background}">
          <p class="text-xs text-gray-500">${day.label}</p>
          <p class="text-base font-medium text-gray-900">${day.day}</p>
          <p class="text-xl font-bold ${valueColor} mt-1">${Math.round(day.calories)}</p>
          <p class="text-xs ${unitColor}">kcal</p>
          ${itemsHtml}
        </div>`;
    })
    .join("");
}

export function weeklyStats(stats) {
  const cards = [
    { label: "Weekly Average", value: stats.average + " kcal", icon: "fa-chart-line", box: "bg-emerald-100", color: "text-emerald-600" },
    { label: "Total Items This Week", value: stats.items + " items", icon: "fa-utensils", box: "bg-blue-100", color: "text-blue-600" },
    { label: "Days On Goal", value: stats.onGoal + " / 7", icon: "fa-bullseye", box: "bg-purple-100", color: "text-purple-600" },
  ];

  return cards
    .map(
      (card) => `
      <div class="bg-white rounded-xl p-4 border-2 border-gray-200 flex items-center gap-4">
        <div class="w-12 h-12 ${card.box} rounded-xl flex items-center justify-center">
          <i class="fa-solid ${card.icon} ${card.color} text-xl"></i>
        </div>
        <div>
          <p class="text-sm text-gray-500">${card.label}</p>
          <p class="text-2xl font-bold text-gray-900">${card.value}</p>
        </div>
      </div>`
    )
    .join("");
}

const roundOne = (number) => Math.round(number * 10) / 10;

function createOverlay(content) {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop";
  overlay.innerHTML = `<div class="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">${content}</div>`;
  document.body.appendChild(overlay);
  return overlay;
}

export function toast(message, type = "success") {
  const colors = {
    success: "bg-emerald-600",
    info: "bg-blue-600",
    warning: "bg-amber-500",
    error: "bg-red-600",
  };
  const icons = {
    success: "fa-circle-check",
    info: "fa-circle-info",
    warning: "fa-triangle-exclamation",
    error: "fa-circle-xmark",
  };

  const element = document.createElement("div");
  element.className = `fixed bottom-4 right-4 z-[100] ${colors[type] || colors.success} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium toast-notification`;
  element.innerHTML = `<i class="fa-solid ${icons[type] || icons.success}"></i><span>${escapeHtml(message)}</span>`;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 3000);
}

function nutritionBox(label, values) {
  const cells = [
    { value: Math.round(values.calories), unit: "", name: "Calories", color: "text-emerald-600" },
    { value: roundOne(values.protein), unit: "g", name: "Protein", color: "text-blue-600" },
    { value: roundOne(values.carbs), unit: "g", name: "Carbs", color: "text-amber-600" },
    { value: roundOne(values.fat), unit: "g", name: "Fat", color: "text-purple-600" },
  ];

  return `
    <p class="text-sm text-gray-600">${label}</p>
    <div class="grid grid-cols-4 gap-2 text-center mt-3">
      ${cells
        .map(
          (cell) => `
        <div>
          <p class="text-xl font-bold ${cell.color}">${cell.value}${cell.unit}</p>
          <p class="text-xs text-gray-500">${cell.name}</p>
        </div>`
        )
        .join("")}
    </div>`;
}

export function askAmount(options) {
  return new Promise((resolve) => {
    const step = options.step || 1;
    const min = options.min || step;
    const max = options.max || 10000;
    const integerOnly = Boolean(options.integer);

    const imageHtml = options.image
      ? `<img src="${options.image}" alt="" class="w-16 h-16 rounded-xl object-cover" />`
      : `<div class="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400"><i class="fa-solid fa-utensils text-xl"></i></div>`;

    const overlay = createOverlay(`
      <div class="flex items-center gap-4 mb-6">
        ${imageHtml}
        <div>
          <h2 class="text-xl font-bold text-gray-900">${escapeHtml(options.title)}</h2>
          <p class="text-gray-500 line-clamp-2">${escapeHtml(options.subtitle || "")}</p>
        </div>
      </div>
      <p class="text-sm font-medium text-gray-700 mb-2">${escapeHtml(options.label)}</p>
      <div class="flex items-center gap-3">
        <button data-step="-1" class="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-700" aria-label="Decrease">
          <i class="fa-solid fa-minus"></i>
        </button>
        <input data-amount type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${options.value}"
               class="w-20 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500" />
        <button data-step="1" class="w-10 h-10 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-700" aria-label="Increase">
          <i class="fa-solid fa-plus"></i>
        </button>
        ${options.unit ? `<span class="text-gray-500 font-medium">${escapeHtml(options.unit)}</span>` : ""}
      </div>
      <p data-error class="text-sm text-red-500 mt-2" style="min-height:1.25rem"></p>
      <div data-summary class="bg-emerald-50 rounded-xl p-4 mt-4"></div>
      <div class="flex gap-3 mt-6">
        <button data-cancel class="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">Cancel</button>
        <button data-confirm class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
          <i class="fa-solid fa-clipboard-list"></i>${escapeHtml(options.confirmText)}
        </button>
      </div>`);

    const input = overlay.querySelector("[data-amount]");
    const summary = overlay.querySelector("[data-summary]");
    const errorBox = overlay.querySelector("[data-error]");
    let isDone = false;

    // Returns { ok, amount, message } for the current input value
    const validate = () => {
      const raw = input.value.trim();
      if (raw === "") return { ok: false, message: "Please enter an amount" };

      const amount = Number(raw);
      if (!Number.isFinite(amount)) return { ok: false, message: "Please enter a valid number" };
      if (integerOnly && !Number.isInteger(amount)) return { ok: false, message: "Please enter a whole number" };
      if (amount < min) return { ok: false, message: "The minimum is " + min };
      if (amount > max) return { ok: false, message: "The maximum is " + max };
      return { ok: true, amount };
    };

    const showError = (message) => {
      errorBox.textContent = message || "";
      input.style.borderColor = message ? "#ef4444" : "";
    };

    const refresh = () => {
      const raw = Number(input.value);
      const safe = Number.isFinite(raw) ? Math.min(max, Math.max(min, raw)) : min;
      summary.innerHTML = nutritionBox(options.summaryLabel, options.summary(safe));
    };

    const finish = (value) => {
      if (isDone) return;
      isDone = true;
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      resolve(value);
    };

    const confirm = () => {
      const result = validate();
      if (!result.ok) {
        showError(result.message);
        input.focus();
        return;
      }
      finish(result.amount);
    };

    const onKey = (event) => {
      if (event.key === "Escape") finish(null);
      if (event.key === "Enter") {
        if (event.target.closest && event.target.closest("[data-cancel], [data-step]")) return;
        confirm();
      }
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) finish(null);

      const stepButton = event.target.closest("[data-step]");
      if (stepButton) {
        const current = Number(input.value);
        const base = Number.isFinite(current) && input.value.trim() !== "" ? current : min;
        let next = roundOne(base + Number(stepButton.dataset.step) * step);
        if (integerOnly) next = Math.round(next);
        input.value = Math.min(max, Math.max(min, next));
        showError("");
        refresh();
      }

      if (event.target.closest("[data-cancel]")) finish(null);
      if (event.target.closest("[data-confirm]")) confirm();
    });

    input.addEventListener("input", () => {
      const result = validate();
      showError(result.ok ? "" : result.message);
      refresh();
    });

    document.addEventListener("keydown", onKey);
    refresh();
    input.focus();
    input.select();
  });
}

export function confirmAction(title, text) {
  return new Promise((resolve) => {
    const overlay = createOverlay(`
      <div class="flex items-center gap-4 mb-4">
        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
          <i class="fa-solid fa-trash text-red-500 text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">${escapeHtml(title)}</h2>
          <p class="text-gray-500 text-sm">${escapeHtml(text)}</p>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button data-cancel class="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">Cancel</button>
        <button data-confirm class="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all">Yes, clear</button>
      </div>`);

    const finish = (value) => {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      resolve(value);
    };

    const onKey = (event) => {
      if (event.key === "Escape") finish(false);
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest("[data-cancel]")) finish(false);
      if (event.target.closest("[data-confirm]")) finish(true);
    });
    document.addEventListener("keydown", onKey);
  });
}