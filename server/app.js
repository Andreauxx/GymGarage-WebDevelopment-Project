

import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import {
  getUserByEmail,
  addItemToCart,
  getCartItems,
  getProducts,
  saveProductToDatabase,
  updateProductInDatabase,
  deleteProductFromDatabase,
  getProductById,
  getProductReviews,
  removeItemFromCart,
  checkoutCart, // Keep these
} from './database.js';

import pagesRouter from './pages.js';
import supabase from './database.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(
  session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Use true if HTTPS is enabled
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);


// Middleware for session-based authentication
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    next(); // User is authenticated
  } else {
    res.status(401).json({ message: 'Unauthorized: Please log in' });
  }
}

// Protect Cart routes using session-based authentication
app.use('/api/cart', isAuthenticated);

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await getUserByEmail(email);
    if (!user) return res.status(400).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Incorrect password' });

    req.session.userId = user.id; // Ensure this is saved for future requests
    req.session.username = user.username;
    res.json({ message: 'Login successful', username: user.username });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});


// Logout route
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Failed to log out" });
    res.clearCookie('connect.sid');
    res.json({ message: "Logged out successfully" });
  });
});

// Cart routes
// Add to Cart Route

app.post('/api/cart/add', async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.userId; // Fetch userId from session


 

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  if (!productId) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  try {
    await addItemToCart(userId, productId);
    const cartItems = await getCartItems(userId);
    res.status(201).json({ cartCount: cartItems.length });
  } catch (error) {
    console.error('Error adding item to cart:', error.message);
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});



// Fetch Cart Items
app.get('/api/cart', async (req, res) => {
  console.log('Fetching cart items for user:', req.session.userId); // Log session user ID
  try {
    const cartItems = await getCartItems(req.session.userId);
    console.log('Cart items fetched:', cartItems); // Log fetched cart items
    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ message: 'Error fetching cart items' });
  }
});



app.get('/api/cart/count', async (req, res) => {
  try {
    const cartItems = await getCartItems(req.session.userId);
    res.json({ count: cartItems.length });
  } catch (error) {
    console.error('Error fetching cart count:', error.message);
    res.status(500).json({ message: 'Failed to fetch cart count' });
  }
});


// Checkout Route
app.post('/api/checkout', async (req, res) => {
  try {
    const { message, orderId } = await checkoutCart(req.session.userId);
    res.json({ message, orderId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/cart/remove', async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.userId;

  try {
    await removeItemFromCart(userId, productId);
    const cartItems = await getCartItems(userId);
    res.json({ message: 'Item removed successfully', cartCount: cartItems.length });
  } catch (error) {
    console.error('Error removing item from cart:', error.message);
    res.status(500).json({ message: 'Failed to remove item from cart' });
  }
});

app.post('/api/cart/update', async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.session.userId;

  console.log(`Updating product ${productId} to quantity ${quantity} for user ${userId}`);

  try {
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required.' });
    }

    await updateCartItemQuantity(userId, productId, quantity);
    res.json({ message: 'Quantity updated successfully.' });
  } catch (error) {
    console.error('Error updating cart quantity:', error.message);
    res.status(500).json({ message: 'Failed to update cart quantity.' });
  }
});






// Product routes
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/api/products', async (req, res) => {
  try {
    const { search, category, price, availability } = req.query;
    const products = await getProducts({ search, category, price, availability });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/products', upload.single('image_file'), async (req, res) => {
  try {
    const { name, original_price, discounted_price, category, stock, image_url, extra_images } = req.body;
    const product = await saveProductToDatabase({
      name, original_price, discounted_price, category, stock, 
      mainImageUrl: image_url, additionalImages: JSON.parse(extra_images || '[]')
    });
    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Error saving product', error: error.message });
  }
});

app.put('/api/products/:id', upload.single('image_file'), async (req, res) => {
  try {
    const { name, original_price, discounted_price, category, stock, image_url, extra_images } = req.body;
    const product = await updateProductInDatabase(req.params.id, {
      name, original_price, discounted_price, category, stock, 
      mainImageUrl: image_url, additionalImages: JSON.parse(extra_images || '[]')
    });
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await deleteProductFromDatabase(req.params.id);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

// Review routes
app.get('/api/products/:id/reviews', isAuthenticated, async (req, res) => {
  try {
    const reviews = await getProductReviews(req.params.id);
    if (!reviews || reviews.length === 0) return res.status(404).json({ message: 'No reviews found for this product.' });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

app.post('/api/products/:id/reviews', isAuthenticated, async (req, res) => {
  try {
    const { rating, comment_text } = req.body;
    const review = await supabase.from('comments').insert([
      { product_id: req.params.id, user_id: req.session.userId, rating, comment_text }
    ]);
    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    console.error('Error submitting review:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve static files
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.use('/styles', express.static(path.join(__dirname, '../frontend/styles')));
app.use('/admin_settings', express.static(path.join(__dirname, '../frontend/admin_settings')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin_settings')));
app.get('/product.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/product.html')));

// HTML Routing via pagesRouter
app.use('/', pagesRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
 