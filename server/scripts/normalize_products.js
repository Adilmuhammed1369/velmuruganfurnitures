require('dotenv').config();
const mongoose = require('mongoose');
(async ()=>{
  const uri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
  if(!uri){ console.error('MONGODB_URI or MONGODB_ATLAS_URI not set in .env'); process.exit(1); }
  try{
    await mongoose.connect(uri, { useNewUrlParser:true, useUnifiedTopology:true });
    console.log('Connected to MongoDB');
    const Product = require('../models/Product');
    const prods = await Product.find().exec();
    console.log('Products total:', prods.length);
    let updated = 0;
    for(const p of prods){
      let modified = false;
      if(!p.img && p.image){ p.img = p.image; modified = true; }
      if(!p.description) { p.description = p.description || ''; /* ensure field exists */ modified = true; }
      // ensure price is string
      if(p.price && typeof p.price !== 'string'){ p.price = String(p.price); modified = true; }
      if(modified){ await p.save(); updated++; }
    }
    console.log('Normalization complete. Updated:', updated);
    process.exit(0);
  }catch(e){ console.error('Error', e); process.exit(2); }
})();
