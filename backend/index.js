const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const leaveRoutes = require('./Routes/leaveRoute');
//User routes
const userRoutes = require('./Routes/userRoute');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((error) => console.log('MongoDB connection failed: ', error.message));

// Routes
app.use('/api/leave', leaveRoutes);
app.use('/api/user', userRoutes);


// Home route
app.get('/', (req, res) => {
  res.send('Welcome to Leave Application API');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is currently running on port ${PORT}`);
});

