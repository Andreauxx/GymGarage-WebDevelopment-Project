const express = require('express');
const pool = require('./database');  // Your database connection
const path = require('path');  // To work with directory paths
const app = express();

// Serve static files from the "public" directory (you can adjust this path if needed)
app.use(express.static(path.join(__dirname, '../')));  // Serve all HTML, CSS, JS from the root

// Route to fetch products (example)
app.get('/api/products', async (req, res) => {
    try {
      const [products] = await pool.query('SELECT * FROM products');
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Error fetching products' });
    }
  });
  app.get("/api/products", async (req, res) => {
    let products = await db.getAllProducts(); // Fetch all products initially
  
    // Filter by search
    if (req.query.search) {
      products = products.filter((product) =>
        product.name.toLowerCase().includes(req.query.search.toLowerCase())
      );
    }
  
    // Filter by category
    if (req.query.category && req.query.category !== "all") {
      products = products.filter((product) => product.category === req.query.category);
    }
  
    // Filter by price
    if (req.query.price) {
      const priceLimit = parseInt(req.query.price, 10);
      products = products.filter((product) => product.original_price <= priceLimit);
    }
  
    // Filter by availability
    if (req.query.availability && req.query.availability !== "all") {
      products = products.filter((product) =>
        req.query.availability === "in-stock" ? product.stock > 0 : product.stock === 0
      );
    }
  
    res.json(products); // Return the filtered products
  });
  
  


// Route to render HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Landing Page/Home.html'));
});

app.get('/shop', (req, res) => {
    res.sendFile(path.join(__dirname, '../Shop/shop.html'));
});

app.get('/plans', (req, res) => {
    res.sendFile(path.join(__dirname, '../Plans/PlansPage.html'));
});

app.get('/coaches', (req, res) => {
    res.sendFile(path.join(__dirname, '../Coaches Page/Coaches.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../About Us/about.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '../Checkout/checkout.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



// Node.js Express route to fetch product data
app.get('/api/product/:id', async (req, res) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);  // Assuming MongoDB or any other DB
  res.json(product);
});
