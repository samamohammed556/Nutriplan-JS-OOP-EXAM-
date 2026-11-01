import { MealApi } from "./api/mealdb.js";
import { ProductApi } from "./api/products.js";
import { FoodLog, GOALS, round, getDateKey } from "./state/appState.js";
import {
  spinner,
  emptyState,
  errorState,
  categoryCard,
  areaButton,
  recipeCard,
  mealDetailsHtml,
  productCard,
  productCategoryButtons,
  foodLogPage,
  progressCards,
  loggedItemRow,
  emptyLogState,
  weeklyDays,
  weeklyStats,
  toast,
  askAmount,
  confirmAction,
  escapeHtml,
} from "./ui/components.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const PAGES = {
  home: ["#search-filters-section", "#meal-categories-section", "#all-recipes-section"],
  "meal-details": ["#meal-details"],
  products: ["#products-section"],
  foodlog: ["#foodlog-section"],
};

const ALL_SECTIONS = [
  "#search-filters-section",
  "#meal-categories-section",
  "#all-recipes-section",
  "#meal-details",
  "#products-section",
  "#foodlog-section",
];

const PAGE_TITLES = {
  home: ["Meals & Recipes", "Discover delicious and nutritious recipes tailored for you"],
  "meal-details": ["Recipe Details", "View full recipe information and nutrition facts"],
  products: ["Product Scanner", "Search packaged foods by name or barcode"],
  foodlog: ["Food Log", "Track your daily nutrition and food intake"],
};

const NAV_HASHES = ["home", "products", "foodlog"];

const HIDDEN_CATEGORIES = ["Breakfast", "Goat"];

const MAX_AREAS = 10;

// A day counts as "on goal" when calories are within this range of the goal (10%)
const GOAL_TOLERANCE = 0.1;

// Shows the green "success" SweetAlert popup after logging an item
function showLoggedAlert(title, name, amountText, calories) {
  if (typeof window.Swal === "undefined") {
    console.warn("SweetAlert2 is not loaded. Check the script URL in index.html");
    toast(name + " added to your food log (+" + calories + " kcal)");
    return;
  }

  window.Swal.fire({
    icon: "success",
    title: title,
    html: `
      <p style="margin-bottom:8px">
        ${escapeHtml(name)} (${escapeHtml(amountText)}) has been added to your daily log.
      </p>
      <p style="color:#059669;font-weight:600;font-size:1.1rem">
        +${calories} calories
      </p>`,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: false,
  });
}

class App {
  constructor() {
    this.mealApi = new MealApi();
    this.productApi = new ProductApi();
    this.foodLog = new FoodLog();

    this.filter = { type: "default", value: "" };
    this.isListView = false;
    this.mealsRequestId = 0;
    this.productsRequestId = 0;
    this.detailsRequestId = 0;
    this.searchTimer = null;

    this.currentMeal = null;
    this.currentNutrition = null;
    this.products = [];
    this.nutriGrade = "";
  }

  async init() {
    $("#foodlog-section").innerHTML = foodLogPage();
    $("#product-categories").innerHTML = productCategoryButtons();

    this.bindEvents();
    window.addEventListener("hashchange", () => this.handleRoute());

    if (!location.hash) {
      history.replaceState(null, "", "#home");
    }

    try {
      await this.loadStartData();
    } catch (error) {
      console.error(error);
      $("#recipes-grid").innerHTML = errorState("Could not load data. Check your internet connection.");
    }

    this.resetProductsPage();
    this.hideLoadingOverlay();
    this.handleRoute();
  }

  async loadStartData() {
    $("#categories-grid").innerHTML = spinner();
    $("#recipes-grid").innerHTML = spinner();

    const [categories, areas] = await Promise.all([
      this.mealApi.getCategories(),
      this.mealApi.getAreas(),
    ]);

    const visible = categories.filter((item) => !HIDDEN_CATEGORIES.includes(item.strCategory));
    $("#categories-grid").innerHTML = visible.map(categoryCard).join("");
    this.renderAreaButtons(areas);
    await this.loadMeals("default", "");
  }

  hideLoadingOverlay() {
    const overlay = $("#app-loading-overlay");
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    setTimeout(() => (overlay.style.display = "none"), 500);
  }

  getRoute() {
    const hash = location.hash.replace("#", "");
    if (hash.startsWith("meal/")) {
      return { page: "meal-details", id: hash.split("/")[1] };
    }
    if (hash === "products" || hash === "foodlog") {
      return { page: hash };
    }
    return { page: "home" };
  }

  handleRoute() {
    const route = this.getRoute();
    this.showPage(route.page);

    if (route.page !== "meal-details") {
      this.detailsRequestId++;
    }

    if (route.page === "meal-details") {
      this.loadMealDetails(route.id);
    } else if (route.page === "foodlog") {
      this.renderFoodLog();
    }
  }

  showPage(page) {
    ALL_SECTIONS.forEach((selector) => {
      $(selector).style.display = "none";
    });
    PAGES[page].forEach((selector) => {
      $(selector).style.display = "";
    });

    $("#header h1").textContent = PAGE_TITLES[page][0];
    $("#header p").textContent = PAGE_TITLES[page][1];

    const activeHash = page === "meal-details" ? "home" : page;
    $$(".nav-link").forEach((link, index) => {
      const isActive = NAV_HASHES[index] === activeHash;
      link.classList.toggle("bg-emerald-50", isActive);
      link.classList.toggle("text-emerald-700", isActive);
      link.classList.toggle("text-gray-600", !isActive);
      link.classList.toggle("hover:bg-gray-50", !isActive);
      const text = link.querySelector("span");
      text.classList.toggle("font-semibold", isActive);
      text.classList.toggle("font-medium", !isActive);
    });

    this.closeSidebar();
    window.scrollTo({ top: 0 });
  }

  goTo(hash) {
    if (location.hash === "#" + hash) {
      this.handleRoute();
    } else {
      location.hash = hash;
    }
  }

  bindEvents() {
    $("#header-menu-btn").addEventListener("click", () => this.openSidebar());
    $("#sidebar-close-btn").addEventListener("click", () => this.closeSidebar());
    $("#sidebar-overlay").addEventListener("click", () => this.closeSidebar());

    $$(".nav-link").forEach((link, index) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        this.goTo(NAV_HASHES[index]);
      });
    });

    $("#search-input").addEventListener("input", (event) => this.onSearchInput(event.target.value));


    $("#search-filters-section .overflow-x-auto").addEventListener("click", (event) => {
      const button = event.target.closest("[data-area]");
      if (!button) return;
      const area = button.dataset.area;
      this.loadMeals(area ? "area" : "default", area);
    });

    // One delegated listener for the whole categories section
    $("#meal-categories-section").addEventListener("click", (event) => {
      const card = event.target.closest("[data-category]");
      if (card) {
        const category = card.dataset.category;
        const isActive = this.filter.type === "category" && this.filter.value === category;
        // Clicking the active category again clears the filter
        if (isActive) this.loadMeals("default", "");
        else this.loadMeals("category", category);
        return;
      }

      // "View All" button
      if (event.target.closest("button")) this.loadMeals("default", "");
    });

    $("#recipes-grid").addEventListener("click", (event) => {
      if (event.target.closest("[data-retry]")) {
        this.loadMeals(this.filter.type, this.filter.value);
        return;
      }
      const card = event.target.closest(".recipe-card");
      if (card) this.goTo("meal/" + card.dataset.mealId);
    });

    $("#grid-view-btn").addEventListener("click", () => this.setView(false));
    $("#list-view-btn").addEventListener("click", () => this.setView(true));

    $("#meal-details").addEventListener("click", (event) => {
      if (event.target.closest("#back-to-meals-btn")) this.goTo("home");
      if (event.target.closest("#log-meal-btn")) this.logCurrentMeal();
    });

    $("#search-product-btn").addEventListener("click", () => this.searchProducts());
    $("#product-search-input").addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.searchProducts();
    });
    $("#lookup-barcode-btn").addEventListener("click", () => this.lookupBarcode());
    $("#barcode-input").addEventListener("keydown", (event) => {
      if (event.key === "Enter") this.lookupBarcode();
    });

    $$(".nutri-score-filter").forEach((button) => {
      button.addEventListener("click", () => this.setNutriFilter(button));
    });

    $("#product-categories").addEventListener("click", (event) => {
      const button = event.target.closest("[data-product-category]");
      if (button) this.loadProductCategory(button);
    });

    $("#products-grid").addEventListener("click", (event) => {
      const button = event.target.closest(".add-product-btn");
      if (button) this.logProduct(button.dataset.barcode);
    });

    $("#foodlog-section").addEventListener("click", (event) => {
      if (event.target.closest("#clear-foodlog")) {
        this.clearFoodLog();
        return;
      }

      const removeButton = event.target.closest("[data-remove-id]");
      if (removeButton) {
        this.foodLog.remove(removeButton.dataset.removeId);
        this.renderFoodLog();
        toast("Item removed from log", "info");
        return;
      }

      const goButton = event.target.closest("[data-go]");
      if (goButton) this.goTo(goButton.dataset.go);
    });
  }

  openSidebar() {
    $("#sidebar").classList.add("open");
    $("#sidebar-overlay").classList.add("active");
  }

  closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#sidebar-overlay").classList.remove("active");
  }

  renderAreaButtons(areas) {
    const container = $("#search-filters-section .overflow-x-auto");
    const list = areas.filter((item) => item.strArea !== "Unknown").slice(0, MAX_AREAS);
    container.innerHTML =
      areaButton("", "All Cuisines", true) +
      list.map((item) => areaButton(item.strArea, item.strArea, false)).join("");
  }

  highlightFilters() {
    const { type, value } = this.filter;

    $$("#search-filters-section [data-area]").forEach((button) => {
      const isActive =
        type === "area" ? button.dataset.area === value : type === "default" && button.dataset.area === "";
      button.classList.toggle("bg-emerald-600", isActive);
      button.classList.toggle("text-white", isActive);
      button.classList.toggle("bg-gray-100", !isActive);
      button.classList.toggle("text-gray-700", !isActive);
    });

    $$("#categories-grid [data-category]").forEach((card) => {
      const isActive = type === "category" && card.dataset.category === value;
      card.classList.toggle("ring-2", isActive);
      card.classList.toggle("ring-gray-900", isActive);
    });
  }

  onSearchInput(text) {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      const query = text.trim();
      const type = query ? "search" : "default";
      // Skip if nothing really changed
      if (this.filter.type === type && this.filter.value === query) return;
      this.loadMeals(type, query);
    }, 400);
  }

  async loadMeals(type, value) {
    // Cancel any pending search so it can't override this filter later
    clearTimeout(this.searchTimer);
    this.filter = { type: type, value: value };
    this.highlightFilters();

    if (type === "category" || type === "area" || type === "default") {
      $("#search-input").value = "";
    }

    const requestId = ++this.mealsRequestId;
    $("#recipes-grid").innerHTML = spinner();
    $("#recipes-count").textContent = "Loading recipes...";

    try {
      let meals = [];
      if (type === "category") {
        meals = await this.mealApi.getFullMeals(await this.mealApi.filterByCategory(value));
      } else if (type === "area") {
        meals = await this.mealApi.getFullMeals(await this.mealApi.filterByArea(value));
      } else if (type === "search") {
        meals = await this.mealApi.searchAll(value);
      } else {
        meals = await this.mealApi.getDefaultMeals();
      }

      if (requestId !== this.mealsRequestId) return;
      this.meals = meals;
      this.renderMeals();
    } catch (error) {
      console.error(error);
      if (requestId !== this.mealsRequestId) return;
      $("#recipes-count").textContent = "Could not load recipes";
      $("#recipes-grid").innerHTML = errorState(error.message);
    }
  }

  renderMeals() {
    const meals = this.meals || [];
    $("#recipes-count").textContent = "Showing " + meals.length + " recipes";

    if (meals.length === 0) {
      $("#recipes-grid").innerHTML = emptyState("No recipes found", "Try searching for something else");
      return;
    }

    $("#recipes-grid").innerHTML = meals.map((meal) => recipeCard(meal, this.isListView)).join("");
  }

  setView(isList) {
    this.isListView = isList;
    const grid = $("#recipes-grid");

    grid.classList.toggle("grid-cols-4", !isList);
    grid.classList.toggle("grid-cols-2", isList);

    $("#grid-view-btn").classList.toggle("bg-white", !isList);
    $("#grid-view-btn").classList.toggle("shadow-sm", !isList);
    $("#list-view-btn").classList.toggle("bg-white", isList);
    $("#list-view-btn").classList.toggle("shadow-sm", isList);

    if (this.meals && this.meals.length > 0) this.renderMeals();
  }

  async loadMealDetails(id) {
    const requestId = ++this.detailsRequestId;
    const isStale = () => requestId !== this.detailsRequestId || this.getRoute().id !== id;

    const section = $("#meal-details");
    this.currentMeal = null;
    this.currentNutrition = null;
    section.innerHTML = spinner();

    try {
      const meal = await this.mealApi.getMealById(id);
      if (isStale()) return;

      if (!meal) {
        section.innerHTML = emptyState("Meal not found", "This recipe does not exist", "fa-utensils");
        return;
      }

      const nutrition = await this.mealApi.getNutrition(meal);
      if (isStale()) return;

      this.currentMeal = meal;
      this.currentNutrition = nutrition;
      section.innerHTML = mealDetailsHtml(meal, nutrition);
    } catch (error) {
      console.error(error);
      if (isStale()) return;
      section.innerHTML = errorState(error.message);
      section.querySelector("[data-retry]").addEventListener("click", () => this.loadMealDetails(id));
    }
  }

  async logCurrentMeal() {
    const meal = this.currentMeal;
    const nutrition = this.currentNutrition;
    if (!meal || !nutrition) return;

    const servings = await askAmount({
      image: meal.strMealThumb,
      title: "Log This Meal",
      subtitle: meal.strMeal,
      label: "Number of Servings",
      value: 1,
      min: 1,
      max: 20,
      step: 1,
      integer: true,
      confirmText: "Log Meal",
      summaryLabel: "Estimated nutrition per serving:",
      summary: () => nutrition,
    });
    if (!servings) return;

    const calories = round(nutrition.calories * servings);
    const servingsText = servings + (servings === 1 ? " serving" : " servings");

    this.foodLog.add({
      type: "meal",
      name: meal.strMeal,
      image: meal.strMealThumb,
      amount: servingsText,
      calories: calories,
      protein: round(nutrition.protein * servings),
      carbs: round(nutrition.carbs * servings),
      fat: round(nutrition.fat * servings),
    });

    showLoggedAlert("Meal Logged!", meal.strMeal, servingsText, calories);
  }

  resetProductsPage() {
    this.products = [];
    $("#products-count").textContent = "Search for products to see results";
    $("#products-grid").innerHTML = emptyState(
      "No products to display",
      "Search for a product or browse by category",
      "fa-box-open",
      true
    );
    const allButton = $(".nutri-score-filter");
    allButton.classList.remove("bg-emerald-600", "text-white");
    allButton.classList.add("bg-gray-100", "text-gray-700", "hover:bg-gray-200");
  }

  async fetchProducts(loader) {
    const requestId = ++this.productsRequestId;
    $("#products-grid").innerHTML = spinner();
    $("#products-count").textContent = "Loading products...";

    try {
      const products = await loader();
      if (requestId !== this.productsRequestId) return;
      this.products = products;
      this.renderProducts();
    } catch (error) {
      console.error(error);
      if (requestId !== this.productsRequestId) return;
      this.products = [];
      $("#products-count").textContent = "Could not load products";
      $("#products-grid").innerHTML = errorState(error.message);
      $("#products-grid").querySelector("[data-retry]").addEventListener("click", () => this.fetchProducts(loader));
    }
  }

  renderProducts() {
    const list = this.nutriGrade
      ? this.products.filter((product) => product.nutritionGrade === this.nutriGrade)
      : this.products;

    $("#products-count").textContent = list.length + " products found";

    if (list.length === 0) {
      $("#products-grid").innerHTML = emptyState(
        "No products to display",
        "Search for a product or browse by category",
        "fa-box-open",
        true
      );
      return;
    }
    $("#products-grid").innerHTML = list.map(productCard).join("");
  }

  clearCategoryHighlight() {
    $$("#product-categories [data-product-category]").forEach((button) => {
      button.classList.remove("ring-2", "ring-gray-900");
    });
  }

  searchProducts() {
    const query = $("#product-search-input").value.trim();
    if (!query) {
      toast("Type a product name first", "warning");
      return;
    }
    this.clearCategoryHighlight();
    this.fetchProducts(() => this.productApi.search(query));
  }

  lookupBarcode() {
    const barcode = $("#barcode-input").value.trim();
    if (!/^\d{6,14}$/.test(barcode)) {
      toast("Enter a valid barcode (numbers only)", "warning");
      return;
    }
    this.clearCategoryHighlight();
    this.fetchProducts(async () => {
      const product = await this.productApi.getByBarcode(barcode);
      return product ? [product] : [];
    });
  }

  loadProductCategory(button) {
    this.clearCategoryHighlight();
    button.classList.add("ring-2", "ring-gray-900");
    this.fetchProducts(() => this.productApi.getByCategory(button.dataset.productCategory));
  }

  setNutriFilter(button) {
    this.nutriGrade = button.dataset.grade;
    $$(".nutri-score-filter").forEach((item) => item.classList.remove("ring-2", "ring-gray-900"));
    button.classList.add("ring-2", "ring-gray-900");
    if (this.products.length > 0) this.renderProducts();
  }

  async logProduct(barcode) {
    const product = this.products.find((item) => item.barcode === barcode);
    if (!product) return;

    const n = product.nutrients;
    const grams = await askAmount({
      image: product.image,
      title: "Add to Food Log",
      subtitle: product.name,
      label: "Amount (grams)",
      unit: "g",
      value: 100,
      min: 10,
      max: 5000,
      step: 10,
      confirmText: "Add to Log",
      summaryLabel: "Estimated nutrition for this amount:",
      summary: (amount) => ({
        calories: (n.calories * amount) / 100,
        protein: (n.protein * amount) / 100,
        carbs: (n.carbs * amount) / 100,
        fat: (n.fat * amount) / 100,
      }),
    });
    if (!grams) return;

    const ratio = grams / 100;
    const calories = round(n.calories * ratio);

    this.foodLog.add({
      type: "product",
      name: product.name,
      image: product.image,
      amount: grams + " g",
      calories: calories,
      protein: round(n.protein * ratio),
      carbs: round(n.carbs * ratio),
      fat: round(n.fat * ratio),
    });

    showLoggedAlert("Product Logged!", product.name, grams + " g", calories);
  }

  renderFoodLog() {
    const today = getDateKey();
    const items = this.foodLog.getByDate(today);
    const totals = this.foodLog.getTotals(today);
    const week = this.foodLog.getWeek();

    $("#foodlog-date").textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    $("#progress-grid").innerHTML = progressCards(totals);
    $("#logged-title").textContent = "Logged Items (" + items.length + ")";
    $("#clear-foodlog").style.display = items.length > 0 ? "" : "none";
    $("#logged-items-list").innerHTML =
      items.length > 0 ? items.slice().reverse().map(loggedItemRow).join("") : emptyLogState();

    // Weekly average = total calories of the 7 days / 7
    const totalCalories = week.reduce((sum, day) => sum + day.calories, 0);

    // A day is "on goal" when its calories are within ±10% of the daily goal
    const minGoal = GOALS.calories * (1 - GOAL_TOLERANCE);
    const maxGoal = GOALS.calories * (1 + GOAL_TOLERANCE);

    $("#weekly-days").innerHTML = weeklyDays(week);
    $("#weekly-stats").innerHTML = weeklyStats({
      average: Math.round(totalCalories / 7),
      items: week.reduce((sum, day) => sum + day.itemCount, 0),
      onGoal: week.filter((day) => day.calories >= minGoal && day.calories <= maxGoal).length,
    });
  }

  async clearFoodLog() {
    let sure = false;

    if (typeof window.Swal === "undefined") {
      sure = await confirmAction("Clear today's log?", "All items logged today will be removed.");
    } else {
      const result = await window.Swal.fire({
        icon: "warning",
        title: "Clear Today's Log?",
        text: "This will remove all logged food items for today.",
        showCancelButton: true,
        confirmButtonText: "Yes, clear it!",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
      });
      sure = result.isConfirmed;
    }

    if (!sure) return;
    this.foodLog.clearToday();
    this.renderFoodLog();
    toast("Today's log cleared", "info");

    if (typeof window.Swal !== "undefined") {
      window.Swal.fire({
        icon: "success",
        title: "Cleared!",
        text: "Your food log has been cleared.",
        showConfirmButton: false,
        timer: 1500,
      });
    }
  }
}

const app = new App();
app.init();