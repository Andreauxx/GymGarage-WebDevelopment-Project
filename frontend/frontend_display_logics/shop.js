// shop.js
import { displayProducts } from './utils.js';
import { addToCart, updateCartCounter } from './authdisplay.js';

let currentPage = 1;
const productsPerPage = 3; // Number of products to display per page

export async function fetchShopProducts(page = 1) {
  currentPage = page;

  const searchQuery = document.getElementById("search-input").value.trim();
  const category = document.getElementById("category").value;
  const price = document.getElementById("price-range").value;
  const availability = document.getElementById("availability").value;

  let query = `/api/products?`;
  if (searchQuery) query += `search=${searchQuery}&`;
  if (category && category !== "all") query += `category=${category}&`;
  if (price) query += `price=${price}&`;
  if (availability && availability !== "all") query += `availability=${availability}`;
  query += `page=${currentPage}&limit=${productsPerPage}`;

  try {
    const response = await fetch(query);
    console.log('API response:', response);

    if (!response.ok) {
      const error = await response.json();
      console.log('Error response:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    const data = await response.json();
    console.log('API data:', data);

    const { products = [], totalProducts = 0, totalPages = 0 } = data;
    displayProducts(products, 'product-grid', addToCart);
    updatePagination(currentPage, totalPages);
    updateCartCounter(); // Update cart count on load
  } catch (error) {
    console.error("Error fetching products for shop:", error);
    document.getElementById('product-grid').innerHTML = '<p>Failed to load products.</p>';
  }
}

function updatePagination(currentPage, totalPages) {
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = '';

  // Generate pagination buttons
  for (let page = 1; page <= totalPages; page++) {
    const button = document.createElement('button');
    button.textContent = page;
    button.classList.add('page-button');
    if (page === currentPage) {
      button.classList.add('active');
    }
    button.addEventListener('click', () => fetchShopProducts(page));
    paginationContainer.appendChild(button);
  }
}

export function setupFilters() {
  document.getElementById('apply-filters').addEventListener('click', () => fetchShopProducts(1));

  document.getElementById("price-range").addEventListener("input", () => {
    const price = document.getElementById("price-range").value;
    document.getElementById("price-label").innerText = `₱0 - ₱${price}`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchShopProducts(); // Initial load
  setupFilters();       // Setup filter functionality
});