const { Allocation, Module, Class, Facilitator, Mode, User } = require('../models'); 
// Create Allocation
/**
 * @swagger
 * /api/allocations:
 * post:
 * summary: Create a new course allocation
 * description: Only managers can create new course allocations.
 * tags:
 * - Allocations
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - moduleId
 * - classId
 * - facilitatorId
 * - trimester
 * - modeId
 * - year
 * properties:
 * moduleId:
 * type: string
 * format: uuid
 * description: The ID of the module (course).
 * example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 * classId:
 * type: string
 * format: uuid
 * description: The ID of the class.
 * example: "b2c3d4e5-f6a7-8901-2345-67890abcdef0"
 * facilitatorId:
 * type: string
 * format: uuid
 * description: The ID of the facilitator assigned.
 * example: "c3d4e5f6-a7b8-9012-3456-7890abcdef01"
 * trimester:
 * type: integer
 * description: The trimester for the allocation (e.g., 1, 2, 3).
 * example: 1
 * modeId:
 * type: string
 * format: uuid
 * description: The ID of the mode (online/in-person/hybrid).
 * example: "d4e5f6a7-b8c9-0123-4567-890abcdef012"
 * year:
 * type: integer
 * description: The academic year.
 * example: 2025
 * responses:
 * 201:
 * description: Allocation created successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Allocation created successfully' }
 * allocation: { $ref: '#/components/schemas/Allocation' }
 * 400:
 * description: Bad request (e.g., missing required fields).
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can create allocations.
 * 404:
 * description: Referenced module, class, facilitator, or mode not found.
 * 500:
 * description: Server error.
 */
exports.createAllocation = async (req, res) => {
  try {
    const { moduleId, classId, facilitatorId, trimester, modeId, year } = req.body;

    // Basic input validation
    if (!moduleId || !classId || !facilitatorId || !trimester || !modeId || !year) {
      return res.status(400).json({ message: 'All allocation fields are required.' });
    }

    // Check if the referenced entities actually exist
    const [moduleExists, classExists, facilitatorExists, modeExists] = await Promise.all([
      Module.findByPk(moduleId),
      Class.findByPk(classId),
      Facilitator.findByPk(facilitatorId),
      Mode.findByPk(modeId),
    ]);

    if (!moduleExists) return res.status(404).json({ message: 'Module not found.' });
    if (!classExists) return res.status(404).json({ message: 'Class not found.' });
    if (!facilitatorExists) return res.status(404).json({ message: 'Facilitator not found.' });
    if (!modeExists) return res.status(404).json({ message: 'Mode not found.' });


    const newAllocation = await Allocation.create({
      moduleId,
      classId,
      facilitatorId,
      trimester,
      modeId,
      year,
    });

    res.status(201).json({
      message: 'Allocation created successfully',
      allocation: newAllocation,
    });
  } catch (error) {
    console.error('Error creating allocation:', error);
    res.status(500).json({ message: 'Server error during allocation creation.' });
  }
};

// Get All Allocations
/**
 * @swagger
 * /api/allocations:
 * get:
 * summary: Retrieve a list of all allocations or filter them.
 * description: Managers can view all allocations. Facilitators can only view their own assigned allocations.
 * tags:
 * - Allocations
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: trimester
 * schema:
 * type: integer
 * description: Filter by trimester (e.g., 1, 2, 3).
 * - in: query
 * name: facilitatorId
 * schema:
 * type: string
 * format: uuid
 * description: Filter by facilitator ID.
 * - in: query
 * name: modeId
 * schema:
 * type: string
 * format: uuid
 * description: Filter by mode ID.
 * - in: query
 * name: classId
 * schema:
 * type: string
 * format: uuid
 * description: Filter by class ID.
 * - in: query
 * name: year
 * schema:
 * type: integer
 * description: Filter by academic year (e.g., 2024).
 * responses:
 * 200:
 * description: A list of allocations.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Allocations fetched successfully' }
 * count: { type: 'integer', example: 2 }
 * allocations:
 * type: array
 * items:
 * type: object
 * properties:
 * id: { type: 'string', format: 'uuid' }
 * trimester: { type: 'integer' }
 * year: { type: 'integer' }
 * Module: { $ref: '#/components/schemas/Module' }
 * Class: { $ref: '#/components/schemas/Class' }
 * Facilitator: { 
 * type: 'object', 
 * properties: { 
 * id: { type: 'string', format: 'uuid' }, 
 * name: { type: 'string' },
 * qualification: { type: 'string' },
 * location: { type: 'string' },
 * User: { $ref: '#/components/schemas/User' } // Only email is returned for User
 * } 
 * }
 * Mode: { $ref: '#/components/schemas/Mode' }
 * 401:
 * description: Unauthorized. Invalid or missing token.
 * 403:
 * description: Forbidden. Not authorized to view this resource.
 * 404:
 * description: Facilitator profile not found (if role is facilitator).
 * 500:
 * description: Server error.
 */
exports.getAllocations = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const {
      trimester,
      facilitatorId,
      modeId,
      classId, 
      year
    } = req.query;

    let whereClause = {};
    let includeClause = [
      { model: Module, attributes: ['id', 'name', 'half'] }, 
      { model: Class, attributes: ['id', 'name', 'startDate', 'graduationDate'] },
      { model: Facilitator, attributes: ['id', 'qualification', 'location', 'name'], include: [{ model: User, attributes: ['email'] }] },
      { model: Mode, attributes: ['id', 'name'] },
    ];

    // Build where clause based on query parameters
    if (trimester) whereClause.trimester = trimester;
    if (facilitatorId) whereClause.facilitatorId = facilitatorId;
    if (modeId) whereClause.modeId = modeId;
    if (year) whereClause.year = year;
    if (classId) whereClause.classId = classId; 

    // Role-based Access Control for Viewing
    if (role === 'facilitator') {
      // If a facilitator, ensure they only see their own allocations
      const facilitatorProfile = await Facilitator.findOne({ where: { userId } });
      if (!facilitatorProfile) {
        return res.status(404).json({ message: 'Facilitator profile not found for this user.' });
      }
      whereClause.facilitatorId = facilitatorProfile.id; 
    }
    
    const allocations = await Allocation.findAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      message: 'Allocations fetched successfully',
      count: allocations.length,
      allocations,
    });
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ message: 'Server error fetching allocations.' });
  }
};

/**
 * @swagger
 * /api/allocations/{id}:
 * get:
 * summary: Retrieve a single allocation by ID
 * description: Managers can view any allocation. Facilitators can only view their own assigned allocations.
 * tags:
 * - Allocations
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the allocation to retrieve.
 * responses:
 * 200:
 * description: A single allocation object.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * allocation:
 * type: object
 * properties:
 * id: { type: 'string', format: 'uuid' }
 * trimester: { type: 'integer' }
 * year: { type: 'integer' }
 * Module: { $ref: '#/components/schemas/Module' }
 * Class: { $ref: '#/components/schemas/Class' }
 * Facilitator: { 
 * type: 'object', 
 * properties: { 
 * id: { type: 'string', format: 'uuid' }, 
 * name: { type: 'string' },
 * qualification: { type: 'string' },
 * location: { type: 'string' },
 * User: { $ref: '#/components/schemas/User' } 
 * } 
 * }
 * Mode: { $ref: '#/components/schemas/Mode' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. You can only view your own allocations.
 * 404:
 * description: Allocation not found.
 * 500:
 * description: Server error.
 */
exports.getAllocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const allocation = await Allocation.findByPk(id, {
      include: [
        { model: Module, attributes: ['id', 'name', 'half'] },
        { model: Class, attributes: ['id', 'name', 'startDate', 'graduationDate'] },
        { model: Facilitator, attributes: ['id', 'qualification', 'location', 'name'], include: [{ model: User, attributes: ['email'] }] },
        { model: Mode, attributes: ['id', 'name'] },
      ],
    });

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found.' });
    }

    // Facilitator specific access control
    if (role === 'facilitator') {
      const facilitatorProfile = await Facilitator.findOne({ where: { userId } });
      if (!facilitatorProfile || allocation.facilitatorId !== facilitatorProfile.id) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own allocations.' });
      }
    }

    res.status(200).json({ allocation });
  } catch (error) {
    console.error('Error fetching allocation by ID:', error);
    res.status(500).json({ message: 'Server error fetching allocation.' });
  }
};

/**
 * @swagger
 * /api/allocations/{id}:
 * put:
 * summary: Update an existing allocation
 * description: Only managers can update allocations.
 * tags:
 * - Allocations
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the allocation to update.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * moduleId:
 * type: string
 * format: uuid
 * description: The ID of the module (course).
 * example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 * classId:
 * type: string
 * format: uuid
 * description: The ID of the class.
 * example: "b2c3d4e5-f6a7-8901-2345-67890abcdef0"
 * facilitatorId:
 * type: string
 * format: uuid
 * description: The ID of the facilitator assigned.
 * example: "c3d4e5f6-a7b8-9012-3456-7890abcdef01"
 * trimester:
 * type: integer
 * description: The trimester for the allocation (e.g., 1, 2, 3).
 * example: 1
 * modeId:
 * type: string
 * format: uuid
 * description: The ID of the mode (online/in-person/hybrid).
 * example: "d4e5f6a7-b8c9-0123-4567-890abcdef012"
 * year:
 * type: integer
 * description: The academic year.
 * example: 2025
 * responses:
 * 200:
 * description: Allocation updated successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Allocation updated successfully' }
 * allocation: { $ref: '#/components/schemas/Allocation' }
 * 400:
 * description: Bad request (e.g., validation errors).
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden (Only managers can update).
 * 404:
 * description: Allocation not found.
 * 500:
 * description: Server error.
 */
exports.updateAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { moduleId, classId, facilitatorId, trimester, modeId, year } = req.body;

    const allocation = await Allocation.findByPk(id);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found.' });
    }

    // Update fields
    await allocation.update({
      moduleId: moduleId || allocation.moduleId,
      classId: classId || allocation.classId,
      facilitatorId: facilitatorId || allocation.facilitatorId,
      trimester: trimester || allocation.trimester,
      modeId: modeId || allocation.modeId,
      year: year || allocation.year,
    });

    res.status(200).json({
      message: 'Allocation updated successfully',
      allocation,
    });
  } catch (error) {
    console.error('Error updating allocation:', error);
    res.status(500).json({ message: 'Server error updating allocation.' });
  }
};

/**
 * @swagger
 * /api/allocations/{id}:
 * delete:
 * summary: Delete an allocation by ID
 * description: Only managers can delete allocations.
 * tags:
 * - Allocations
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the allocation to delete.
 * responses:
 * 200:
 * description: Allocation deleted successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Allocation deleted successfully.' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden (Only managers can delete).
 * 404:
 * description: Allocation not found.
 * 500:
 * description: Server error.
 */
exports.deleteAllocation = async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await Allocation.findByPk(id);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found.' });
    }

    await allocation.destroy();

    res.status(200).json({ message: 'Allocation deleted successfully.' });
  } catch (error) {
    console.error('Error deleting allocation:', error);
    res.status(500).json({ message: 'Server error deleting allocation.' });
  }
};