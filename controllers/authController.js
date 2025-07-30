const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Manager, Facilitator, Student } = require('../models');
require('dotenv').config();

/**
 * @swagger
 * /api/auth/register:
 * post:
 * summary: Register a new user (Manager, Facilitator, or Student)
 * description: Registers a new user with a specified role and creates their associated profile.
 * tags:
 * - Authentication
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * - role
 * - name
 * properties:
 * email:
 * type: string
 * format: email
 * description: User's email address.
 * example: "newuser@example.com"
 * password:
 * type: string
 * format: password
 * description: User's password.
 * example: "securepassword123"
 * role:
 * type: string
 * enum: [manager, facilitator, student]
 * description: The role of the user.
 * example: "facilitator"
 * name:
 * type: string
 * description: Name of the user (required for all roles).
 * example: "John Doe"
 * qualification:
 * type: string
 * description: (Facilitator only) Facilitator's qualification.
 * example: "MSc in Education"
 * location:
 * type: string
 * description: (Facilitator only) Facilitator's location.
 * example: "New York"
 * managerId:
 * type: string
 * format: uuid
 * description: (Facilitator only) ID of the manager overseeing this facilitator.
 * example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 * classId:
 * type: string
 * format: uuid
 * description: (Student only) ID of the class the student belongs to.
 * example: "b2c3d4e5-f6a7-8901-2345-67890abcdef0"
 * cohortId:
 * type: string
 * format: uuid
 * description: (Student only) ID of the cohort the student belongs to.
 * example: "c3d4e5f6-a7b8-9012-3456-7890abcdef01"
 * responses:
 * 201:
 * description: User registered successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'facilitator registered successfully' }
 * user: { $ref: '#/components/schemas/User' }
 * 400:
 * description: Bad request (e.g., missing required fields, invalid role).
 * 409:
 * description: Conflict. User with this email already exists.
 * 500:
 * description: Server error during registration.
 */
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

/**
 * @swagger
 * /api/auth/login:
 * post:
 * summary: Log in a user
 * description: Authenticates a user with email and password and returns a JWT token.
 * tags:
 * - Authentication
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - email
 * - password
 * properties:
 * email:
 * type: string
 * format: email
 * description: User's email address.
 * example: "user@example.com"
 * password:
 * type: string
 * format: password
 * description: User's password.
 * example: "password123"
 * responses:
 * 200:
 * description: Login successful, returns JWT token and user info.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Login successful' }
 * token:
 * type: string
 * description: JWT authentication token.
 * example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * user: { $ref: '#/components/schemas/User' }
 * 401:
 * description: Unauthorized. Invalid credentials.
 * 404:
 * description: User not found.
 * 500:
 * description: Server error during login.
 */
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