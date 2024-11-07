// authdisplay.js
export function parseJwt(token) {
  try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
  } catch (e) {
      return null;
  }
}

export function isLoggedIn() {
  const token = localStorage.getItem('token');
  return token && parseJwt(token);
}

export function setupAddToCartButtons() {
  const buttons = document.querySelectorAll('.add-to-cart');
  buttons.forEach(button => {
      button.addEventListener('click', (event) => {
          if (!isLoggedIn()) {
              event.preventDefault();
              alert("Please log in to add items to the cart.");
              window.location.href = '/login';
          } else {
              const productId = button.getAttribute('data-product-id');
              if (productId) {
                  addToCart(productId);
              }
          }
      });
  });
}

// authdisplay.js
export async function addToCart(productId) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch('/api/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ productId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add to cart');
  }

  alert("Product added to cart successfully!");
}

export async function updateCartCounter() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/cart/count', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const { count } = await response.json();
      const counter = document.querySelector('.cart-counter');
      if (counter) counter.textContent = count;
    }
  } catch (error) {
    console.error('Error updating cart counter:', error);
  }
}
