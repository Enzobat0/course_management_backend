const { Module } = require('../models'); 

/**
 * @swagger
 * /api/modules:
 * post:
 * summary: Create a new module (course)
 * description: Only managers can create new modules.
 * tags:
 * - Modules
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
 * - half
 * properties:
 * name:
 * type: string
 * description: Name of the module (course).
 * example: "Mathematics 101"
 * half:
 * type: string
 * description: Intake period (e.g., HT1, HT2, FT).
 * example: "HT1"
 * responses:
 * 201:
 * description: Module created successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Module created successfully' }
 * module: { $ref: '#/components/schemas/Module' }
 * 400:
 * description: Bad request (e.g., missing required fields).
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can create modules.
 * 409:
 * description: Conflict. Module with this name already exists.
 * 500:
 * description: Server error.
 */
exports.createModule = async (req, res) => {
  try {
    const { name, half } = req.body;

    if (!name || !half) {
      return res.status(400).json({ message: 'Module name and half (intake) are required.' });
    }

    
    const existingModule = await Module.findOne({ where: { name } });
    if (existingModule) {
      return res.status(409).json({ message: 'Module with this name already exists.' });
    }

    const newModule = await Module.create({ name, half });
    res.status(201).json({
      message: 'Module created successfully',
      module: newModule,
    });
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ message: 'Server error creating module.' });
  }
};

/**
 * @swagger
 * /api/modules:
 * get:
 * summary: Retrieve all modules (courses)
 * description: Managers can view all modules.
 * tags:
 * - Modules
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of modules.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Modules fetched successfully' }
 * count: { type: 'integer', example: 1 }
 * modules:
 * type: array
 * items:
 * $ref: '#/components/schemas/Module'
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can view modules.
 * 500:
 * description: Server error.
 */
exports.getAllModules = async (req, res) => {
  try {
    const modules = await Module.findAll({
      order: [['name', 'ASC']], 
    });

    res.status(200).json({
      message: 'Modules fetched successfully',
      count: modules.length,
      modules,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Server error fetching modules.' });
  }
};

/**
 * @swagger
 * /api/modules/{id}:
 * get:
 * summary: Retrieve a single module by ID
 * description: Managers can view any module by its ID.
 * tags:
 * - Modules
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the module to retrieve.
 * responses:
 * 200:
 * description: A single module object.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * module: { $ref: '#/components/schemas/Module' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can view modules.
 * 404:
 * description: Module not found.
 * 500:
 * description: Server error.
 */
exports.getModuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const moduleItem = await Module.findByPk(id);

    if (!moduleItem) {
      return res.status(404).json({ message: 'Module not found.' });
    }

    res.status(200).json({ module: moduleItem });
  } catch (error) {
    console.error('Error fetching module by ID:', error);
    res.status(500).json({ message: 'Server error fetching module.' });
  }
};

/**
 * @swagger
 * /api/modules/{id}:
 * put:
 * summary: Update an existing module
 * description: Only managers can update modules.
 * tags:
 * - Modules
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the module to update.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * name:
 * type: string
 * description: New name of the module.
 * example: "Advanced Mathematics"
 * half:
 * type: string
 * description: New intake period.
 * example: "FT"
 * responses:
 * 200:
 * description: Module updated successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Module updated successfully' }
 * module: { $ref: '#/components/schemas/Module' }
 * 400:
 * description: Bad request (e.g., invalid input).
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can update modules.
 * 404:
 * description: Module not found.
 * 500:
 * description: Server error.
 */
exports.updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, half } = req.body;

    const moduleItem = await Module.findByPk(id);
    if (!moduleItem) {
      return res.status(404).json({ message: 'Module not found.' });
    }

    await moduleItem.update({
      name: name || moduleItem.name,
      half: half || moduleItem.half,
    });

    res.status(200).json({
      message: 'Module updated successfully',
      module: moduleItem,
    });
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ message: 'Server error updating module.' });
  }
};

/**
 * @swagger
 * /api/modules/{id}:
 * delete:
 * summary: Delete a module by ID
 * description: Only managers can delete modules.
 * tags:
 * - Modules
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the module to delete.
 * responses:
 * 200:
 * description: Module deleted successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Module deleted successfully.' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can delete modules.
 * 404:
 * description: Module not found.
 * 500:
 * description: Server error.
 */
exports.deleteModule = async (req, res) => {
  try {
    const { id } = req.params;

    const moduleItem = await Module.findByPk(id);
    if (!moduleItem) {
      return res.status(404).json({ message: 'Module not found.' });
    }

    await moduleItem.destroy();
    res.status(200).json({ message: 'Module deleted successfully.' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Server error deleting module.' });
  }
};
