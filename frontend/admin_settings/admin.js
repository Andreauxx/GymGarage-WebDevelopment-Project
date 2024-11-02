// admin.js

import { loadProducts, showAddProductForm } from '/admin_settings/products.js';

const routes = {
    "/admin/dashboard": "/admin_settings/dashboard.html",
    "/admin/orders": "/admin_settings/orders.html",
    "/admin/products": "/admin_settings/products.html",
    "/admin/users": "/admin_settings/users.html",
    "/admin/transactions": "/admin_settings/transactions.html",
    "/admin/404": "/admin_settings/404.html"
};

// Function to handle navigation
async function handleLocation() {
    const path = window.location.pathname;
    const route = routes[path] || routes["/admin/404"];
    console.log("Navigating to:", route); // Debugging: Log the route being navigated to
    
    try {
        const html = await fetch(route).then((response) => response.text());
        document.getElementById("app").innerHTML = html;

        // Call loadProducts if products.html is loaded
        if (path === "/admin/products") {
            loadProducts();  // Load products into the table

            // Set up "Add Product" button event listener
            const addButton = document.querySelector(".add-product-btn");
            if (addButton) {
                addButton.addEventListener("click", showAddProductForm);
            }
        }
    } catch (error) {
        console.error("Error loading page:", error);
    }
}

// Setup navigation for single-page application behavior
window.onpopstate = handleLocation;
window.route = (event) => {
    event.preventDefault();
    window.history.pushState({}, "", event.target.href);
    handleLocation();
};

// Initial page load
document.addEventListener("DOMContentLoaded", handleLocation);
