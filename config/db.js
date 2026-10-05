require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  console.error("❌ SUPABASE_URL is missing in .env");
  process.exit(1);
}

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing in .env");
  process.exit(1);
}

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

const connectDB = async () => {
  try {
    const { error } = await supabase
      .from("settings")
      .select("id")
      .limit(1);

    if (error) {
      throw error;
    }

    console.log("Supabase connected successfully ✅");

  } catch (error) {
    console.error(
      `Supabase connection failed ❌: ${error.message}`
    );

    process.exit(1);
  }
};

module.exports = {
  supabase,
  connectDB,
};