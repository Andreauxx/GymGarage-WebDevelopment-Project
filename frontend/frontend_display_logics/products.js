// products.js
import { displayProducts, isLoggedIn } from './utils.js';

// Function to fetch and display products based on filters
export async function fetchProducts(containerId) {
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
    displayProducts(products, containerId, addToCart);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

// Function to handle adding products to the cart
export async function addToCart(productId) {
  const token = localStorage.getItem('token');
  if (!isLoggedIn()) {
    alert("Please log in to add items to the cart.");
    window.location.href = '/login.html';
    return;
  }
  
  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId })
    });

    if (response.ok) {
      alert('Product added to cart successfully!');
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to add product to cart');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
}

// Function to set up filters
export function setupFilters(containerId) {
  document.getElementById('apply-filters').addEventListener('click', () => fetchProducts(containerId));
  document.getElementById("price-range").addEventListener("input", () => {
    const price = document.getElementById("price-range").value;
    document.getElementById("price-label").innerText = `₱0 - ₱${price}`;
  });
}
