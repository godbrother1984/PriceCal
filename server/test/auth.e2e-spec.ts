// path: server/test/auth.e2e-spec.ts
// version: 1.0 (Integration Tests for AuthController)
// last-modified: 14 ตุลาคม 2568 16:00

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthModule } from '../src/auth/auth.module';
import { User } from '../src/entities/user.entity';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  // Mock User Repository
  const mockUsers: User[] = [];

  const mockUserRepository = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      if (where.username) {
        return Promise.resolve(
          mockUsers.find((u) => u.username === where.username && u.isActive === where.isActive),
        );
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockImplementation((userData) => {
      return userData;
    }),
    save: jest.fn().mockImplementation((user) => {
      const newUser = {
        id: `user-${Date.now()}`,
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.push(newUser);
      return Promise.resolve(newUser);
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    // สร้าง test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    mockUsers.push({
      id: 'test-user-1',
      username: 'testuser',
      password: hashedPassword,
      name: 'Test User',
      role: 'User',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/auth/login (POST)', () => {
    it('ควร login สำเร็จด้วย username และ password ที่ถูกต้อง', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user.username).toBe('testuser');
          expect(res.body.user.name).toBe('Test User');
          expect(res.body.user.role).toBe('User');
          expect(res.body.token).toBeDefined();
        });
    });

    it('ควร return 401 เมื่อ username ไม่ถูกต้อง', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'wronguser',
          password: 'password123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('ควร return 401 เมื่อ password ไม่ถูกต้อง', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid credentials');
        });
    });

    it('ควร return 401 เมื่อไม่ส่ง username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(401);
    });

    it('ควร return 401 เมื่อไม่ส่ง password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
        })
        .expect(401);
    });

    it('ควร return JWT token ที่ valid', async () => {
      const response = await request(app.getHttpServer()).post('/auth/login').send({
        username: 'testuser',
        password: 'password123',
      });

      const token = response.body.token;
      expect(token).toBeDefined();

      // ตรวจสอบว่า token decode ได้
      const decoded = jwtService.verify(token);
      expect(decoded).toHaveProperty('username');
      expect(decoded).toHaveProperty('sub');
      expect(decoded).toHaveProperty('role');
      expect(decoded.username).toBe('testuser');
    });

    it('ควรจัดการ SQL injection attempts', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: "admin' OR '1'='1",
          password: "password' OR '1'='1",
        })
        .expect(401);
    });

    it('ควรจัดการ empty strings', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: '',
          password: '',
        })
        .expect(401);
    });

    it('ควรจัดการ very long username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'a'.repeat(1000),
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/auth/register (POST)', () => {
    it('ควร register user ใหม่สำเร็จ', () => {
      const newUserData = {
        username: 'newuser',
        password: 'newpassword123',
        name: 'New User',
        role: 'User',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(newUserData)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe('User created successfully');
          expect(res.body.data).toHaveProperty('userId');
          expect(res.body.data.username).toBe(newUserData.username);
          expect(res.body.data.name).toBe(newUserData.name);
          expect(res.body.data.role).toBe(newUserData.role);
        });
    });

    it('ควรใช้ role เริ่มต้นเป็น "User" เมื่อไม่ระบุ role', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'userwithoutrole',
          password: 'password123',
          name: 'User Without Role',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.role).toBe('User');
        });
    });

    it('ควร return 401 เมื่อ username ซ้ำ', async () => {
      // Register ครั้งแรก
      await request(app.getHttpServer()).post('/auth/register').send({
        username: 'duplicateuser',
        password: 'password123',
        name: 'Duplicate User',
      });

      // พยายาม register ซ้ำ
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'duplicateuser',
          password: 'password123',
          name: 'Another User',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Username already exists');
        });
    });

    it('ควร hash password ก่อนเก็บ', async () => {
      const password = 'plainpassword';
      const response = await request(app.getHttpServer()).post('/auth/register').send({
        username: 'passwordtest',
        password,
        name: 'Password Test User',
      });

      expect(response.status).toBe(201);

      // ตรวจสอบว่าสามารถ login ได้
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
        username: 'passwordtest',
        password,
      });

      expect(loginResponse.status).toBe(201);
      expect(loginResponse.body).toHaveProperty('token');
    });

    it('ควรจัดการกรณีไม่ส่ง required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'incomplete',
        })
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    it('ควรรองรับ special characters ใน name', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'specialuser',
          password: 'password123',
          name: 'User ทดสอบ 测试 テスト',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.name).toBe('User ทดสอบ 测试 テスト');
        });
    });

    it('ควรจัดการ very long password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'longpassuser',
          password: 'a'.repeat(1000),
          name: 'Long Password User',
        })
        .expect(201);
    });
  });

  describe('Login and Register Flow', () => {
    it('ควร register และ login ได้ต่อเนื่อง', async () => {
      const userData = {
        username: 'flowtest',
        password: 'flowpassword123',
        name: 'Flow Test User',
        role: 'Admin',
      };

      // Register
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData);

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);

      // Login
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
        username: userData.username,
        password: userData.password,
      });

      expect(loginResponse.status).toBe(201);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user.username).toBe(userData.username);
      expect(loginResponse.body.user.role).toBe(userData.role);
    });

    it('ควรไม่ login ได้ด้วย password ผิดหลัง register', async () => {
      const userData = {
        username: 'wrongpwtest',
        password: 'correctpassword',
        name: 'Wrong PW Test User',
      };

      // Register
      await request(app.getHttpServer()).post('/auth/register').send(userData);

      // พยายาม login ด้วย password ผิด
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
        username: userData.username,
        password: 'wrongpassword',
      });

      expect(loginResponse.status).toBe(401);
    });
  });

  describe('Security Tests', () => {
    it('ควรป้องกัน timing attacks (username enumeration)', async () => {
      const start1 = Date.now();
      await request(app.getHttpServer()).post('/auth/login').send({
        username: 'existinguser',
        password: 'wrongpassword',
      });
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await request(app.getHttpServer()).post('/auth/login').send({
        username: 'nonexistentuser',
        password: 'wrongpassword',
      });
      const time2 = Date.now() - start2;

      // เวลาควรใกล้เคียงกัน (ความแตกต่างไม่เกิน 100ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(100);
    });

    it('ควรไม่ return password ใน response', async () => {
      const response = await request(app.getHttpServer()).post('/auth/login').send({
        username: 'testuser',
        password: 'password123',
      });

      expect(response.body.user).not.toHaveProperty('password');
    });

    it('ควรไม่ return password hash ใน register response', async () => {
      const response = await request(app.getHttpServer()).post('/auth/register').send({
        username: 'securitytest',
        password: 'password123',
        name: 'Security Test User',
      });

      expect(response.body.data).not.toHaveProperty('password');
    });
  });
});
