  import express from 'express';
  import supabase from './database.js';
  import { getProducts, saveProductToDatabase, updateProductInDatabase, deleteProductFromDatabase } from './database.js';
  import pagesRouter from './pages.js';
  import path from 'path';
  import { fileURLToPath } from 'url';
  import multer from 'multer';
  import jwt from 'jsonwebtoken';
  import bcrypt from 'bcrypt';
  import { createUser, getUserByEmail } from './database.js';



  const app = express();
  app.use(express.json());




  //LOGIN AND SIGNUP ROUTES 
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

  // Signup Route
  app.post('/api/signup', async (req, res) => {
      const { username, email, password } = req.body;
  
      try {
          const existingUser = await getUserByEmail(email);
          if (existingUser) {
              return res.status(400).json({ message: 'Email already in use' });
          }
  
          const user = await createUser({ username, email, password });
          const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  
          res.status(201).json({ message: 'User created successfully', token });
      } catch (error) {
          res.status(500).json({ message: 'Error creating user', error: error.message });
      }
  });
  
  // Login Route
  app.post('/api/login', async (req, res) => {
      const { email, password } = req.body;
  
      try {
          const user = await getUserByEmail(email);
          if (!user) {
              return res.status(404).json({ message: 'User not found' });
          }
  
          const validPassword = await bcrypt.compare(password, user.password);
          if (!validPassword) {
              return res.status(401).json({ message: 'Invalid password' });
          }
  
          const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  
          res.status(200).json({ message: 'Login successful', token });
      } catch (error) {
          res.status(500).json({ message: 'Error logging in', error: error.message });
      }
  });
  
  // Middleware to authenticate requests
  function authenticateToken(req, res, next) {
      const token = req.headers['authorization'];
      if (!token) return res.status(403).json({ message: 'No token provided' });
  
      jwt.verify(token, JWT_SECRET, (err, user) => {
          if (err) return res.status(403).json({ message: 'Failed to authenticate token' });
          req.user = user;
          next();
      });
  }
  
  // Example of a protected route
  app.get('/api/protected', authenticateToken, (req, res) => {
      res.status(200).json({ message: 'This is a protected route', user: req.user });
  });



































  // Set up __dirname manually
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

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
