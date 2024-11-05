import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize the Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to fetch products from Supabase with filters
export async function getProducts({ search, category, price, availability }) {
  let query = supabase.from('products').select('*');

  // Apply filters
  if (search) query = query.ilike('name', `%${search}%`);
  if (category && category !== 'all') query = query.eq('category', category);
  if (price) query = query.lte('original_price', price);
  if (availability) {
    query = availability === 'in-stock' ? query.gt('stock', 0) : query.eq('stock', 0);
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
