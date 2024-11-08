import { displayProducts } from './utils.js';
import { addToCart, updateCartCounter, isLoggedIn } from './authdisplay.js';

export async function fetchShopProducts() {
  const searchQuery = document.getElementById("search-input").value.trim();
  const category = document.getElementById("category").value;
  const price = document.getElementById("price-range").value;
  const availability = document.getElementById("availability").value;

  let query = `/api/products?`;
  if (searchQuery) query += `search=${searchQuery}&`;
  if (category && category !== "all") query += `category=${category}&`;
  if (price) query += `price=${price}&`;
  if (availability && availability !== "all") query += `availability=${availability}`;

  try {
    const response = await fetch(query);
    if (!response.ok) throw new Error('Failed to fetch products');
    const products = await response.json();
    displayProducts(products, 'product-grid', addToCart); // Load products in the grid
  } catch (error) {
    console.error("Error fetching products for shop:", error);
    document.getElementById('product-grid').innerHTML = '<p>Failed to load products.</p>';
  }
}

export function setupFilters() {
  document.getElementById('apply-filters').addEventListener('click', fetchShopProducts);

  document.getElementById("price-range").addEventListener("input", () => {
    const price = document.getElementById("price-range").value;
    document.getElementById("price-label").innerText = `₱0 - ₱${price}`;
  });
}

// New function to initialize the page and handle both products and cart
async function initializeShopPage() {
  await fetchShopProducts(); // Fetch and display products first

  if (isLoggedIn()) {
    await updateCartCounter(); // Only update cart counter if the user is logged in
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeShopPage(); // Initialize the shop page components
  setupFilters(); // Set up the filter functionality
});
