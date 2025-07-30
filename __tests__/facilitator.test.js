process.env.NODE_ENV = 'test';

const { sequelize, User, Manager, Facilitator } = require('../models');

describe('Facilitator Model', () => {
  let testUser;
  let testManagerUser;
  let testManager;

  
  beforeAll(async () => {
    await sequelize.sync({ force: true }); 

    
    testUser = await User.create({
      email: 'facilitatoruser@test.com',
      password: 'hashedpassword',
      role: 'facilitator'
    });

   
    testManagerUser = await User.create({
      email: 'manageruser@test.com',
      password: 'hashedpassword',
      role: 'manager'
    });
    testManager = await Manager.create({
      name: 'Test Manager',
      userId: testManagerUser.id
    });
  });

  
  afterAll(async () => {
    await sequelize.close();
  });

  
  test('should create a new facilitator', async () => {
    const facilitatorData = {
      name: 'Facilitator Alpha',
      qualification: 'MSc',
      location: 'Online',
      userId: testUser.id,
      managerId: testManager.id 
    };

    const facilitator = await Facilitator.create(facilitatorData);

    expect(facilitator).toBeDefined();
    expect(facilitator.id).toBeDefined();
    expect(facilitator.name).toBe(facilitatorData.name);
    expect(facilitator.qualification).toBe(facilitatorData.qualification);
    expect(facilitator.location).toBe(facilitatorData.location);
    expect(facilitator.userId).toBe(testUser.id);
    expect(facilitator.managerId).toBe(testManager.id);
  });

  
  test('should create a new facilitator without a managerId', async () => {
    const facilitatorData = {
      name: 'Facilitator Beta',
      qualification: 'BSc',
      location: 'Campus',
      userId: (await User.create({ email: 'anotheruser@test.com', password: 'pw', role: 'facilitator' })).id,
      managerId: null 
    };

    const facilitator = await Facilitator.create(facilitatorData);

    expect(facilitator).toBeDefined();
    expect(facilitator.id).toBeDefined();
    expect(facilitator.name).toBe(facilitatorData.name);
    expect(facilitator.managerId).toBeNull();
  });

  
  test('should update a facilitator', async () => {
    const facilitator = await Facilitator.create({
      name: 'Facilitator Gamma',
      qualification: 'PhD',
      location: 'Remote',
      userId: (await User.create({ email: 'gammauser@test.com', password: 'pw', role: 'facilitator' })).id,
      managerId: testManager.id
    });

    const updatedName = 'Facilitator Gamma Updated';
    await facilitator.update({ name: updatedName });

    expect(facilitator.name).toBe(updatedName);
  });

  
  test('should delete a facilitator', async () => {
    const facilitator = await Facilitator.create({
      name: 'Facilitator Delta',
      qualification: 'MA',
      location: 'Hybrid',
      userId: (await User.create({ email: 'deltauser@test.com', password: 'pw', role: 'facilitator' })).id,
      managerId: testManager.id
    });

    const facilitatorId = facilitator.id;
    await facilitator.destroy();

    const deletedFacilitator = await Facilitator.findByPk(facilitatorId);
    expect(deletedFacilitator).toBeNull();
  });

  
  test('should not create a facilitator with a non-existent userId', async () => {
    const invalidFacilitatorData = {
      name: 'Invalid Facilitator',
      qualification: 'None',
      location: 'Unknown',
      userId: '00000000-0000-4000-8000-000000000000', 
      managerId: testManager.id
    };

    await expect(Facilitator.create(invalidFacilitatorData)).rejects.toThrow();
  });

 
  test('should not create a facilitator with a non-existent managerId', async () => {
    const invalidFacilitatorData = {
      name: 'Invalid Facilitator 2',
      qualification: 'None',
      location: 'Unknown',
      userId: testUser.id,
      managerId: '00000000-0000-4000-8000-000000000001' 
    };

    await expect(Facilitator.create(invalidFacilitatorData)).rejects.toThrow();
  });
});
