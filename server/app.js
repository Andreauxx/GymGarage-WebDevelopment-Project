  import express from 'express';
  import supabase from './database.js';
  import { getProducts, saveProductToDatabase, updateProductInDatabase, deleteProductFromDatabase } from './database.js';
  import pagesRouter from './pages.js';
  import path from 'path';
  import { fileURLToPath } from 'url';
  import multer from 'multer';

  const app = express();
  app.use(express.json());

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
