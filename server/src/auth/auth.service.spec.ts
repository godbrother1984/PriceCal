// path: server/src/auth/auth.service.spec.ts
// version: 1.0 (Unit Tests for AuthService)
// last-modified: 14 ตุลาคม 2568 13:30

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  // Mock User Repository
  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  // Mock JWT Service
  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      username: 'testuser',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      password: '$2b$10$hashedpassword',
      name: 'Test User',
      role: 'User',
      isActive: true,
    };

    it('ควรล็อกอินสำเร็จเมื่อ username และ password ถูกต้อง', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: loginDto.username, isActive: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: mockUser.username,
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(result).toEqual({
        user: {
          userId: mockUser.id,
          username: mockUser.username,
          name: mockUser.name,
          role: mockUser.role,
        },
        token: 'mock-jwt-token',
      });
    });

    it('ควร throw UnauthorizedException เมื่อ username ไม่พบ', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('ควร throw UnauthorizedException เมื่อ user ไม่ active', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null); // findOne จะคืน null เพราะ isActive: true

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('ควร throw UnauthorizedException เมื่อ password ไม่ถูกต้อง', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('ควร throw error เมื่อ JWT service ล้มเหลว', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('JWT signing failed');
    });
  });

  describe('createUser', () => {
    const userData = {
      username: 'newuser',
      password: 'password123',
      name: 'New User',
      role: 'User',
    };

    it('ควรสร้าง user ใหม่สำเร็จ', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null); // ไม่มี user ซ้ำ
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$hashedpassword' as never);

      const mockCreatedUser = {
        id: 'user-456',
        username: userData.username,
        password: '$2b$10$hashedpassword',
        name: userData.name,
        role: userData.role,
      };

      mockUserRepository.create.mockReturnValue(mockCreatedUser);
      mockUserRepository.save.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await service.createUser(userData);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: userData.username },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        username: userData.username,
        password: '$2b$10$hashedpassword',
        name: userData.name,
        role: userData.role,
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedUser);
    });

    it('ควรใช้ role เริ่มต้นเป็น "User" เมื่อไม่ระบุ role', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$hashedpassword' as never);

      const userDataWithoutRole = {
        username: 'newuser',
        password: 'password123',
        name: 'New User',
      };

      const mockCreatedUser = {
        id: 'user-789',
        username: userDataWithoutRole.username,
        password: '$2b$10$hashedpassword',
        name: userDataWithoutRole.name,
        role: 'User', // default
      };

      mockUserRepository.create.mockReturnValue(mockCreatedUser);
      mockUserRepository.save.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await service.createUser(userDataWithoutRole);

      // Assert
      expect(userRepository.create).toHaveBeenCalledWith({
        username: userDataWithoutRole.username,
        password: '$2b$10$hashedpassword',
        name: userDataWithoutRole.name,
        role: 'User',
      });
      expect(result.role).toBe('User');
    });

    it('ควร throw UnauthorizedException เมื่อ username ซ้ำ', async () => {
      // Arrange
      const existingUser = {
        id: 'user-existing',
        username: userData.username,
        password: '$2b$10$oldhashedpassword',
        name: 'Existing User',
        role: 'User',
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.createUser(userData)).rejects.toThrow(UnauthorizedException);
      await expect(service.createUser(userData)).rejects.toThrow('Username already exists');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('ควร throw error เมื่อ password hashing ล้มเหลว', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockRejectedValue(new Error('Hashing failed') as never);

      // Act & Assert
      await expect(service.createUser(userData)).rejects.toThrow('Hashing failed');
    });

    it('ควร throw error เมื่อ database save ล้มเหลว', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$hashedpassword' as never);
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.createUser(userData)).rejects.toThrow('Database error');
    });
  });

  describe('edge cases', () => {
    it('ควรจัดการกรณี empty string ใน username', async () => {
      // Arrange
      const invalidLoginDto = { username: '', password: 'password123' };
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(invalidLoginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('ควรจัดการกรณี empty string ใน password', async () => {
      // Arrange
      const invalidLoginDto = { username: 'testuser', password: '' };
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        password: '$2b$10$hashedpassword',
        name: 'Test User',
        role: 'User',
        isActive: true,
      };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(invalidLoginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('ควรจัดการกรณี special characters ใน username', async () => {
      // Arrange
      const specialCharLoginDto = { username: 'user@#$%', password: 'password123' };
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(specialCharLoginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('ควรจัดการกรณี very long password', async () => {
      // Arrange
      const longPassword = 'a'.repeat(1000);
      const userData = {
        username: 'testuser',
        password: longPassword,
        name: 'Test User',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$10$hashedpassword' as never);
      mockUserRepository.create.mockReturnValue({});
      mockUserRepository.save.mockResolvedValue({});

      // Act
      await service.createUser(userData);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, 10);
    });
  });
});
