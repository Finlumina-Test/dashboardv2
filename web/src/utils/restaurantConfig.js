// Restaurant configuration mapping
const RESTAURANT_CONFIG = {
  restaurant_a: {
    baseUrl: "https://finlumina-vox-v3.onrender.com",
    username: "restaurant_a",
    password: "pass123",
  },
  restaurant_b: {
    baseUrl: "https://finlumina-vox-v.onrender.com",
    username: "restaurant_b",
    password: "pass456",
  },
  database: {
    baseUrl: "https://vox-openai.onrender.com",
    username: "Database",
    password: "pass789",
  },
  restaurant_c: {
    baseUrl: "https://vox-openai-database.onrender.com",
    username: "normal",
    password: "pass123",
  },
  demo: {
    baseUrl: "https://vox-openai-demo.onrender.com",
    username: "Demo",
    password: "pass789",
  },
};

export function getRestaurantConfig(restaurantId) {
  return RESTAURANT_CONFIG[restaurantId] || null;
}

export function getBaseUrl(restaurantId) {
  const config = getRestaurantConfig(restaurantId);
  return config ? config.baseUrl : null;
}

export function getAllRestaurants() {
  return RESTAURANT_CONFIG;
}