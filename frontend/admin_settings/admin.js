// admin.js

import { loadProducts, showAddProductForm, initProductEvents } from '/admin_settings/products.js';

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
    console.log("Navigating to:", route);
    
    try {
        const html = await fetch(route).then((response) => response.text());
        document.getElementById("app").innerHTML = html;

        // Initialize product-related events when on the products page
        if (path === "/admin/products") {
            initProductEvents(); // Set up events (including loadProducts and form actions)
        }
    } catch (error) {
        console.error("Error loading page:", error);
    }
}

// Setup SPA navigation
window.onpopstate = handleLocation;
window.route = (event) => {
    event.preventDefault();
    window.history.pushState({}, "", event.target.href);
    handleLocation();
};

// Initial page load
document.addEventListener("DOMContentLoaded", handleLocation);
