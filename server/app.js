import express from 'express';
import { getProducts } from './database.js'; // Assuming you export the function from database.js
import pagesRouter from './pages.js'; // Import the router for serving HTML pages

const app = express();
app.use(express.json());

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
