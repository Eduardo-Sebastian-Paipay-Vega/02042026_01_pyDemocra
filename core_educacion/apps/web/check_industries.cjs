const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIndustries() {
    const { data, error } = await supabase.from('cat_industry_types').select('*');
    if (error) {
        console.error('Error fetching industries:', error.message);
    } else {
        console.log('Current industries:', data);
    }
}

checkIndustries();
