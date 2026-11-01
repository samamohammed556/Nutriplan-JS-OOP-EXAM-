const BASE_URL = "https://nutriplan-api.vercel.app/api/products";

function cleanProduct(product) {
  const n = product.nutrients || {};
  const nutrients = {
    calories: Number(n.calories) || 0,
    protein: Number(n.protein) || 0,
    carbs: Number(n.carbs) || 0,
    fat: Number(n.fat) || 0,
    sugar: Number(n.sugar) || 0,
    fiber: Number(n.fiber) || 0,
  };

  if (nutrients.calories === 0) {
    nutrients.calories = Math.round(
      nutrients.protein * 4 + nutrients.carbs * 4 + nutrients.fat * 9
    );
  }

  return {
    barcode: product.barcode,
    name: product.name || "Unknown product",
    brand: product.brand || "",
    image: product.image || "",
    nutritionGrade: (product.nutritionGrade || "unknown").toLowerCase(),
    novaGroup: product.novaGroup || 0,
    nutrients: nutrients,
  };
}

export class ProductApi {
  async request(url) {
    const response = await fetch(url);
    if (!response.ok) {
      const error = new Error("Request failed (" + response.status + ")");
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  async search(name, page = 1, limit = 24) {
    const url = BASE_URL + "/search?q=" + encodeURIComponent(name) + "&page=" + page + "&limit=" + limit;
    const data = await this.request(url);
    return (data.results || []).map(cleanProduct);
  }

  async getByBarcode(barcode) {
    try {
      const data = await this.request(BASE_URL + "/barcode/" + encodeURIComponent(barcode));
      return data.result ? cleanProduct(data.result) : null;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async getByCategory(categoryId) {
    const data = await this.request(BASE_URL + "/category/" + encodeURIComponent(categoryId));
    return (data.results || []).map(cleanProduct);
  }
}