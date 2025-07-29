const { ActivityTracker, Allocation, Facilitator, User, Module, Class } = require('../models');
const { Op } = require('sequelize'); // Import Op for OR conditions

// Helper function to validate status enum values
const isValidStatus = (status) => ['Done', 'Pending', 'Not Started'].includes(status);

// Create Activity Log
exports.createActivityLog = async (req, res) => {
  try {
    const { allocationId, attendance, weekNumber, formativeOneGrading,
            formativeTwoGrading, summativeGrading, courseModeration,
            intranetSync, gradeBookStatus } = req.body;
    const { role, id: currentUserId } = req.user;

    // Input validation for mandatory fields based on model's allowNull: false
    if (!allocationId || weekNumber === undefined || weekNumber === null ||
        !formativeOneGrading || !formativeTwoGrading || !summativeGrading ||
        !courseModeration || !intranetSync || !gradeBookStatus) {
      return res.status(400).json({ message: 'All required activity log fields (allocationId, weekNumber, and all status fields) must be provided.' });
    }

    // Validate enum statuses
    if (!isValidStatus(formativeOneGrading) || !isValidStatus(formativeTwoGrading) ||
        !isValidStatus(summativeGrading) || !isValidStatus(courseModeration) ||
        !isValidStatus(intranetSync) || !isValidStatus(gradeBookStatus)) {
      return res.status(400).json({ message: 'Invalid status value provided. Must be Done, Pending, or Not Started.' });
    }

    // Check if allocation exists and get facilitator info
    const allocation = await Allocation.findByPk(allocationId, {
      include: [{ model: Facilitator, include: [{ model: User }] }]
    });
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found.' });
    }

    // Facilitator access control: Must be the assigned facilitator for this allocation
    if (role === 'facilitator') {
      const facilitatorProfile = await Facilitator.findOne({ where: { userId: currentUserId } });
      if (!facilitatorProfile || allocation.facilitatorId !== facilitatorProfile.id) {
        return res.status(403).json({ message: 'Forbidden: You can only create logs for your assigned allocations.' });
      }
    } else if (role !== 'manager' && role !== 'admin') {
      // Only facilitators, managers, or admins can create logs
      return res.status(403).json({ message: 'Forbidden: Only facilitators, managers, or admins can create activity logs.' });
    }

    // Prevent duplicate logs for the same allocation and weekNumber
    const existingLog = await ActivityTracker.findOne({
      where: { allocationId, weekNumber }
    });
    if (existingLog) {
      return res.status(409).json({ message: `Activity log for allocation ${allocationId} and week ${weekNumber} already exists. Please update it instead.` });
    }

    const newActivityLog = await ActivityTracker.create({
      allocationId,
      attendance: attendance || [], 
      weekNumber,
      formativeOneGrading,
      formativeTwoGrading,
      summativeGrading,
      courseModeration,
      intranetSync,
      gradeBookStatus,
    });

    res.status(201).json({
      message: 'Activity log created successfully',
      activityLog: newActivityLog,
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({ message: 'Server error creating activity log.' });
  }
};

// Get All Activity Logs (Managers see all, Facilitators see their own)
exports.getAllActivityLogs = async (req, res) => {
  try {
    const { role, id: currentUserId } = req.user;
    const { allocationId, weekNumber, status, facilitatorId } = req.query; // 'status' for generic filter

    let whereClause = {}; 
    let allocationWhereClause = {}; 

    let includeClause = [
      { model: Allocation,
        attributes: ['id', 'trimester', 'year'],
        include: [
          { model: Module, attributes: ['id', 'name', 'half'] },
          { model: Class, attributes: ['id', 'name'] },
          { model: Facilitator, attributes: ['id'], include: [{ model: User, attributes: ['name', 'email'] }] }
        ]
      },
    ];

    if (allocationId) whereClause.allocationId = allocationId;
    if (weekNumber) whereClause.weekNumber = weekNumber;


    if (status) {
      if (!isValidStatus(status)) {
        return res.status(400).json({ message: 'Invalid status value for filter. Must be Done, Pending, or Not Started.' });
      }
      whereClause[Op.or] = [
        { formativeOneGrading: status },
        { formativeTwoGrading: status },
        { summativeGrading: status },
        { courseModeration: status },
        { intranetSync: status },
        { gradeBookStatus: status },
      ];
    }
    


    // Role-based Access Control for Viewing
    if (role === 'facilitator') {
      const facilitatorProfile = await Facilitator.findOne({ where: { userId: currentUserId } });
      if (!facilitatorProfile) {
        return res.status(404).json({ message: 'Facilitator profile not found for this user.' });
      }
      // Filter by allocations assigned to this facilitator
      allocationWhereClause.facilitatorId = facilitatorProfile.id;
    } else if (role === 'manager') {
      if (facilitatorId) {
        allocationWhereClause.facilitatorId = facilitatorId;
      }
    } else {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to view activity logs.' });
    }

    // Apply allocationWhereClause to the include object
    if (Object.keys(allocationWhereClause).length > 0) {
      includeClause[0].where = allocationWhereClause;
      includeClause[0].required = true; // Ensure inner join if filtering on associated model
    }


    const activityLogs = await ActivityTracker.findAll({
      where: whereClause,
      include: includeClause,
      order: [['weekNumber', 'ASC'], ['createdAt', 'DESC']],
    });

    res.status(200).json({
      message: 'Activity logs fetched successfully',
      count: activityLogs.length,
      activityLogs,
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Server error fetching activity logs.' });
  }
};

// Get Activity Log by ID
exports.getActivityLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: currentUserId } = req.user;

    const activityLog = await ActivityTracker.findByPk(id, {
      include: [
        { model: Allocation,
          attributes: ['id', 'trimester', 'year'],
          include: [
            { model: Module, attributes: ['id', 'name', 'half'] },
            { model: Class, attributes: ['id', 'name'] },
            { model: Facilitator, attributes: ['id'], include: [{ model: User, attributes: ['name', 'email'] }] }
          ]
        },
      ],
    });

    if (!activityLog) {
      return res.status(404).json({ message: 'Activity log not found.' });
    }

    // Facilitator access control
    if (role === 'facilitator') {
      const facilitatorProfile = await Facilitator.findOne({ where: { userId: currentUserId } });
      // Ensure the log belongs to an allocation assigned to this facilitator
      if (!facilitatorProfile || !activityLog.Allocation || !activityLog.Allocation.Facilitator ||
          activityLog.Allocation.Facilitator.id !== facilitatorProfile.id) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own activity logs.' });
      }
    }

    res.status(200).json({ activityLog });
  } catch (error) {
    console.error('Error fetching activity log by ID:', error);
    res.status(500).json({ message: 'Server error fetching activity log.' });
  }
};

// Update Activity Log
exports.updateActivityLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance, weekNumber, formativeOneGrading,
            formativeTwoGrading, summativeGrading, courseModeration,
            intranetSync, gradeBookStatus } = req.body;
    const { role, id: currentUserId } = req.user;

    const activityLog = await ActivityTracker.findByPk(id, {
      include: [{ model: Allocation, include: [{ model: Facilitator }] }]
    });

    if (!activityLog) {
      return res.status(404).json({ message: 'Activity log not found.' });
    }

    // Facilitator access control: Must be the assigned facilitator for this log's allocation
    if (role === 'facilitator') {
      const facilitatorProfile = await Facilitator.findOne({ where: { userId: currentUserId } });
      // Need to ensure activityLog.Allocation and activityLog.Allocation.Facilitator exist
      if (!facilitatorProfile || !activityLog.Allocation || !activityLog.Allocation.Facilitator ||
          activityLog.Allocation.Facilitator.id !== facilitatorProfile.id) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own activity logs.' });
      }
    } else if (role !== 'manager') {
      // Only facilitators, managers can update logs
      return res.status(403).json({ message: 'Forbidden: Only facilitators or managers can update activity logs.' });
    }

    // Validate enum statuses if provided
    const updates = {};
    if (attendance !== undefined) updates.attendance = attendance;
    if (weekNumber !== undefined && weekNumber !== null) updates.weekNumber = weekNumber;

    if (formativeOneGrading !== undefined) {
      if (!isValidStatus(formativeOneGrading)) return res.status(400).json({ message: 'Invalid formativeOneGrading status.' });
      updates.formativeOneGrading = formativeOneGrading;
    }
    if (formativeTwoGrading !== undefined) {
      if (!isValidStatus(formativeTwoGrading)) return res.status(400).json({ message: 'Invalid formativeTwoGrading status.' });
      updates.formativeTwoGrading = formativeTwoGrading;
    }
    if (summativeGrading !== undefined) {
      if (!isValidStatus(summativeGrading)) return res.status(400).json({ message: 'Invalid summativeGrading status.' });
      updates.summativeGrading = summativeGrading;
    }
    if (courseModeration !== undefined) {
      if (!isValidStatus(courseModeration)) return res.status(400).json({ message: 'Invalid courseModeration status.' });
      updates.courseModeration = courseModeration;
    }
    if (intranetSync !== undefined) {
      if (!isValidStatus(intranetSync)) return res.status(400).json({ message: 'Invalid intranetSync status.' });
      updates.intranetSync = intranetSync;
    }
    if (gradeBookStatus !== undefined) {
      if (!isValidStatus(gradeBookStatus)) return res.status(400).json({ message: 'Invalid gradeBookStatus status.' });
      updates.gradeBookStatus = gradeBookStatus;
    }

    await activityLog.update(updates);

    res.status(200).json({
      message: 'Activity log updated successfully',
      activityLog,
    });
  } catch (error) {
    console.error('Error updating activity log:', error);
    res.status(500).json({ message: 'Server error updating activity log.' });
  }
};

// Delete Activity Log
exports.deleteActivityLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: currentUserId } = req.user;

    const activityLog = await ActivityTracker.findByPk(id, {
      include: [{ model: Allocation, include: [{ model: Facilitator }] }]
    });

    if (!activityLog) {
      return res.status(404).json({ message: 'Activity log not found.' });
    }

    // Facilitator access control: Must be the assigned facilitator for this log's allocation
    if (role === 'facilitator') {
      const facilitatorProfile = await Facilitator.findOne({ where: { userId: currentUserId } });
      // Need to ensure activityLog.Allocation and activityLog.Allocation.Facilitator exist
      if (!facilitatorProfile || !activityLog.Allocation || !activityLog.Allocation.Facilitator ||
          activityLog.Allocation.Facilitator.id !== facilitatorProfile.id) {
        return res.status(403).json({ message: 'Forbidden: You can only delete your own activity logs.' });
      }
    } else if (role !== 'manager') {
      // Only facilitators, managers, or admins can delete logs
      return res.status(403).json({ message: 'Forbidden: Only facilitators or managers can delete activity logs.' });
    }

    await activityLog.destroy();
    res.status(200).json({ message: 'Activity log deleted successfully.' });
  } catch (error) {
    console.error('Error deleting activity log:', error);
    res.status(500).json({ message: 'Server error deleting activity log.' });
  }
};