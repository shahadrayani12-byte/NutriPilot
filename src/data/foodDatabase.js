export const FOOD_CATEGORIES = [
  "Grains",
  "Fruits",
  "Vegetables",
  "Dairy",
  "Meat and poultry",
  "Fish",
  "Eggs",
  "Legumes",
  "Nuts and seeds",
  "Oils and fats",
  "Beverages",
  "Snacks",
  "Mixed dishes",
  "Supplements placeholder",
];

export const SERVING_UNITS = [
  "gram",
  "milliliter",
  "cup",
  "tablespoon",
  "teaspoon",
  "piece",
  "slice",
  "serving",
];

export const UNIT_CONVERSIONS = {
  cup: 240,
  gram: 1,
  milliliter: 1,
  piece: 1,
  serving: 1,
  slice: 1,
  tablespoon: 15,
  teaspoon: 5,
};

export const LOCAL_FOODS = [
  food("food-rice-cooked", "Cooked white rice", "أرز أبيض مطبوخ", "Grains", 100, "gram", 130, 2.7, 28, 0.3, 0.4, { potassium: 35, calcium: 10, iron: 0.2 }),
  food("food-oats", "Rolled oats", "شوفان", "Grains", 40, "gram", 150, 5, 27, 3, 4, { potassium: 150, calcium: 20, iron: 1.7 }),
  food("food-banana", "Banana", "موز", "Fruits", 1, "piece", 105, 1.3, 27, 0.4, 3.1, { potassium: 422, calcium: 6, iron: 0.3 }),
  food("food-apple", "Apple", "تفاح", "Fruits", 1, "piece", 95, 0.5, 25, 0.3, 4.4, { potassium: 195, calcium: 11, iron: 0.2 }),
  food("food-broccoli", "Steamed broccoli", "بروكلي مطهو", "Vegetables", 100, "gram", 35, 2.4, 7, 0.4, 3.3, { potassium: 293, calcium: 40, iron: 0.7 }),
  food("food-cucumber", "Cucumber", "خيار", "Vegetables", 100, "gram", 15, 0.7, 3.6, 0.1, 0.5, { potassium: 147, calcium: 16, iron: 0.3 }),
  food("food-milk-lowfat", "Low-fat milk", "حليب قليل الدسم", "Dairy", 1, "cup", 102, 8, 12, 2.4, 0, { potassium: 366, calcium: 305, vitaminD: 2.9 }),
  food("food-yogurt-plain", "Plain yogurt", "زبادي سادة", "Dairy", 170, "gram", 100, 9, 12, 2, 0, { potassium: 240, calcium: 250, vitaminD: 1 }),
  food("food-chicken-breast", "Grilled chicken breast", "صدر دجاج مشوي", "Meat and poultry", 100, "gram", 165, 31, 0, 3.6, 0, { potassium: 256, calcium: 15, iron: 1 }),
  food("food-salmon", "Salmon", "سلمون", "Fish", 100, "gram", 208, 20, 0, 13, 0, { potassium: 363, calcium: 9, iron: 0.3, vitaminD: 10 }),
  food("food-egg", "Boiled egg", "بيض مسلوق", "Eggs", 1, "piece", 78, 6.3, 0.6, 5.3, 0, { potassium: 63, calcium: 25, iron: 0.6, vitaminD: 1.1 }),
  food("food-lentils", "Cooked lentils", "عدس مطبوخ", "Legumes", 100, "gram", 116, 9, 20, 0.4, 7.9, { potassium: 369, calcium: 19, iron: 3.3 }),
  food("food-almonds", "Almonds", "لوز", "Nuts and seeds", 28, "gram", 164, 6, 6, 14, 3.5, { potassium: 208, calcium: 76, iron: 1.1 }),
  food("food-olive-oil", "Olive oil", "زيت زيتون", "Oils and fats", 1, "tablespoon", 119, 0, 0, 13.5, 0, { potassium: 0, calcium: 0, iron: 0 }),
  food("food-water", "Water", "ماء", "Beverages", 250, "milliliter", 0, 0, 0, 0, 0, { potassium: 0, calcium: 0, iron: 0 }),
  food("food-dates", "Dates", "تمر", "Snacks", 3, "piece", 200, 1.8, 54, 0.2, 4.8, { potassium: 500, calcium: 40, iron: 0.9 }),
  food("food-chicken-kabsa", "Chicken kabsa", "كبسة دجاج", "Mixed dishes", 1, "serving", 520, 28, 62, 17, 3, { sodium: 780, potassium: 520, calcium: 45, iron: 2.5 }),
  {
    ...food("food-oral-supplement", "Oral nutrition supplement", "مكمل غذائي فموي", "Supplements placeholder", 1, "serving", 250, 10, 35, 7, 1, { calcium: 200, iron: 2, potassium: 300, vitaminD: 4 }),
    dataStatus: "Placeholder",
    notes: "Supplement values are placeholder only. Confirm product label before use.",
  },
];

export function searchFoods(query, category, customFoods = []) {
  const normalizedQuery = normalizeSearch(query);
  const foods = [...LOCAL_FOODS, ...customFoods];
  return foods.filter((item) => {
    const matchesCategory = category === "All" || !category || item.category === category;
    const searchableText = normalizeSearch(`${item.nameEn} ${item.nameAr} ${item.category}`);
    return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });
}

export function scaleFoodNutrition(food, portionInput, unitInput) {
  const portion = Number(portionInput) || Number(food.defaultServingSize) || 1;
  const unit = unitInput || food.servingUnit;
  const rawFactor = conversionFactor(food, portion, unit);
  const factor = rawFactor ?? 1;
  const values = {
    calories: round(food.calories * factor),
    carbohydrate: round(food.carbohydrates * factor),
    fat: round(food.fat * factor),
    fiber: round(food.fiber * factor),
    protein: round(food.protein * factor),
  };

  return {
    ...values,
    conversionNeedsReview: rawFactor === null,
  };
}

function conversionFactor(food, portion, unit) {
  if (unit === food.servingUnit) {
    return portion / (Number(food.defaultServingSize) || 1);
  }

  const selectedUnit = UNIT_CONVERSIONS[unit];
  const servingUnit = UNIT_CONVERSIONS[food.servingUnit];
  if (!selectedUnit || !servingUnit) return null;

  if (["piece", "slice", "serving"].includes(unit) || ["piece", "slice", "serving"].includes(food.servingUnit)) {
    return unit === food.servingUnit ? portion / (Number(food.defaultServingSize) || 1) : null;
  }

  return (portion * selectedUnit) / ((Number(food.defaultServingSize) || 1) * servingUnit);
}

function food(id, nameEn, nameAr, category, defaultServingSize, servingUnit, calories, protein, carbohydrates, fat, fiber, minerals = {}) {
  return {
    calcium: minerals.calcium ?? "",
    calories,
    carbohydrates,
    category,
    dataStatus: "Verified demo",
    defaultServingSize,
    fat,
    fiber,
    foodId: id,
    iron: minerals.iron ?? "",
    nameAr,
    nameEn,
    notes: "Demo nutrition value. Clinician review required.",
    potassium: minerals.potassium ?? "",
    protein,
    sodium: minerals.sodium ?? "",
    sourceLabel: "NutriPilot local demo food database",
    servingUnit,
    vitaminD: minerals.vitaminD ?? "",
  };
}

function normalizeSearch(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function round(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}
