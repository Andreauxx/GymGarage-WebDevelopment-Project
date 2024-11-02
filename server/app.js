import express from 'express';
import { getProducts } from './database.js'; // Assuming you export the function from database.js
import pagesRouter from './pages.js'; // Import the router for serving HTML pages
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const storage = multer.memoryStorage(); // Or configure a disk storage
const upload = multer({ storage });










const app = express();
app.use(express.json());



// Unified Product Route
app.post('/api/products', upload.single('image_file'), async (req, res) => {
  const { name, original_price, discounted_price, category, stock, image_url, extra_images } = req.body;
  const imageFile = req.file;
  let mainImageUrl = image_url;
  
  try {
    const product = await saveProductToDatabase({
      name,
      original_price,
      discounted_price,
      category,
      stock,
      mainImageUrl,
      additionalImages: JSON.parse(extra_images || '[]')
    });
    res.status(201).json({ message: "Product added successfully", product });
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ message: "Error saving product", error: error.message });
  }
});

// PUT route for updating a product
app.put('/api/products/:id', upload.single('image_file'), async (req, res) => {
  const { id } = req.params;
  const { name, original_price, discounted_price, category, stock, image_url, extra_images } = req.body;
  const imageFile = req.file;
  let mainImageUrl = image_url;
  
  try {
    const product = await updateProductInDatabase(id, {
      name,
      original_price,
      discounted_price,
      category,
      stock,
      mainImageUrl,
      additionalImages: JSON.parse(extra_images || '[]')
    });
    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
});

// Set up __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Use the pagesRouter for handling HTML routes
app.use('/', pagesRouter);

// API to fetch filtered products
app.get('/api/products', async (req, res) => {
  try {
    const { search, category, price, availability } = req.query;
    console.log('Fetching products with filters:', { search, category, price, availability });
    
    const products = await getProducts({ search, category, price, availability });
    
    console.log('Products Fetched from Supabase:', products); // Log the fetched products
    
    res.json(products); // Return the filtered products
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});


// API Route: Add a New Product
app.post('/api/products', async (req, res) => {
  const { name, description, original_price, discounted_price, category, stock, images } = req.body;
  try {
      const { data: product, error: productError } = await supabase
          .from('products')
          .insert([{ name, description, original_price, discounted_price, category, stock }])
          .select();

      if (productError) throw productError;

      if (images && images.length > 0) {
          const imageEntries = images.map((image_url) => ({
              product_id: product[0].id,
              image_url
          }));
          const { error: imageError } = await supabase
              .from('product_images')
              .insert(imageEntries);

          if (imageError) throw imageError;
      }

      res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
      res.status(500).json({ message: 'Error adding product', error: error.message });
  }
});

// API Route: Edit an Existing Product
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, original_price, discounted_price, category, stock, images } = req.body;
  try {
      const { data: product, error: productError } = await supabase
          .from('products')
          .update({ name, description, original_price, discounted_price, category, stock })
          .eq('id', id)
          .select();

      if (productError) throw productError;

      if (images && images.length > 0) {
          await supabase.from('product_images').delete().eq('product_id', id);
          const imageEntries = images.map((image_url) => ({ product_id: id, image_url }));
          const { error: imageError } = await supabase.from('product_images').insert(imageEntries);

          if (imageError) throw imageError;
      }

      res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
      res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// API Route: Delete a Product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
      res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});




// Serve the main admin SPA HTML file for all /admin routes
app.use('/styles', express.static(path.join(__dirname, '../frontend/styles')));
app.use('/admin_settings', express.static(path.join(__dirname, '../frontend/admin_settings')));

// Serve static files for CSS and admin resources
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin_settings/admin.html'));
});



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
