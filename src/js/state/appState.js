export const GOALS = {
  calories: 2000,
  protein: 50,
  carbs: 250,
  fat: 65,
};

export const round = (number) => Math.round(number * 10) / 10;

export function getDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}

function readArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

export class FoodLog {
  constructor() {
    this.storageKey = "nutriplan_foodlog";
    this.items = readArray(this.storageKey);
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (error) {
      console.error("Could not save the food log", error);
    }
  }

  add(item) {
    this.items.push({
      id: Date.now() + "-" + Math.floor(Math.random() * 1000),
      date: getDateKey(),
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      ...item,
    });
    this.save();
  }

  remove(id) {
    this.items = this.items.filter((item) => item.id !== id);
    this.save();
  }

  clearToday() {
    const today = getDateKey();
    this.items = this.items.filter((item) => item.date !== today);
    this.save();
  }

  getByDate(date) {
    return this.items.filter((item) => item.date === date);
  }

  getTotals(date) {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    this.getByDate(date).forEach((item) => {
      totals.calories += item.calories || 0;
      totals.protein += item.protein || 0;
      totals.carbs += item.carbs || 0;
      totals.fat += item.fat || 0;
    });
    return {
      calories: round(totals.calories),
      protein: round(totals.protein),
      carbs: round(totals.carbs),
      fat: round(totals.fat),
    };
  }

  getWeek() {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const key = getDateKey(date);
      days.push({
        date: key,
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        day: date.getDate(),
        isToday: i === 0,
        itemCount: this.getByDate(key).length,
        ...this.getTotals(key),
      });
    }
    return days;
  }
}