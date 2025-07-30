const { ActivityTracker, Allocation, Facilitator, User, Module, Class } = require('../models');
const { Op } = require('sequelize');
const { queueAlert } = require('../utils/notificationDispatcher');
const { getManagerEmails } = require('../services/managerService');

const isValidStatus = (status) => ['Done', 'Pending', 'Not Started'].includes(status);

/**
 * @swagger
 * /api/activity-tracker:
 * post:
 * summary: Create a new activity log
 * description: Facilitators can submit activity logs for their assigned courses. Managers and Admins can also create logs.
 * tags:
 * - Activity Tracker
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - allocationId
 * - weekNumber
 * - formativeOneGrading
 * - formativeTwoGrading
 * - summativeGrading
 * - courseModeration
 * - intranetSync
 * - gradeBookStatus
 * properties:
 * allocationId:
 * type: string
 * format: uuid
 * description: The ID of the course allocation this log belongs to.
 * example: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 * attendance:
 * type: array
 * items:
 * type: object
 * description: JSON array storing attendance status for each week (e.g., [{"week1": "Done"}]).
 * example: [{"week1": "done"}, {"week2": "pending"}]
 * weekNumber:
 * type: integer
 * description: The specific week number the activity log covers.
 * example: 1
 * formativeOneGrading:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of formative assignment 1 grading.
 * example: "Done"
 * formativeTwoGrading:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of formative assignment 2 grading.
 * example: "Pending"
 * summativeGrading:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of summative assignment grading.
 * example: "Not Started"
 * courseModeration:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of course moderation.
 * example: "Pending"
 * intranetSync:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of intranet synchronization.
 * example: "Not Started"
 * gradeBookStatus:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of grade book updates.
 * example: "Not Started"
 * responses:
 * 201:
 * description: Activity log created successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Activity log created successfully' }
 * activityLog: { $ref: '#/components/schemas/ActivityTracker' }
 * 400:
 * description: Bad request (e.g., missing required fields, invalid status value).
 * 401:
 * description: Unauthorized. Invalid or missing token.
 * 403:
 * description: Forbidden. User does not have permission or is not assigned to the allocation.
 * 404:
 * description: Allocation not found.
 * 409:
 * description: Conflict. Activity log for this allocation and week number already exists.
 * 500:
 * description: Server error.
 */
exports.createActivityLog = async (req, res) => {
  try {
    const { allocationId, attendance, weekNumber, formativeOneGrading,
            formativeTwoGrading, summativeGrading, courseModeration,
            intranetSync, gradeBookStatus } = req.body;
    const { role, id: currentUserId } = req.user;

    
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
      return res.status(403).json({ message: 'Forbidden: Only facilitators, managers, or admins can create activity logs.' });
    }

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

    //trigger alert on submission
    const managerEmails = await getManagerEmails();
    await queueAlert(managerEmails, 'log_submitted', {
      logId: newActivityLog.id,
      allocationId: newActivityLog.allocationId,
      weekNumber: newActivityLog.weekNumber,
      facilitatorEmail: allocation.Facilitator.User.email,
      facilitatorName: allocation.Facilitator.User.name,
      moduleName: allocation.Module ? allocation.Module.name : 'N/A',
      className: allocation.Class ? allocation.Class.name : 'N/A',
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

/**
 * @swagger
 * /api/activity-tracker:
 * get:
 * summary: Retrieve all activity logs
 * description: Managers can view all activity logs. Facilitators can only view logs for their assigned allocations.
 * tags:
 * - Activity Tracker
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: allocationId
 * schema:
 * type: string
 * format: uuid
 * description: Filter logs by a specific allocation ID.
 * - in: query
 * name: weekNumber
 * schema:
 * type: integer
 * description: Filter logs by week number.
 * - in: query
 * name: status
 * schema:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Filter logs by a generic status across all grading/sync fields.
 * - in: query
 * name: facilitatorId
 * schema:
 * type: string
 * format: uuid
 * description: (Manager only) Filter logs by a specific facilitator ID.
 * responses:
 * 200:
 * description: A list of activity logs.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Activity logs fetched successfully' }
 * count: { type: 'integer', example: 1 }
 * activityLogs:
 * type: array
 * items:
 * $ref: '#/components/schemas/ActivityTracker'
 * 400:
 * description: Bad request (e.g., invalid status filter).
 * 401:
 * description: Unauthorized. Invalid or missing token.
 * 403:
 * description: Forbidden. User does not have permission.
 * 404:
 * description: Facilitator profile not found (if role is facilitator).
 * 500:
 * description: Server error.
 */
exports.getAllActivityLogs = async (req, res) => {
  try {
    const { role, id: currentUserId } = req.user;
    const { allocationId, weekNumber, status, facilitatorId } = req.query; 

    let whereClause = {}; 
    let allocationWhereClause = {}; 

    let includeClause = [
      { model: Allocation,
        attributes: ['id', 'trimester', 'year'],
        include: [
          { model: Module, attributes: ['id', 'name', 'half'] },
          { model: Class, attributes: ['id', 'name'] },
          { model: Facilitator, attributes: ['id', 'name'], include: [{ model: User, attributes: ['email'] }] }
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

    
    if (Object.keys(allocationWhereClause).length > 0) {
      includeClause[0].where = allocationWhereClause;
      includeClause[0].required = true; 
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

/**
 * @swagger
 * /api/activity-tracker/{id}:
 * get:
 * summary: Retrieve a single activity log by ID
 * description: Managers can view any activity log. Facilitators can only view their own activity logs.
 * tags:
 * - Activity Tracker
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the activity log to retrieve.
 * responses:
 * 200:
 * description: A single activity log object.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * activityLog: { $ref: '#/components/schemas/ActivityTracker' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. You can only view your own activity logs.
 * 404:
 * description: Activity log not found.
 * 500:
 * description: Server error.
 */
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
            { model: Facilitator, attributes: ['id', 'name'], include: [{ model: User, attributes: ['email'] }] }
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

/**
 * @swagger
 * /api/activity-tracker/{id}:
 * put:
 * summary: Update an existing activity log
 * description: Facilitators can update their own activity logs. Managers can update any log.
 * tags:
 * - Activity Tracker
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the activity log to update.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * attendance:
 * type: array
 * items:
 * type: object
 * description: JSON array storing attendance status for each week.
 * example: [{"week1": "done"}, {"week2": "pending"}]
 * weekNumber:
 * type: integer
 * description: The specific week number the activity log covers.
 * example: 1
 * formativeOneGrading:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of formative assignment 1 grading.
 * example: "Done"
 * formativeTwoGrading:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of formative assignment 2 grading.
 * example: "Pending"
 * summativeGrading:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of summative assignment grading.
 * example: "Not Started"
 * courseModeration:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of course moderation.
 * example: "Pending"
 * intranetSync:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of intranet synchronization.
 * example: "Not Started"
 * gradeBookStatus:
 * type: string
 * enum: [Done, Pending, Not Started]
 * description: Status of grade book updates.
 * example: "Not Started"
 * responses:
 * 200:
 * description: Activity log updated successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Activity log updated successfully' }
 * activityLog: { $ref: '#/components/schemas/ActivityTracker' }
 * 400:
 * description: Bad request (e.g., invalid status value).
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. User does not have permission or is not assigned to the allocation.
 * 404:
 * description: Activity log not found.
 * 500:
 * description: Server error.
 */
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
//trigger alert on update
    const managerEmails = await getManagerEmails();
    await queueAlert(managerEmails, 'log_updated', {
      logId: activityLog.id,
      allocationId: activityLog.allocationId,
      weekNumber: activityLog.weekNumber,
      facilitatorEmail: activityLog.Allocation.Facilitator.User.email,
      facilitatorName: activityLog.Allocation.Facilitator.User.name,
      moduleName: activityLog.Allocation.Module ? activityLog.Allocation.Module.name : 'N/A',
      className: activityLog.Allocation.Class ? activityLog.Allocation.Class.name : 'N/A',
      updatedFields: Object.keys(updates),
    });

    res.status(200).json({
      message: 'Activity log updated successfully',
      activityLog,
    });
  } catch (error) {
    console.error('Error updating activity log:', error);
    res.status(500).json({ message: 'Server error updating activity log.' });
  }
};

/**
 * @swagger
 * /api/activity-tracker/{id}:
 * delete:
 * summary: Delete an activity log by ID
 * description: Facilitators can delete their own activity logs. Managers can delete any log.
 * tags:
 * - Activity Tracker
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the activity log to delete.
 * responses:
 * 200:
 * description: Activity log deleted successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Activity log deleted successfully.' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. User does not have permission or is not assigned to the allocation.
 * 404:
 * description: Activity log not found.
 * 500:
 * description: Server error.
 */
exports.deleteActivityLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: currentUserId } = req.user;

    const activityLog = await ActivityTracker.findByPk(id, {
      include: [{ model: Allocation, include: [{ model: Facilitator }, { model: Module }, { model: Class }] }]
    });

    if (!activityLog) {
      return res.status(404).json({ message: 'Activity log not found.' });
    }

    // Facilitator access control, must be the assigned facilitator for this log's allocation
    if (role === 'facilitator') {
      const facilitatorProfile = await Facilitator.findOne({ where: { userId: currentUserId } });
      // Need to ensure activityLog.Allocation and activityLog.Allocation.Facilitator exist
      if (!facilitatorProfile || !activityLog.Allocation || !activityLog.Allocation.Facilitator ||
          activityLog.Allocation.Facilitator.id !== facilitatorProfile.id) {
        return res.status(403).json({ message: 'Forbidden: You can only delete your own activity logs.' });
      }
    } else if (role !== 'manager') {
      // Only facilitators or managers can delete logs
      return res.status(403).json({ message: 'Forbidden: Only facilitators or managers can delete activity logs.' });
    }

    await activityLog.destroy();

    //trigger alert on deletion
    const managerEmails = await getManagerEmails();
    await queueAlert(managerEmails, 'log_deleted', {
      logId: activityLog.id,
      allocationId: activityLog.allocationId,
      weekNumber: activityLog.weekNumber,
      facilitatorEmail: activityLog.Allocation.Facilitator.User.email,
      facilitatorName: activityLog.Allocation.Facilitator.User.name,
      moduleName: activityLog.Allocation.Module ? activityLog.Allocation.Module.name : 'N/A',
      className: activityLog.Allocation.Class ? activityLog.Allocation.Class.name : 'N/A',
    });

    res.status(200).json({ message: 'Activity log deleted successfully.' });
  } catch (error) {
    console.error('Error deleting activity log:', error);
    res.status(500).json({ message: 'Server error deleting activity log.' });
  }
};