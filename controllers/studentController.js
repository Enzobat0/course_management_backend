const { Student, User, Class, Cohort } = require('../models');

// Get all Students
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

// Get Student by ID
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

    // Access control: Students can only view their own profile
    if (role === 'student' && student.userId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own student profile.' });
    }

    res.status(200).json({ student });
  } catch (error) {
    console.error('Error fetching student by ID:', error);
    res.status(500).json({ message: 'Server error fetching student.' });
  }
};

// Update a Student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, classId, cohortId } = req.body;
    const { role, id: currentUserId } = req.user;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Access control: Students can only update their own profile
    if (role === 'student' && student.userId !== currentUserId) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own student profile.' });
    }
    // Managers can update any student. Students can update their name.
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

// Delete a Student
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