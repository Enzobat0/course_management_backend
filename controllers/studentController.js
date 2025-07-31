const { Student, User, Class, Cohort } = require('../models');

/**
 * @swagger
 * /api/students:
 * get:
 * summary: Retrieve all students
 * description: Managers can view all students. Students can only view their own profile.
 * tags:
 * - Students
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: A list of students.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Students fetched successfully' }
 * count: { type: 'integer', example: 1 }
 * students:
 * type: array
 * items:
 * type: object
 * properties:
 * id: { type: 'string', format: 'uuid' }
 * name: { type: 'string' }
 * classId: { type: 'string', format: 'uuid', nullable: true }
 * cohortId: { type: 'string', format: 'uuid', nullable: true }
 * User: { $ref: '#/components/schemas/User' }
 * Class: { $ref: '#/components/schemas/Class' }
 * Cohort: { $ref: '#/components/schemas/Cohort' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can view all students.
 * 404:
 * description: Student profile not found (if role is student).
 * 500:
 * description: Server error.
 */
exports.getAllStudents = async (req, res) => {
  try {
    const { role, id: currentUserId } = req.user;
    let whereClause = {}; 
    let includeClause = [
      { model: User, attributes: ['id', 'email', 'role'] },
      { model: Class, attributes: ['id', 'name'] },
      { model: Cohort, attributes: ['id', 'name'] },
    ];

    if (role === 'student') {
      const studentProfile = await Student.findOne({ where: { userId: currentUserId } });
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found for this user.' });
      }
      whereClause.id = studentProfile.id;
    }

    const students = await Student.findAll({
      where: whereClause,
      include: includeClause,
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      message: 'Students fetched successfully',
      count: students.length,
      students,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error fetching students.' });
  }
};

/**
 * @swagger
 * /api/students/{id}:
 * get:
 * summary: Retrieve a single student by ID
 * description: Managers can view any student. Students can only view their own profile.
 * tags:
 * - Students
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the student to retrieve.
 * responses:
 * 200:
 * description: A single student object.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * student:
 * type: object
 * properties:
 * id: { type: 'string', format: 'uuid' }
 * name: { type: 'string' }
 * classId: { type: 'string', format: 'uuid', nullable: true }
 * cohortId: { type: 'string', format: 'uuid', nullable: true }
 * User: { $ref: '#/components/schemas/User' }
 * Class: { $ref: '#/components/schemas/Class' }
 * Cohort: { $ref: '#/components/schemas/Cohort' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. You can only view your own student profile.
 * 404:
 * description: Student not found.
 * 500:
 * description: Server error.
 */
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: currentUserId } = req.user;

    const student = await Student.findByPk(id, {
      include: [
        { model: User, attributes: ['id', 'email', 'role'] },
        { model: Class, attributes: ['id', 'name'] },
        { model: Cohort, attributes: ['id', 'name'] },
      ],
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Students can only view their own profile
    if (role === 'student' && student.userId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own student profile.' });
    }

    res.status(200).json({ student });
  } catch (error) {
    console.error('Error fetching student by ID:', error);
    res.status(500).json({ message: 'Server error fetching student.' });
  }
};

/**
 * @swagger
 * /api/students/{id}:
 * put:
 * summary: Update an existing student's details
 * description: Managers can update any student. Students can only update their own name.
 * tags:
 * - Students
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the student to update.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * name:
 * type: string
 * description: New name of the student.
 * example: "Jane Smith"
 * classId:
 * type: string
 * format: uuid
 * description: (Manager only) New class ID for the student.
 * example: "b2c3d4e5-f6a7-8901-2345-67890abcdef0"
 * cohortId:
 * type: string
 * format: uuid
 * description: (Manager only) New cohort ID for the student.
 * example: "c3d4e5f6-a7b8-9012-3456-7890abcdef01"
 * responses:
 * 200:
 * description: Student updated successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Student updated successfully' }
 * student: { $ref: '#/components/schemas/Student' }
 * 400:
 * description: Bad request (e.g., invalid input).
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. User does not have permission to update this profile.
 * 404:
 * description: Student not found.
 * 500:
 * description: Server error.
 */
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, classId, cohortId } = req.body;
    const { role, id: currentUserId } = req.user;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // students can only update their ownprofile
    if (role === 'student' && student.userId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own student profile.' });
    }
    // managers can update any student and students can only update their name.
    if (role === 'student') {
        await student.update({ name: name || student.name });
    } else { 
        await student.update({
            name: name || student.name,
            classId: classId || student.classId,
            cohortId: cohortId || student.cohortId,
        });
    }


    res.status(200).json({
      message: 'Student updated successfully',
      student,
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server error updating student.' });
  }
};

/**
 * @swagger
 * /api/students/{id}:
 * delete:
 * summary: Delete a student by ID
 * description: Only managers can delete students.
 * tags:
 * - Students
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * format: uuid
 * description: The ID of the student to delete.
 * responses:
 * 200:
 * description: Student deleted successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message: { type: 'string', example: 'Student deleted successfully.' }
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. Only managers can delete students.
 * 404:
 * description: Student not found.
 * 500:
 * description: Server error.
 */
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    await student.destroy();
    res.status(200).json({ message: 'Student deleted successfully.' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error deleting student.' });
  }
};
