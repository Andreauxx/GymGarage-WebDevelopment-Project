// home.js
import { displayProducts, shuffleArray } from './utils.js';
import { addToCart, updateCartCounter } from './authdisplay.js';


async function fetchHomeProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        let products = await response.json();
        console.log("Fetched products for home page:", products); // Log the fetched products

        shuffleArray(products); // Shuffle products to randomize display
        products = products.slice(0, 8); // Display only a limited number of products

        displayProducts(products, 'scrollable-grid', addToCart); // Display products in 'scrollable-grid' container
        updateCartCounter(); // Update cart counter for logged-in users
    } catch (error) {
        console.error('Error fetching products for home page:', error);
        const grid = document.getElementById('scrollable-grid');
        if (grid) {
            grid.innerHTML = '<p>Failed to load products. Please try again later.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchHomeProducts();
});
