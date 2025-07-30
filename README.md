# Course Management Platform Backend #

This repository contains the backend system for a Course Management Platform, designed to support academic institutions in managing faculty operations, monitoring student progress, and enhancing overall academic coordination. The system is built with a role-based, RESTful architecture and features a secure authentication layer, asynchronous task handling, and comprehensive API documentation.

## Technical Stack ##
 Backend:

* Node.js (Runtime Environment)

* Express.js (Web Framework)

* MySQL (Relational Database)

* Sequelize ORM (Object Relational Mapper)

* bcrypt (Password Hashing)

* jsonwebtoken (JWT Authentication)

* dotenv (Environment Variable Management)

* bull / ioredis / redis (Redis integration for Message Queuing)

* node-cron (Scheduler for reminders)

* nodemailer (Email notifications)

* swagger-ui-express & swagger-jsdoc (API Documentation)

Testing:

* Jest (Unit Testing Framework)



Frontend (Module 3):

* HTML5

* CSS3

* Vanilla JavaScript

## Database Schema Overview ##
The backend leverages a relational database (MySQL) with Sequelize ORM to define and manage the following key models and their relationships:

* **`User`**: Stores core user information (email, hashed password, role).
  * Roles: `manager`, `facilitator`, `student`.
* **`Manager`**: Profile details for managers.
  * One-to-one with `User` (via `userId`).
* **`Facilitator`**: Profile details for facilitators.
  * One-to-one with `User` (via `userId`).
  * Many-to-one with `Manager` (via `managerId`).
* **`Student`**: Profile details for students.
  * One-to-one with `User` (via `userId`).
  * Many-to-one with `Class` (via `classId`).
  * Many-to-one with `Cohort` (via `cohortId`).
* **`Module`**: Defines courses (e.g., "Mathematics 101", "Physics 202").
* **`Class`**: Defines specific class intakes (e.g., "2024J", "2025S").
* **`Cohort`**: Defines groups of students (e.g., "Cohort 2").
* **`Mode`**: Defines course delivery methods (e.g., "Online", "Hybrid", "Inperson").
* **`Allocation` (Course Offering)**: Represents a specific course offering.
  * Many-to-one with `Module` (via `moduleId`).
  * Many-to-one with `Class` (via `classId`).
  * Many-to-one with `Facilitator` (via `facilitatorId`).
  * Many-to-one with `Mode` (via `modeId`).
* **`ActivityTracker`**: Stores weekly activity logs submitted by facilitators.
  * Many-to-one with `Allocation` (via `allocationId`).

Relationships are enforced using foreign keys to maintain referential integrity and data consistency.

## Setup and Installation
Follow these step-by-step instructions to get the backend server up and running on your local machine.

#### Prerequisites

Before you begin, ensure you have the following software installed:

* Node.js: [Download and install Node.js](https://nodejs.org/en/download)

* npm or Yarn: These are typically installed with Node.js.

* MySQL Server: [MySQL Downloads](https://www.mysql.com/downloads/)

* Redis Server: [Download and install Redis](https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/)

### Installation Steps

1. Clone the repository:

```bash
git clone https://github.com/Enzobat0/course_management_backend.git
```

2. Install dependencies:

    Navigate to the project's root directory in your terminal and install all required Node.js packages:

    ```bash
    npm install
    ```
3. Set up Environment Variables (`.env`)

    Create a file named .env in the root directory of your project. Copy the content below and replace the placeholder values with your actual credentials and configurations.

    ```sh
    PORT=5050
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=<your-db-password>
    DB_NAME=course_management
    DB_NAME_TEST=course_management_test
    DB_DIALECT=mysql
    JWT_SECRET=<your-jwt-password>
    JWT_EXPIRES_IN=1d
    REDIS_URL=redis://127.0.0.1:6379
    REDIS_PASSWORD=
    REDIS_DB=0

    #nodemailer configuration
    EMAIL_HOST=<your-email-host>
    EMAIL_PORT=<your-email-port>
    EMAIL_USER=<your-email-username>
    EMAIL_PASS=<your-email-pass>
    EMAIL_SECURE=false
    SENDER_EMAIL='noreply@example.co'
    ```
4. Create MySQL Databases:

    Connect to your MySQL server (e.g., via MySQL Workbench, DBeaver, or terminal) and execute the following SQL commands to create the necessary databases:

    ```mysql
    CREATE DATABASE course_management;
    CREATE DATABASE course_management_test;
    ```

### Running the Application
1. **Start the Redis server.** Ensure your Redis server is running in the background.
2. **Start the Node.js backend server:**
    From the project's root directory, run:
    ```bash
    npm run dev
    ```

## Key API Endpoints
Below is a summary of the main API endpoints with example requests and responses. For full details, including all parameters and response schemas, please refer to the Swagger UI.

1. ### Authentication

    a. **Register User** `/api/auth/register`

    `POST /api/auth/register`

    Description: Registers a new user with a specified role (manager, facilitator, student) and creates their associated profile.

    Request Body Example (Facilitator):

    ```bash
    {
    "email": "facilitator1@alu.com",
    "password": "password123",
    "role": "facilitator",
    "name": "Facilitator One",
    "qualification": "PhD",
    "location": "Kigali",
    "managerId": "77c46a2e-36bd-472f-a821-1ef023f90389"
    }
    ```

    Successful Response (201 Created):

    ```bash
    {
    "message": "facilitator registered successfully",
    "user": {
        "id": "bfd8a7a5-868a-46dc-8143-06834763ea52",
        "email": "facilitator1@alu.com",
        "role": "facilitator"
        }
    }
    ```

    Common Status Codes:

    `201 Created`: User successfully registered.

    `400 Bad Request`: Missing required fields, invalid role, or missing role-specific fields (e.g., name for manager).

    `409 Conflict`: User with this email already exists.

    `500 Internal Server Error`: Server-side issue.


    b. **Login User** `/api/auth/login`

    **Description**: Authenticates a user with email and password, returning a JWT token for authorization.

    **Common Status Codes:**

    * `200 OK`: Login successful.

    * `401 Unauthorized`: Invalid credentials (email/password mismatch).

    * `404 Not Found`: User not found.

    * `500 Internal Server Error`: Server-side issue.


2.  ### Course Allocations `/api/allocations`

    All Allocation endpoints require a JWT in the Authorization: Bearer `<token>` header.

    Common Status Codes:

    `200 OK`: Allocations fetched successfully.

    `401 Unauthorized`: Missing or invalid JWT.

    `403 Forbidden`: User role does not have permission.

    `404 Not Found`: Facilitator profile not found (if current user is a facilitator).

    `500 Internal Server Error`: Server-side issue.

3. ### Facilitator Activity Tracker `/api/activity-tracker`
    All Activity Tracker endpoints require a JWT in the Authorization: Bearer `<token>` header.

    Common Status Codes:

    `201 Created`: Activity log successfully created.

    `400 Bad Request`: Missing required fields, invalid status value.

    `401 Unauthorized`: Missing or invalid JWT.

    `403 Forbidden`: User does not have permission or is not assigned to the allocation.

    `404 Not Found`: Allocation not found.

    `409 Conflict`: Log for this allocation and week already exists.

    `500 Internal Server Error`: Server-side issue.


## Running Tests
Unit tests are implemented using Jest to ensure the reliability of key models and utility functions.

```bash
npm test
```
Note: Tests connect to DB_NAME_TEST and use sequelize.sync({ force: true }) to ensure a clean database state for each test run. This will wipe all data in course_management_test

## [Student Reflection Page](https://studentreflection.netlify.app/)

## [Video Walkthrough]()

## Assumptions and Limitations
* Role Management: User roles (manager, facilitator, student) are strictly enforced for API access.

* Data Integrity: Foreign key constraints are utilized to maintain data integrity across related models.

* Email Notifications: Relies on an external SMTP service (e.g., Mailtrap) configured via environment variables.

* Module 3 Frontend: The Student Reflection Page is a separate, static frontend application and does not interact with this backend API.

* Limited CRUD for Lookup Tables: CRUD operations are not implemented for Mode and Cohort tables via the API. Initial data for these tables must be manually inserted into the database using the provided SQL scripts in the "Database Setup" section.










