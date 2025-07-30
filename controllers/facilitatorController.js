const { Facilitator, User, Manager } = require('../models'); 

/**
 * @swagger
 * /api/facilitators:
 * get:
 * summary: Retrieve all facilitators
 * description: Managers can view all facilitators.
 * tags:
 * - Facilitators
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of facilitators.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Facilitators fetched successfully' }
 * count: { type: 'integer', example: 1 }
 * facilitators:
 * type: array
 * items:
 * type: object
 * properties:
 * id: { type: 'string', format: 'uuid' }
 * name: { type: 'string' }
 * qualification: { type: 'string' }
 * location: { type: 'string' }
 * User: { $ref: '#/components/schemas/User' }
 * Manager: { $ref: '#/components/schemas/Manager' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can view facilitators.
 * 500:
 * description: Server error.
 */
exports.getAllFacilitators = async (req, res) => {
  try {
    let whereClause = {}; 
    let includeClause = [ 
      { model: User, attributes: ['id', 'email', 'role'] },
      { model: Manager, attributes: ['id', 'name'] },
    ];

    const facilitators = await Facilitator.findAll({
      where: whereClause,
      include: includeClause,
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      message: 'Facilitators fetched successfully',
      count: facilitators.length,
      facilitators,
    });
  } catch (error) {
    console.error('Error fetching facilitators:', error);
    res.status(500).json({ message: 'Server error fetching facilitators.' });
  }
};

/**
 * @swagger
 * /api/facilitators/{id}:
 * get:
 * summary: Retrieve a single facilitator by ID
 * description: Managers can view any facilitator. Facilitators can only view their own profile.
 * tags:
 * - Facilitators
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the facilitator to retrieve.
 * responses:
 * 200:
 * description: A single facilitator object.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * facilitator:
 * type: object
 * properties:
 * id: { type: 'string', format: 'uuid' }
 * name: { type: 'string' }
 * qualification: { type: 'string' }
 * location: { type: 'string' }
 * User: { $ref: '#/components/schemas/User' }
 * Manager: { $ref: '#/components/schemas/Manager' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. You can only view your own facilitator profile.
 * 404:
 * description: Facilitator not found.
 * 500:
 * description: Server error.
 */
exports.getFacilitatorById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: currentUserId } = req.user;

    const facilitator = await Facilitator.findByPk(id, {
      include: [
        { model: User, attributes: ['id', 'email', 'role'] },
        { model: Manager, attributes: ['id', 'name'] },
      ],
    });

    if (!facilitator) {
      return res.status(404).json({ message: 'Facilitator not found.' });
    }

    // Facilitators can only view their own profile
    if (role === 'facilitator' && facilitator.userId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own facilitator profile.' });
    }

    res.status(200).json({ facilitator });
  } catch (error) {
    console.error('Error fetching facilitator by ID:', error);
    res.status(500).json({ message: 'Server error fetching facilitator.' });
  }
};

/**
 * @swagger
 * /api/facilitators/{id}:
 * put:
 * summary: Update an existing facilitator's details
 * description: Managers can update any facilitator. Facilitators can only update their own name, qualification, and location.
 * tags:
 * - Facilitators
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the facilitator to update.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * name:
 * type: string
 * description: New name of the facilitator.
 * example: "Jane Doe"
 * qualification:
 * type: string
 * description: New qualification of the facilitator.
 * example: "Ph.D. in Computer Science"
 * location:
 * type: string
 * description: New location of the facilitator.
 * example: "Kigali, Rwanda"
 * managerId:
 * type: string
 * format: uuid
 * description: (Manager only) New manager ID for the facilitator.
 * example: "e1f2g3h4-i5j6-7890-1234-567890abcdef"
 * responses:
 * 200:
 * description: Facilitator updated successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Facilitator updated successfully' }
 * facilitator: { $ref: '#/components/schemas/Facilitator' }
 * 400:
 * description: Bad request (e.g., invalid input).
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. User does not have permission to update this profile.
 * 404:
 * description: Facilitator or new manager not found.
 * 500:
 * description: Server error.
 */
exports.updateFacilitator = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, qualification, location, managerId } = req.body;
    const { role, id: currentUserId } = req.user;

    const facilitator = await Facilitator.findByPk(id);
    if (!facilitator) {
      return res.status(404).json({ message: 'Facilitator not found.' });
    }

    //  Facilitators can only update their own profile
    if (role === 'facilitator' && facilitator.userId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own facilitator profile.' });
    }

    // If managerId is being updated, ensure the new manager exists
    if (managerId) {
        const managerExists = await Manager.findByPk(managerId);
        if (!managerExists) {
            return res.status(404).json({ message: 'New manager not found.' });
        }
    }

    // Managers can update any facilitator. Facilitators can update their name, qualification, location.
    if (role === 'facilitator') {
        await facilitator.update({
            name: name || facilitator.name,
            qualification: qualification || facilitator.qualification,
            location: location || facilitator.location,
        });
    } else { 
        await facilitator.update({
            name: name || facilitator.name,
            qualification: qualification || facilitator.qualification,
            location: location || facilitator.location,
            managerId: managerId || facilitator.managerId,
        });
    }

    res.status(200).json({
      message: 'Facilitator updated successfully',
      facilitator,
    });
  } catch (error) {
    console.error('Error updating facilitator:', error);
    res.status(500).json({ message: 'Server error updating facilitator.' });
  }
};

/**
 * @swagger
 * /api/facilitators/{id}:
 * delete:
 * summary: Delete a facilitator by ID
 * description: Only managers can delete facilitators.
 * tags:
 * - Facilitators
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the facilitator to delete.
 * responses:
 * 200:
 * description: Facilitator deleted successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Facilitator deleted successfully.' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can delete facilitators.
 * 404:
 * description: Facilitator not found.
 * 500:
 * description: Server error.
 */
exports.deleteFacilitator = async (req, res) => {
  try {
    const { id } = req.params;

    const facilitator = await Facilitator.findByPk(id);
    if (!facilitator) {
      return res.status(404).json({ message: 'Facilitator not found.' });
    }

    await facilitator.destroy();
    res.status(200).json({ message: 'Facilitator deleted successfully.' });
  } catch (error) {
    console.error('Error deleting facilitator:', error);
    res.status(500).json({ message: 'Server error deleting facilitator.' });
  }
};