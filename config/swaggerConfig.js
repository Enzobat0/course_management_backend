const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0', // Specify the OpenAPI version
    info: {
      title: 'Course Management Platform API',
      version: '1.0.0',
      description: 'API documentation for the Course Management Platform',
      contact: {
        name: 'Enzo Batungwanayo',
        email: 'e.batungwan@alustudent.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5050/api', 
        description: 'Development Server',
      },
      
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the user' },
            email: { type: 'string', format: 'email', description: 'User\'s email address' },
            password: { type: 'string', format: 'password', description: 'User\'s password' },
            role: { type: 'string', enum: ['manager', 'facilitator', 'student'], description: 'User\'s role in the system' }
          },
          required: ['email','password', 'role']
        },
        Manager: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the manager' },
            name: { type: 'string', description: 'Name of the manager' },
            userId: { type: 'string', format: 'uuid', description: 'ID of the associated user account' }
          },
          required: ['name', 'userId']
        },
        Facilitator: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the facilitator' },
            name: { type: 'string', description: 'Name of the facilitator' },
            qualification: { type: 'string', description: 'Facilitator\'s qualification (e.g., "PhD", "MSc")' },
            location: { type: 'string', description: 'Geographical location of the facilitator' },
            managerId: { type: 'string', format: 'uuid', description: 'ID of the manager overseeing this facilitator (optional)', nullable: true },
            userId: { type: 'string', format: 'uuid', description: 'ID of the associated user account' }
          },
          required: ['name', 'qualification', 'location', 'userId']
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the student' },
            name: { type: 'string', description: 'Name of the student' },
            classId: { type: 'string', format: 'uuid', description: 'ID of the class the student belongs to (optional)', nullable: true },
            cohortId: { type: 'string', format: 'uuid', description: 'ID of the cohort the student belongs to (optional)', nullable: true },
            userId: { type: 'string', format: 'uuid', description: 'ID of the associated user account' }
          },
          required: ['name', 'userId']
        },
        Mode: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the mode' },
            name: { type: 'string', enum: ['Online', 'Hybrid', 'Inperson'], description: 'Delivery mode of the course' }
          },
          required: ['name']
        },
        Cohort: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the cohort' },
            name: { type: 'string', description: 'Name of the cohort (e.g., "2024 Sep Intake")' }
          },
          required: ['name']
        },
        Class: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the class' },
            name: { type: 'string', description: 'Name of the class (e.g., "J2023", "M2024S")' },
            startDate: { type: 'string', format: 'date-time', description: 'Start date of the class' },
            graduationDate: { type: 'string', format: 'date-time', description: 'Graduation date of the class' }
          },
          required: ['name', 'startDate', 'graduationDate']
        },
        Allocation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the course allocation' },
            moduleId: { type: 'string', format: 'uuid', description: 'ID of the associated module (course)' },
            classId: { type: 'string', format: 'uuid', description: 'ID of the associated class' },
            facilitatorId: { type: 'string', format: 'uuid', description: 'ID of the assigned facilitator' },
            modeId: { type: 'string', format: 'uuid', description: 'ID of the delivery mode' },
            trimester: { type: 'integer', description: 'The trimester for the allocation (e.g., 1, 2, 3)', example: 1 },
            year: { type: 'integer', description: 'The academic year for the allocation (e.g., 2024)', example: 2024 },
            createdAt: { type: 'string', format: 'date-time', description: 'Timestamp when the allocation was created' }
          },
          required: ['moduleId', 'classId', 'facilitatorId', 'modeId', 'trimester', 'year']
        },
        ActivityTracker: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier for the activity log' },
            allocationId: { type: 'string', format: 'uuid', description: 'ID of the associated course allocation' },
            attendance: {
                type: 'array',
                items: {type: 'object',},
                description: 'JSON array storing attendance status for each week (e.g., [{"week1": "Done"}, {"week2": "Pending"}])'
            },
            weekNumber: { type: 'integer', description: 'The specific week number the activity log covers' },
            formativeOneGrading: { type: 'string', enum: ['Done', 'Pending', 'Not Started'], description: 'Status of formative assignment 1 grading' },
            formativeTwoGrading: { type: 'string', enum: ['Done', 'Pending', 'Not Started'], description: 'Status of formative assignment 2 grading' },
            summativeGrading: { type: 'string', enum: ['Done', 'Pending', 'Not Started'], description: 'Status of summative assignment grading' },
            courseModeration: { type: 'string', enum: ['Done', 'Pending', 'Not Started'], description: 'Status of course moderation' },
            intranetSync: { type: 'string', enum: ['Done', 'Pending', 'Not Started'], description: 'Status of intranet synchronization' },
            gradeBookStatus: { type: 'string', enum: ['Done', 'Pending', 'Not Started'], description: 'Status of grade book updates' }
          },
          required: [
            'allocationId', 'weekNumber', 'formativeOneGrading', 'formativeTwoGrading',
            'summativeGrading', 'courseModeration', 'intranetSync', 'gradeBookStatus'
          ]
        }
      }
    },
    security: [
      {
        bearerAuth: [] 
      }
    ]
  },
  
  apis: [
    '../routes/*.js', 
    '../controllers/*.js' 
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;