const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('Database:', mongoose.connection.name);
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
  });