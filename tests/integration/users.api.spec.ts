import request from 'supertest';
import { Application } from 'express';

describe('Users API', () => {
  let app: Application;

  beforeAll(() => {
    // Initialize app
    app = require('@/server').app;
  });

  describe('POST /api/v1/users', () => {
    it('should create a user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({
          email: 'invalid',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/v1/users').send({
        email: 'duplicate@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      const response = await request(app)
        .post('/api/v1/users')
        .send({
          email: 'duplicate@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });
});
