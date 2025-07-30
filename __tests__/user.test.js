process.env.NODE_ENV = 'test';
const { sequelize, User } = require('../models');


describe('User Model', () => {
  
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  
  afterAll(async () => {
    await sequelize.close();
  });

  
  test('should create a new user', async () => {
    const userData = {
      email: 'testuser@example.com',
      password: 'testpassword123', 
      role: 'student'
    };

    
    const user = await User.create(userData);

    
    expect(user).toBeDefined(); 
    expect(user.id).toBeDefined(); 
    expect(user.email).toBe(userData.email); 
    expect(user.role).toBe(userData.role); 
  });

  test('should not create a user with a duplicate email', async () => {
    const userData = {
      email: 'duplicate@example.com',
      password: 'password',
      role: 'facilitator'
    };

    
    await User.create(userData);

    await expect(User.create(userData)).rejects.toThrow();
  });
});