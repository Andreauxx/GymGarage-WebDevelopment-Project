import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config(); // Make sure this is called at the very top

// Check if environment variables are loading properly
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);

// Use environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export async function getNote(id) {
    const [rows] = await pool.query(`
        SELECT * 
        FROM notes
        WHERE id = ?
        `, [id]);
    return rows;
}

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to fetch products from Supabase
export async function getProducts({ search, category, price, availability }) {
  let query = supabase.from('products').select('*');
  
  console.log('Query before filters:', query); // Log the query object

  // Apply filters
  if (search) {
    console.log('Applying search filter:', search); // Log search filter
    query = query.ilike('name', `%${search}%`);
  }
  if (category && category !== 'all') {
    console.log('Applying category filter:', category); // Log category filter
    query = query.eq('category', category);
  }
  if (price) {
    console.log('Applying price filter:', price); // Log price filter
    query = query.lte('original_price', price);
  }
  if (availability === 'in-stock') {
    console.log('Applying availability filter: in-stock');
    query = query.gt('stock', 0);
  }
  if (availability === 'out-of-stock') {
    console.log('Applying availability filter: out-of-stock');
    query = query.eq('stock', 0);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching products from Supabase:', error); // Log any errors
    throw new Error(error.message);
  }
  
  console.log('Products fetched from Supabase:', data); // Log fetched products
  return data;
}



// Example database insert function for adding product and images
// database.js
export async function saveProductToDatabase({ name, original_price, discounted_price, category, stock, mainImageUrl, additionalImages }) {
  const { data: product, error: productError } = await supabase
      .from('products')
      .insert([{ name, original_price, discounted_price, category, stock, image_url: mainImageUrl }])
      .select();

  if (productError) {
      console.error("Error saving product to database:", productError);
      throw productError;
  }

  const productId = product[0].id;
  if (additionalImages.length > 0) {
      const imageRecords = additionalImages.map(url => ({ product_id: productId, image_url: url }));
      const { error: imageError } = await supabase.from('product_images').insert(imageRecords);
      if (imageError) {
          console.error("Error saving additional images:", imageError);
          throw imageError;
      }
  }

  return product[0];
}



export async function updateProductInDatabase(id, { name, original_price, discounted_price, category, stock, mainImageUrl, additionalImages }) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .update({ 
      name, 
      original_price, 
      discounted_price, 
      category, 
      stock, 
      image_url: mainImageUrl 
    })
    .eq('id', id)
    .select();

  if (productError) {
    console.error("Error updating product in database:", productError);
    throw productError;
  }

  // Handle additional images (optional)
  if (additionalImages.length > 0) {
    // First, remove existing additional images
    await supabase.from('product_images').delete().eq('product_id', id);
    
    const imageRecords = additionalImages.map(url => ({ product_id: id, image_url: url }));
    const { error: imageError } = await supabase.from('product_images').insert(imageRecords);
    
    if (imageError) {
      console.error("Error saving additional images:", imageError);
      throw imageError;
    }
  }

  return product[0];
}


export default supabase;
