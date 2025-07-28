const { Module } = require('../models'); 

// Create a new Module
exports.createModule = async (req, res) => {
  try {
    const { name, half } = req.body;

    if (!name || !half) {
      return res.status(400).json({ message: 'Module name and half (intake) are required.' });
    }

    //  Check for existing module name to prevent duplicates
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

// Get all Modules
exports.getAllModules = async (req, res) => {
  try {
    const modules = await Module.findAll({
      where: whereClause,
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

// Get Module by ID
exports.getModuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const module = await Module.findByPk(id);

    if (!module) {
      return res.status(404).json({ message: 'Module not found.' });
    }

    res.status(200).json({ module });
  } catch (error) {
    console.error('Error fetching module by ID:', error);
    res.status(500).json({ message: 'Server error fetching module.' });
  }
};

// Update a Module
exports.updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, half } = req.body;

    const module = await Module.findByPk(id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found.' });
    }

    await module.update({
      name: name || module.name,
      half: half || module.half,
    });

    res.status(200).json({
      message: 'Module updated successfully',
      module,
    });
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ message: 'Server error updating module.' });
  }
};

// Delete a Module
exports.deleteModule = async (req, res) => {
  try {
    const { id } = req.params;

    const module = await Module.findByPk(id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found.' });
    }

    await module.destroy();
    res.status(200).json({ message: 'Module deleted successfully.' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Server error deleting module.' });
  }
};