const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Manager = require('../models/managerModel');
const Facilitator = require('../models/facilitatorModel');
const Student = require('../models/studentModel');
require('dotenv').config();

const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate base input
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role
    });

    // Handle role-specific data
    switch (role) {
      case 'manager':
        if (!req.body.name) {
          return res.status(400).json({ message: 'Manager name is required' });
        }
        await Manager.create({
          name: req.body.name,
          userId: newUser.id
        });
        break;

      case 'facilitator':
        const { name, qualification, location, managerId } = req.body;
        if (!name || !qualification || !location) {
          return res.status(400).json({ message: 'Facilitator name, qualification, and location are required' });
        }
        await Facilitator.create({
          name,
          qualification,
          location,
          managerId,
          userId: newUser.id
        });
        break;

      case 'student':
        const { name: studentName, classId, cohortId } = req.body;
        if (!studentName) {
          return res.status(400).json({ message: 'Student name is required' });
        }
        await Student.create({
          name: studentName,
          classId: classId || null,
          cohortId: cohortId || null,
          userId: newUser.id
        });
        break;

      default:
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Return success response
    res.status(201).json({
      message: `${role} registered successfully`,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN ||'1d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = {
  register,
  login
};
