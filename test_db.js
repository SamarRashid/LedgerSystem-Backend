const { connectDB, supabase } = require('./config/db');

async function test() {
  await connectDB();
  const id = '5ba3916a-cbaf-4759-a7f9-c7fb3735daec';
  
  const { data, error } = await supabase.from('customers').select('*').eq('id', id);
  console.log('Result for ID', id, ':', data, error);
  
  // also get all customers to see their IDs
  const { data: all, error: errAll } = await supabase.from('customers').select('id, customer_code');
  console.log('All customers:', all);
  
  process.exit(0);
}

test();
