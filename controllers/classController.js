const { Class } = require('../models'); 

/**
 * @swagger
 * /api/classes:
 * post:
 * summary: Create a new class
 * description: Only managers can create new classes.
 * tags:
 * - Classes
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * - startDate
 * - graduationDate
 * properties:
 * name:
 * type: string
 * description: Name of the class (e.g., "J2023", "M2024S").
 * example: "2025J"
 * startDate:
 * type: string
 * format: date-time
 * description: Start date of the class.
 * example: "2025-01-10T00:00:00Z"
 * graduationDate:
 * type: string
 * format: date-time
 * description: Graduation date of the class.
 * example: "2025-06-10T00:00:00Z"
 * responses:
 * 201:
 * description: Class created successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Class created successfully' }
 * class: { $ref: '#/components/schemas/Class' }
 * 400:
 * description: Bad request (e.g., missing required fields).
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can create classes.
 * 409:
 * description: Conflict. Class with this name already exists.
 * 500:
 * description: Server error.
 */
exports.createClass = async (req, res) => {
  try {
    const { name, startDate, graduationDate } = req.body;

    if (!name || !startDate || !graduationDate) {
      return res.status(400).json({ message: 'Class name, start date, and graduation date are required.' });
    }

    //Check for existing class name to prevent duplicates
    const existingClass = await Class.findOne({ where: { name } });
    if (existingClass) {
      return res.status(409).json({ message: 'Class with this name already exists.' });
    }

    const newClass = await Class.create({ name, startDate, graduationDate });
    res.status(201).json({
      message: 'Class created successfully',
      class: newClass,
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Server error creating class.' });
  }
};

/**
 * @swagger
 * /api/classes:
 * get:
 * summary: Retrieve all classes
 * description: Managers can view all classes.
 * tags:
 * - Classes
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of classes.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Classes fetched successfully' }
 * count: { type: 'integer', example: 1 }
 * classes:
 * type: array
 * items:
 * $ref: '#/components/schemas/Class'
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can view classes.
 * 500:
 * description: Server error.
 */
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.findAll({
      order: [['name', 'ASC']], 
    });

    res.status(200).json({
      message: 'Classes fetched successfully',
      count: classes.length,
      classes,
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Server error fetching classes.' });
  }
};

/**
 * @swagger
 * /api/classes/{id}:
 * get:
 * summary: Retrieve a single class by ID
 * description: Managers can view any class by its ID.
 * tags:
 * - Classes
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the class to retrieve.
 * responses:
 * 200:
 * description: A single class object.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * class: { $ref: '#/components/schemas/Class' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can view classes.
 * 404:
 * description: Class not found.
 * 500:
 * description: Server error.
 */
exports.getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classItem = await Class.findByPk(id); 

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    res.status(200).json({ class: classItem });
  } catch (error) {
    console.error('Error fetching class by ID:', error);
    res.status(500).json({ message: 'Server error fetching class.' });
  }
};

/**
 * @swagger
 * /api/classes/{id}:
 * put:
 * summary: Update an existing class
 * description: Only managers can update classes.
 * tags:
 * - Classes
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the class to update.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * name:
 * type: string
 * description: New name of the class.
 * example: "2025M"
 * startDate:
 * type: string
 * format: date-time
 * description: New start date of the class.
 * example: "2025-07-01T00:00:00Z"
 * graduationDate:
 * type: string
 * format: date-time
 * description: New graduation date of the class.
 * example: "2025-12-01T00:00:00Z"
 * responses:
 * 200:
 * description: Class updated successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Class updated successfully' }
 * class: { $ref: '#/components/schemas/Class' }
 * 400:
 * description: Bad request (e.g., invalid date format).
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can update classes.
 * 404:
 * description: Class not found.
 * 500:
 * description: Server error.
 */
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, graduationDate } = req.body;

    const classItem = await Class.findByPk(id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    await classItem.update({
      name: name || classItem.name,
      startDate: startDate || classItem.startDate,
      graduationDate: graduationDate || classItem.graduationDate,
    });

    res.status(200).json({
      message: 'Class updated successfully',
      class: classItem,
    });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ message: 'Server error updating class.' });
  }
};

/**
 * @swagger
 * /api/classes/{id}:
 * delete:
 * summary: Delete a class by ID
 * description: Only managers can delete classes.
 * tags:
 * - Classes
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the class to delete.
 * responses:
 * 200:
 * description: Class deleted successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Class deleted successfully.' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can delete classes.
 * 404:
 * description: Class not found.
 * 500:
 * description: Server error.
 */
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classItem = await Class.findByPk(id);
    if (!classItem) {
      return res.status(404).json({ message: 'Class not found.' });
    }

    await classItem.destroy();
    res.status(200).json({ message: 'Class deleted successfully.' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ message: 'Server error deleting class.' });
  }
};