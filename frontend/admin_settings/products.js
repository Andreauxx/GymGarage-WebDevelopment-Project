let editingProductId = null;

// Load products and attach event listeners
export async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        
        const products = await response.json();
        console.log("Loaded products:", products);

        const productsTable = document.getElementById("products-table");
        if (productsTable) {
            productsTable.innerHTML = products.map(product => `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>$${product.discounted_price || product.original_price}</td>
                    <td>
                        <button class="action-btn edit" data-id="${product.id}">Edit</button>
                        <button class="action-btn delete" data-id="${product.id}">Delete</button>
                    </td>
                </tr>
            `).join('');

            // Attach Edit and Delete listeners after table is updated
            productsTable.querySelectorAll(".edit").forEach(button => {
                button.addEventListener("click", () => editProduct(button.getAttribute("data-id")));
            });
            productsTable.querySelectorAll(".delete").forEach(button => {
                button.addEventListener("click", () => deleteProduct(button.getAttribute("data-id")));
            });
        }
    } catch (error) {
        console.error("Failed to load products:", error);
    }
}

// Show Add Product Form
export function showAddProductForm() {
    document.getElementById("form-title").innerText = "Add Product";
    document.getElementById("product-form-container").style.display = "block";
    clearForm();
    editingProductId = null; // Clear any editing mode
}

// Hide the form
export function hideProductForm() {
    document.getElementById("product-form-container").style.display = "none";
    clearForm();
    editingProductId = null;
}

// Clear form fields
function clearForm() {
    document.getElementById("product-name").value = "";
    document.getElementById("product-original-price").value = "";
    document.getElementById("product-discounted-price").value = "";
    document.getElementById("product-category").value = "";
    document.getElementById("product-stock").value = "";
    document.getElementById("product-image-url").value = "";
    document.getElementById("product-image-file").value = "";
    document.getElementById("product-extra-images").value = "";
}

// Submit the form
export async function submitProductForm(event) {
    event.preventDefault(); // Prevent page reload

    const name = document.getElementById("product-name").value;
    const original_price = parseFloat(document.getElementById("product-original-price").value);
    const discounted_price = parseFloat(document.getElementById("product-discounted-price").value) || null;
    const category = document.getElementById("product-category").value;
    const stock = parseInt(document.getElementById("product-stock").value);
    const imageUrl = document.getElementById("product-image-url").value;
    const imageFile = document.getElementById("product-image-file").files[0];
    const extraImages = document.getElementById("product-extra-images").value.split(",").map(url => url.trim());

    const formData = new FormData();
    formData.append("name", name);
    formData.append("original_price", original_price);
    formData.append("discounted_price", discounted_price);
    formData.append("category", category);
    formData.append("stock", stock);
    if (imageUrl) formData.append("image_url", imageUrl);
    if (imageFile) formData.append("image_file", imageFile);
    formData.append("extra_images", JSON.stringify(extraImages));

    const method = editingProductId ? 'PUT' : 'POST';
    const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';

    console.log("Submitting form:", { name, original_price, discounted_price, category, stock, imageUrl, extraImages });

    try {
        const response = await fetch(url, { method, body: formData });
        if (response.ok) {
            console.log("Product saved successfully");
            hideProductForm();
            loadProducts();
        } else {
            console.error("Failed to save product:", await response.json());
        }
    } catch (error) {
        console.error("Error saving product:", error);
    }
}
// Edit Product
export async function editProduct(id) {
    try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        const product = await response.json();

        document.getElementById("form-title").innerText = "Edit Product";
        document.getElementById("product-name").value = product.name;
        document.getElementById("product-original-price").value = product.original_price;
        document.getElementById("product-discounted-price").value = product.discounted_price || "";
        document.getElementById("product-category").value = product.category;
        document.getElementById("product-stock").value = product.stock;
        document.getElementById("product-image-url").value = product.image_url || "";
        document.getElementById("product-extra-images").value = (product.extra_images || []).join(", ");
        document.getElementById("product-form-container").style.display = "block";
        editingProductId = id;
    } catch (error) {
        console.error("Error loading product data:", error);
    }
}

// Delete Product
export async function deleteProduct(id) {
    if (confirm("Are you sure you want to delete this product?")) {
        try {
            await fetch(`/api/products/${id}`, { method: 'DELETE' });
            loadProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    }
}
