const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveControllers');
const { requireAuth, requireManager } = require('../middleware/authMiddleware');

// Apply auth middleware to all leave routes
router.use(requireAuth);
// Apply for leave
router.post('/apply', leaveController.createLeaveApplication);

// Get all leave applications (for HR/admin)
router.use(requireAuth);
router.get('/applications', leaveController.getAllLeaveApplications);

// Get leave applications for a specific employee
router.get('/employee/:employeeId', leaveController.getEmployeeLeaves);

// Get a single leave application by ID
router.get('/application/:id', leaveController.getLeaveApplication);

// Update leave application status (approve/reject)
router.put('/application/:id', leaveController.updateLeaveStatus);

// Delete a leave application
router.delete('/application/:id', leaveController.deleteLeaveApplication);

// Get leave statistics for dashboard
router.get('/statistics', leaveController.getLeaveStatistics);

module.exports = router;