const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
// Load env vars
dotenv.config();
// Connect to database
connectDB();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes ...
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/schools', require('./routes/schoolRoutes'));
app.use('/api/admin/classes', require('./routes/classRoutes'));
app.use('/api/academic/teachers', require('./routes/teacherRoutes'));
app.use('/api/academic', require('./routes/academicRoutes'));
app.use('/api/super-admin', require('./routes/superAdminRoutes'));

// API v1 Routes
app.use('/api/v1/school', require('./routes/schoolProfileRoutes'));

// Student Management Routes (Admin)
app.use('/api/admin/students', require('./routes/studentRoutes'));

// Student App Routes (Student-facing)
app.use('/api/v1/student', require('./routes/studentAppRoutes'));

// Teacher App Routes (Teacher-facing)
app.use('/api/v1/teacher', require('./routes/teacherAppRoutes'));

// Admin App Routes (Admin-facing)
app.use('/api/v1/admin', require('./routes/adminAppRoutes'));

// Parent App Routes (Parent-facing)
app.use('/api/v1/parent', require('./routes/parentAppRoutes'));

// Staff HR (Admin)
app.use('/api/v1/staff', require('./routes/staffHrRoutes'));

// Transport (Admin)
app.use('/api/v1/transport', require('./routes/transportRoutes'));

// Fees Management (Admin - fee heads, rules, dashboard)
app.use('/api/v1/fees', require('./routes/feesManagementRoutes'));

// LMS (Admin)
app.use('/api/v1/lms', require('./routes/lmsRoutes'));

// Marketing (Super Admin / public leads)
app.use('/api/v1/marketing', require('./routes/marketingRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});


// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
