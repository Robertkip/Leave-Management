const LeaveApplication = require('../models/leaveModel');
const authController = require('../controllers/authController')
// Controller to handle creating a new leave application
exports.createLeaveApplication = async (req, res) => {

  try {
    const { 
      employeeId, 
      employeeName, 
      department, 
      leaveType, 
      startDate, 
      endDate, 
      reason, 
      contactDuringLeave 
    } = req.body;

    const user = req.user;

    // Validate required fields
    if (!employeeId || !employeeName || !leaveType || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    // Calculate number of days (excluding weekends for working days calculation)
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate date range
    if (start > end) {
      return res.status(400).json({ 
        success: false, 
        message: 'End date cannot be before start date' 
      });
    }

    let workingDays = 0;
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      // Skip weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create new leave application
    const leaveApplication = new LeaveApplication({
      employeeId,
      employeeName,
      department,
      leaveType,
      startDate,
      endDate,
      reason,
      contactDuringLeave,
      workingDays,
      status: 'Pending', // Default status
      appliedDate: new Date()
    });

    await leaveApplication.save();

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leaveApplication
    });
  } catch (error) {
    console.error('Error in createLeaveApplication:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting leave application',
      error: error.message
    });
  }
};

// Controller to get all leave applications
exports.getAllLeaveApplications = async (req, res) => {
  try {
    const applications = await LeaveApplication.find()
      .sort({ appliedDate: -1 }); // Most recent first
    
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
    const user = req.user;

  } catch (error) {
    console.error('Error in getAllLeaveApplications:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving leave applications',
      error: error.message
    });
  }
};

// Controller to get leave applications by employee ID
exports.getEmployeeLeaves = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const applications = await LeaveApplication.find({ employeeId })
      .sort({ appliedDate: -1 });
    
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Error in getEmployeeLeaves:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving employee leave applications',
      error: error.message
    });
  }
};

// Controller to get a single leave application
exports.getLeaveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await LeaveApplication.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error in getLeaveApplication:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving leave application',
      error: error.message
    });
  }
};

// Controller to update leave application status (for managers/HR)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewedBy, comments } = req.body;
    
    // Validate status
    const validStatuses = ['Approved', 'Rejected', 'Pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be Approved, Rejected, or Pending'
      });
    }
    
    const application = await LeaveApplication.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }
    
    // Update fields
    application.status = status;
    application.reviewedBy = reviewedBy;
    application.reviewDate = new Date();
    application.comments = comments;
    
    await application.save();
    
    res.status(200).json({
      success: true,
      message: `Leave application ${status.toLowerCase()} successfully`,
      data: application
    });
  } catch (error) {
    console.error('Error in updateLeaveStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave application status',
      error: error.message
    });
  }
};

// Controller to delete a leave application
exports.deleteLeaveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await LeaveApplication.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }
    
    // Only allow deletion of pending applications
    if (application.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete applications that have been reviewed'
      });
    }
    
    await LeaveApplication.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Leave application deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteLeaveApplication:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting leave application',
      error: error.message
    });
  }
};

// Controller to get leave statistics for dashboard
exports.getLeaveStatistics = async (req, res) => {
  try {
    // Optional filter by employee ID
    const filter = req.query.employeeId ? { employeeId: req.query.employeeId } : {};
    
    const total = await LeaveApplication.countDocuments(filter);
    const approved = await LeaveApplication.countDocuments({ ...filter, status: 'Approved' });
    const rejected = await LeaveApplication.countDocuments({ ...filter, status: 'Rejected' });
    const pending = await LeaveApplication.countDocuments({ ...filter, status: 'Pending' });
    
    // Get leave distribution by type
    const leaveTypeDistribution = await LeaveApplication.aggregate([
      { $match: filter },
      { $group: { _id: '$leaveType', count: { $sum: 1 } } }
    ]);
    
    // Get leave applications for current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthLeaves = await LeaveApplication.countDocuments({
      ...filter,
      appliedDate: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        total,
        approved,
        rejected,
        pending,
        thisMonthLeaves,
        leaveTypeDistribution
      }
    });
  } catch (error) {
    console.error('Error in getLeaveStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving leave statistics',
      error: error.message
    });
  }
};