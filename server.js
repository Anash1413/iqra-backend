const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');

// Connect to Database
connectDB();
 
const app = express();

// Standard middleware
app.use(cors({
  origin: '*',
  // origin: ["http://localhost:5173","https://iqra-amdara.netlify.app", "http://localhost:5174"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple health-check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'IQRA Foundation API is running smoothly.' });
});

// Bind routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle Multer payload size/type issues
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File is too large! Maximum limit is 5MB.' });
  }

  res.status(500).json({
    success: false,
    message: err.message || 'An internal server error occurred.'
  });
});
   
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port http://localhost:${PORT}`);
});
