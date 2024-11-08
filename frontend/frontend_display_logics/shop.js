import { displayProductsShop } from './utils.js';
import { addToCart, updateCartCounter, isLoggedIn } from './authdisplay.js';

let currentPage = 1; // Initialize the currentPage variable

export async function fetchShopProducts(page = 1) {
  currentPage = page;
  const productsPerPage = 3; // Set the number of products to display per page

  const searchQuery = document.getElementById("search-input").value.trim();
  const category = document.getElementById("category").value;
  const price = document.getElementById("price-range").value;
  const availability = document.getElementById("availability").value;

  let query = `/api/products?page=${page}&limit=${productsPerPage}`;
  if (searchQuery) query += `&search=${searchQuery}`;
  if (category && category !== "all") query += `&category=${category}`;
  if (price) query += `&price=${price}`;
  if (availability && availability !== "all") query += `&availability=${availability}`;

  try {
    const response = await fetch(query);
    if (!response.ok) {
      throw new Error('Failed to fetch products. Please try again later.');
    }

    const { products = [], totalProducts = 0, totalPages = 0 } = await response.json();

    if (products.length === 0) {
      const productGrid = document.getElementById('product-grid');
      if (productGrid) {
        productGrid.innerHTML = '<p>No products found matching the selected filters.</p>';
      } else {
        console.error('Element with ID "product-grid" not found. Unable to display message.');
      }
      updatePagination(currentPage, totalPages);
      return;
    }

    displayProductsShop(products, 'product-grid', addToCart);
    updatePagination(currentPage, totalPages);
  } catch (error) {
    console.error("Error fetching products for shop:", error);
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
      productGrid.innerHTML = '<p>Failed to load products. Please try again later.</p>';
    } else {
      console.error('Element with ID "product-grid" not found. Unable to display error message.');
    }
  }
}

export function setupFilters() {
  document.getElementById('apply-filters').addEventListener('click', () => fetchShopProducts(1));

  document.getElementById("price-range").addEventListener("input", () => {
    const price = document.getElementById("price-range").value;
    document.getElementById("price-label").innerText = `₱0 - ₱${price}`;
  });
}

function updatePagination(currentPage, totalPages) {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) {
    console.error('Element with ID "pagination" not found. Unable to update pagination.');
    return;
  }

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

// New function to initialize the page and handle both products and cart
async function initializeShopPage() {
  await fetchShopProducts(); // Fetch and display products first

  if (isLoggedIn()) {
    await updateCartCounter(); // Only update cart counter if the user is logged in
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchShopProducts(); // Initial load
  setupFilters();       // Setup filter functionality
});