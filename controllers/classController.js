const { Class } = require('../models'); 

// Create a new Class
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

// Get all Classes 
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

// Get Class by ID
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

// Update a Class
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

// Delete a Class
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