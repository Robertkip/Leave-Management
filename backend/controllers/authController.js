const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Create JWT token
// @param   {String} _id - User ID
// @return  {String} JWT token

const createToken = (_id) => {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
        throw new Error('JWT secret key is not configured');
    }
    return jwt.sign({ _id }, secretKey, { expiresIn: '7d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { employeeId, name, email, password, department, role } = req.body;

        // Validate required fields
        if (!employeeId || !name || !email || !password || !department) {
            return res.status(400).json({
                success: false,
                error: 'Please provide all required fields'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { employeeId }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email or employee ID already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            employeeId,
            name,
            email,
            password: hashedPassword,
            department,
            role: role || 'employee'
        });

        await user.save();

        // Generate token
        const token = createToken(user._id);

        // Send response without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { employeeId, password } = req.body;

        // Validate input
        if (!employeeId || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide employee ID and password'
            });
        }

        // Find user by employeeId
        const user = await User.findOne({ employeeId });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Generate token using the same createToken function
        const token = createToken(user._id);

        // Send response without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};