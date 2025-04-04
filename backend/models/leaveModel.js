
const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    trim: true
  },
  employeeName: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  leaveType: {
    type: String,
    required: [true, 'Leave type is required'],
    enum: ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid', 'Other'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  workingDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: [true, 'Reason for leave is required'],
    trim: true
  },
  contactDuringLeave: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: String,
    trim: true
  },
  reviewDate: {
    type: Date
  },
  comments: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);