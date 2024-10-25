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

export default supabase;
