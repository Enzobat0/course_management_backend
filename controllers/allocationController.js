const { Allocation, Module, Class, Facilitator, Mode, User } = require('../models'); 
// Create Allocation
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

    // --- Role-based Access Control for Viewing ---
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

// Get Allocation by ID
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

// Update Allocation
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

// Delete Allocation
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