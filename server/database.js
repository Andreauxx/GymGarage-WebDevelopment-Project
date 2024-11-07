import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Load environment variables from .env file
dotenv.config();

// Initialize the Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);






export async function createUser({ f_name, l_name, username, address, number, email, password }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Attempting to create user with hashed password:', hashedPassword);

  const { data, error } = await supabase
      .from('users')
      .insert([{ f_name, l_name, username, address, number, email, password: hashedPassword }]) // Ensure username is included
      .select();

  if (error) {
      console.error('Supabase error while creating user:', error.message);
      throw new Error('Error creating user in database: ' + error.message);
  }

  console.log('User created successfully:', data);
  return data[0];
}


// Function to get a user by email for login
export async function getUserByEmail(email) {
  const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

  if (error) {
      throw new Error(error.message);
  }

  return data;
}


export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    next();
  });
}





//Adding Products to the Database - Cart
export async function addToCart(userId, productId, quantity) {
  const { data, error } = await supabase
    .from('cart')
    .upsert({ user_id: userId, product_id: productId, quantity })
    .select();

  if (error) {
    console.error('Error adding to cart:', error.message);
    throw new Error('Error adding to cart');
  }

  return data[0];
}

export async function getCartItems(userId) {
  const { data, error } = await supabase
    .from('cart')
    .select('*, products(name, original_price, discounted_price, image_url)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching cart items:', error.message);
    throw new Error('Error fetching cart items');
  }

  return data;
}


// Fetch single product details by ID
export async function getProductById(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(image_url)')
    .eq('id', productId)
    .single();

  if (error) {
    console.error("Error fetching product by ID:", error.message);
    throw new Error('Error fetching product details');
  }

  return data;
}

// Fetch reviews for a specific product
export async function getProductReviews(productId) {
  const query = `
    SELECT comments.*, users.username 
    FROM comments
    JOIN users ON comments.user_id = users.id
    WHERE product_id = $1
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query, [productId]);
  return rows;
}











// Function to fetch products from Supabase with filters
export async function getProducts({ search, category, price, availability }) {
  let query = supabase.from('products').select('*');

  // Apply filters
  if (search) query = query.ilike('name', `%${search}%`); // Case-insensitive search
  if (category && category !== 'all') query = query.eq('category', category);
  if (price) query = query.lte('discounted_price', price); // Use price filter for discounted price
  if (availability) {
    query = availability === 'in-stock' 
      ? query.gt('stock', 0) 
      : query.eq('stock', 0); // Handle stock availability
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching products:', error.message);
    throw error;
  }

  return data;
}


// Function to add a new product and images to Supabase
export async function saveProductToDatabase({ name, original_price, discounted_price, category, stock, mainImageUrl, additionalImages = [] }) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([{ name, original_price, discounted_price, category, stock, image_url: mainImageUrl }])
    .select();

  if (productError) {
    console.error("Error saving product:", productError.message);
    throw productError;
  }

  const productId = product[0].id;
  if (additionalImages.length > 0) {
    const imageRecords = additionalImages.map(url => ({ product_id: productId, image_url: url }));
    const { error: imageError } = await supabase.from('product_images').insert(imageRecords);
    if (imageError) {
      console.error("Error saving additional images:", imageError.message);
      throw imageError;
    }
  }

  return product[0];
}

// Function to update a product and its images in Supabase
export async function updateProductInDatabase(id, { name, original_price, discounted_price, category, stock, mainImageUrl, additionalImages = [] }) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .update({ name, original_price, discounted_price, category, stock, image_url: mainImageUrl })
    .eq('id', id)
    .select();

  if (productError) {
    console.error("Error updating product:", productError.message);
    throw productError;
  }

  // Replace additional images if any are provided
  if (additionalImages.length > 0) {
    await supabase.from('product_images').delete().eq('product_id', id);
    const imageRecords = additionalImages.map(url => ({ product_id: id, image_url: url }));
    const { error: imageError } = await supabase.from('product_images').insert(imageRecords);
    if (imageError) {
      console.error("Error updating images:", imageError.message);
      throw imageError;
    }
  }

  return product[0];
}

// Function to delete a product by ID, including associated images
export async function deleteProductFromDatabase(id) {
  const { error: imageError } = await supabase.from('product_images').delete().eq('product_id', id);
  if (imageError) {
    console.error("Error deleting product images:", imageError.message);
    throw imageError;
  }

  const { error: productError } = await supabase.from('products').delete().eq('id', id);
  if (productError) {
    console.error("Error deleting product:", productError.message);
    throw productError;
  }

  return { message: 'Product deleted successfully' };
}

export default supabase;
