  import express from 'express';
  import supabase from './database.js';
  import { getProducts, saveProductToDatabase, updateProductInDatabase, deleteProductFromDatabase } from './database.js';
  import pagesRouter from './pages.js';
  import { getProductById } from './database.js';
  import path from 'path';
  import { fileURLToPath } from 'url';
  import multer from 'multer';
  import jwt from 'jsonwebtoken';
  import { authenticateToken } from './database.js';
  import bcrypt from 'bcrypt';
  import { createUser, getUserByEmail } from './database.js';



  const app = express();
  app.use(express.json());




  //LOGIN AND SIGNUP ROUTES 
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Signup Route
app.post('/api/signup', async (req, res) => {
  const { f_name, l_name, username, address, number, email, password } = req.body;
  console.log('Received signup data:', req.body); // Debugging to ensure username is present

  try {
      const user = await createUser({ f_name, l_name, username, address, number, email, password });
      console.log('User created:', user); // Log the created user

      // Generate JWT token for the user
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      res.status(201).json({ message: 'User created successfully', token });
  } catch (error) {
      console.error('Error during signup:', error.message); // More specific error logging
      res.status(500).json({ message: 'Server error: ' + error.message });
  }
});



// Login Route
// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Include role in the token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: "Login successful", token, username: user.username });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
});




app.get('/product.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/product.html'));
}); 




//ADDING PRODUCTS TO CART
app.post('/api/cart/add', authenticateToken, async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.userId;

  try {
      // Assuming you have a function to add an item to the cart in database.js
      await addToCart(userId, productId);
      res.json({ success: true, message: "Product added to cart" });
  } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ success: false, message: "Server error while adding to cart" });
  }
});


app.get('/api/cart', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const cartItems = await getCartItems(userId);
    res.status(200).json(cartItems);
  } catch (error) {
    console.error('Error fetching cart:', error.message);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
});


app.use('/admin', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only.' });
  }
  next();
});


app.get('/protected-route', authenticateToken, (req, res) => {
  if (req.user.permissions && req.user.permissions.includes('read:protected')) {
    res.json({ message: 'Access granted!' });
  } else {
    res.status(403).json({ message: 'Forbidden: Access denied.' });
  }
});



// Route to get product details by ID
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await getProductById(id); // Uses Supabase
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});





  // Set up __dirname manually
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);



// Serve all static files in the frontend directory
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// Ensure specific MIME type for authdisplay.js
app.get('/frontend/frontend_display_logics/authdisplay.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, '../frontend/frontend_display_logics/authdisplay.js'));
});




  // Static File Serving for CSS and Admin Resources
  app.use('/styles', express.static(path.join(__dirname, '../frontend/styles')));
  app.use('/admin_settings', express.static(path.join(__dirname, '../frontend/admin_settings')));



  // Multer Storage Configuration for Product Images
  const storage = multer.memoryStorage(); // For in-memory storage, adjust if needed for actual storage
  const upload = multer({ storage });

  // Unified API Route for Products CRUD Operations
  app.get('/api/products', async (req, res) => {
    try {
      const { search, category, price, availability } = req.query;
      const products = await getProducts({ search, category, price, availability });
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
  });

  // Add a new product
  app.post('/api/products', upload.single('image_file'), async (req, res) => {
    const { name, original_price, discounted_price, category, stock, image_url, extra_images } = req.body;
    try {
        const product = await saveProductToDatabase({
            name,
            original_price,
            discounted_price,
            category,
            stock,
            mainImageUrl: image_url,
            additionalImages: JSON.parse(extra_images || '[]')
        });
        res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
        res.status(500).json({ message: 'Error saving product', error: error.message });
    }
  });



 // Fetch a single product by ID
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});



  // Update an existing product
  app.put('/api/products/:id', upload.single('image_file'), async (req, res) => {
    const { id } = req.params;
    const { name, original_price, discounted_price, category, stock, image_url, extra_images } = req.body;
    try {
      const product = await updateProductInDatabase(id, {
        name,
        original_price,
        discounted_price,
        category,
        stock,
        mainImageUrl: image_url,
        additionalImages: JSON.parse(extra_images || '[]')
      });
      res.status(200).json({ message: 'Product updated successfully', product });
    } catch (error) {
      res.status(500).json({ message: 'Error updating product', error: error.message });
    }
  });


  // Delete a product
  app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await deleteProductFromDatabase(id);
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
  });





//REVIEWS END POINT

// Add a review
app.get('/api/products/:id/reviews', authenticateToken, async (req, res) => {
  const productId = req.params.id;

  try {
    const reviews = await getProductReviews(productId); // This function uses Supabase
    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: 'No reviews found for this product.' });
    }

    // Send all review data properly formatted
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});



// Fetch reviews
app.get('/api/products/:productId/reviews', async (req, res) => {
  const { productId } = req.params;
  
  try {
      // Get all reviews for the product
      const reviews = await db('comments').where('product_id', productId);
      
      // Calculate the average rating
      const totalReviews = reviews.length;
      const averageRating = totalReviews ? 
          (reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews).toFixed(1) : 0;

      // Calculate the rating breakdown
      const breakdown = [5, 4, 3, 2, 1].reduce((acc, rating) => {
          acc[rating] = reviews.filter(review => review.rating === rating).length;
          return acc;
      }, {});

      res.json({
          averageRating,
          totalReviews,
          breakdown,
          reviews // Optional: Include reviews if you're fetching them together
      });
  } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});



app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
  const { rating, comment_text } = req.body;
  const userId = req.user.userId;
  const productId = req.params.id;

  try {
    const { data, error } = await supabase.from('comments').insert([
      { product_id: productId, user_id: userId, rating, comment_text }
    ]);

    if (error) {
      console.error('Error adding review:', error.message);
      res.status(500).json({ message: 'Failed to add review' });
    } else {
      res.status(201).json({ message: 'Review added successfully', review: data[0] });
    }
  } catch (error) {
    console.error('Error submitting review:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});













  // Serve Main Admin HTML Page for /admin Routes
  app.use('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin_settings/admin.html'));
  });

  // HTML Page Routing via pagesRouter
  app.use('/', pagesRouter);

  // Start the Server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
