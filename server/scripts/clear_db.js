// Safe clear DB script. Requires CONFIRM=YES env var to actually delete.
require('dotenv').config();
const mongoose = require('mongoose');
(async ()=>{
  if(process.env.CONFIRM !== 'YES'){
    console.log('This script will delete collections. To run: set CONFIRM=YES and re-run. Aborting.');
    process.exit(1);
  }
  const uri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
  if(!uri){ console.error('MONGODB_URI or MONGODB_ATLAS_URI not set in .env'); process.exit(1); }
  try{
    await mongoose.connect(uri, { useNewUrlParser:true, useUnifiedTopology:true });
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    const toDrop = ['products','orders','users','notifications','carts','wishlists'];
    for(const name of toDrop){
      try{
        const exists = (await db.listCollections({ name }).toArray()).length > 0;
        if(exists){ await db.collection(name).drop(); console.log('Dropped collection:', name); } else { console.log('No collection:', name); }
      }catch(e){ console.error('Error dropping', name, e.message); }
    }
    console.log('Done.');
    process.exit(0);
  }catch(e){ console.error('DB error', e); process.exit(2); }
})();
