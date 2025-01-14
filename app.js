require('dotenv').config();  // Load environment variables from .env
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Set up multer storage (memory storage for file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// MongoDB connection
const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);  // Exit process if connection fails
  });

app.use('/', (req, res)=>{
  return res.status(200).json("Hello Service walah")
})

// Routes
app.use('/api/v1/enquiry', require('./routes/enquiry'));
app.use('/api/v1/auth', require('./routes/auth'));

// Start server
const PORT = process.env.PORT || 8088;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
