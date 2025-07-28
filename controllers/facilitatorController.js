const { Facilitator, User, Manager } = require('../models'); 

// Get all Facilitators
exports.getAllFacilitators = async (req, res) => {
  try {
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

// Get Facilitator by ID
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

// Update a Facilitator
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

// Delete a Facilitator 
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