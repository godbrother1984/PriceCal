// path: server/src/bom/bom.service.spec.ts
// version: 1.0 (Unit Tests for BomService - Hybrid BOQ Management)
// last-modified: 14 ตุลาคม 2568 15:00

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BomService } from './bom.service';
import { BOM } from '../entities/bom.entity';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';

describe('BomService', () => {
  let service: BomService;
  let bomRepository: Repository<BOM>;
  let productRepository: Repository<Product>;
  let rawMaterialRepository: Repository<RawMaterial>;

  // Mock Repositories
  const mockBomRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockRawMaterialRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BomService,
        {
          provide: getRepositoryToken(BOM),
          useValue: mockBomRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(RawMaterial),
          useValue: mockRawMaterialRepository,
        },
      ],
    }).compile();

    service = module.get<BomService>(BomService);
    bomRepository = module.get<Repository<BOM>>(getRepositoryToken(BOM));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    rawMaterialRepository = module.get<Repository<RawMaterial>>(getRepositoryToken(RawMaterial));

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBOMItems', () => {
    it('ควร return BOQ items ทั้งหมดของ product', async () => {
      // Arrange
      const productId = 'PROD-001';
      const mockBomItems = [
        {
          id: 'BOM-001',
          productId,
          rawMaterialId: 'RM-001',
          quantity: 2.5,
          unit: 'kg',
          bomSource: 'D365',
          isEditable: false,
          isActive: true,
          rawMaterial: { id: 'RM-001', name: 'Steel' },
        },
        {
          id: 'BOM-002',
          productId,
          rawMaterialId: 'RM-002',
          quantity: 1.0,
          unit: 'kg',
          bomSource: 'PRICECAL',
          isEditable: true,
          isActive: true,
          rawMaterial: { id: 'RM-002', name: 'Aluminum' },
        },
      ];

      mockBomRepository.find.mockResolvedValue(mockBomItems);

      // Act
      const result = await service.getBOMItems(productId);

      // Assert
      expect(bomRepository.find).toHaveBeenCalledWith({
        where: { productId, isActive: true },
        relations: ['rawMaterial'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(mockBomItems);
      expect(result).toHaveLength(2);
    });

    it('ควร return empty array เมื่อไม่มี BOQ items', async () => {
      // Arrange
      mockBomRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getBOMItems('PROD-001');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getBOMItem', () => {
    it('ควร return BOQ item ตาม ID', async () => {
      // Arrange
      const mockBomItem = {
        id: 'BOM-001',
        productId: 'PROD-001',
        rawMaterialId: 'RM-001',
        quantity: 2.5,
        unit: 'kg',
        rawMaterial: { id: 'RM-001', name: 'Steel' },
        product: { id: 'PROD-001', name: 'Test Product' },
      };

      mockBomRepository.findOne.mockResolvedValue(mockBomItem);

      // Act
      const result = await service.getBOMItem('BOM-001');

      // Assert
      expect(bomRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'BOM-001' },
        relations: ['rawMaterial', 'product'],
      });
      expect(result).toEqual(mockBomItem);
    });

    it('ควร throw NotFoundException เมื่อไม่พบ BOQ item', async () => {
      // Arrange
      mockBomRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getBOMItem('BOM-999')).rejects.toThrow(NotFoundException);
      await expect(service.getBOMItem('BOM-999')).rejects.toThrow('BOQ item with ID BOM-999 not found');
    });
  });

  describe('createBOMItem', () => {
    const bomData = {
      productId: 'PROD-001',
      rawMaterialId: 'RM-001',
      quantity: 2.5,
      unit: 'kg',
      notes: 'Test notes',
      createdBy: 'user-123',
    };

    it('ควรสร้าง BOQ item สำเร็จ', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue({
        id: 'PROD-001',
        name: 'Test Product',
      });
      mockRawMaterialRepository.findOne.mockResolvedValue({
        id: 'RM-001',
        name: 'Steel',
      });
      mockBomRepository.findOne.mockResolvedValue(null); // ไม่มี duplicate
      mockBomRepository.create.mockReturnValue({
        ...bomData,
        bomSource: 'PRICECAL',
        isEditable: true,
      });
      mockBomRepository.save.mockResolvedValue({
        id: 'BOM-NEW',
        ...bomData,
      });
      mockProductRepository.update.mockResolvedValue({});

      // Act
      const result = await service.createBOMItem(bomData);

      // Assert
      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: bomData.productId },
      });
      expect(rawMaterialRepository.findOne).toHaveBeenCalledWith({
        where: { id: bomData.rawMaterialId },
      });
      expect(bomRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: bomData.productId,
          rawMaterialId: bomData.rawMaterialId,
          quantity: bomData.quantity,
          unit: bomData.unit,
          bomSource: 'PRICECAL',
          isEditable: true,
        }),
      );
      expect(productRepository.update).toHaveBeenCalledWith(bomData.productId, { hasBOQ: true });
      expect(result).toBeDefined();
    });

    it('ควร throw NotFoundException เมื่อไม่พบ Product', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createBOMItem(bomData)).rejects.toThrow(NotFoundException);
      await expect(service.createBOMItem(bomData)).rejects.toThrow(
        `Product with ID ${bomData.productId} not found`,
      );
    });

    it('ควร throw NotFoundException เมื่อไม่พบ Raw Material', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue({ id: 'PROD-001' });
      mockRawMaterialRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createBOMItem(bomData)).rejects.toThrow(NotFoundException);
      await expect(service.createBOMItem(bomData)).rejects.toThrow(
        `Raw Material with ID ${bomData.rawMaterialId} not found`,
      );
    });

    it('ควร throw BadRequestException เมื่อ BOQ item ซ้ำ', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue({ id: 'PROD-001' });
      mockRawMaterialRepository.findOne.mockResolvedValue({ id: 'RM-001' });
      mockBomRepository.findOne.mockResolvedValue({
        id: 'BOM-EXISTING',
        productId: bomData.productId,
        rawMaterialId: bomData.rawMaterialId,
      });

      // Act & Assert
      await expect(service.createBOMItem(bomData)).rejects.toThrow(BadRequestException);
      await expect(service.createBOMItem(bomData)).rejects.toThrow('BOQ item already exists');
    });
  });

  describe('updateBOMItem', () => {
    const updateData = {
      quantity: 3.0,
      unit: 'kg',
      notes: 'Updated notes',
      updatedBy: 'user-123',
    };

    it('ควร update BOQ item สำเร็จเมื่อ isEditable = true', async () => {
      // Arrange
      const mockBomItem = {
        id: 'BOM-001',
        productId: 'PROD-001',
        rawMaterialId: 'RM-001',
        quantity: 2.5,
        unit: 'kg',
        bomSource: 'PRICECAL',
        isEditable: true,
        rawMaterial: { id: 'RM-001', name: 'Steel' },
        product: { id: 'PROD-001', name: 'Test Product' },
      };

      mockBomRepository.findOne.mockResolvedValue(mockBomItem);
      mockBomRepository.save.mockResolvedValue({
        ...mockBomItem,
        ...updateData,
      });

      // Act
      const result = await service.updateBOMItem('BOM-001', updateData);

      // Assert
      expect(bomRepository.save).toHaveBeenCalled();
      expect(result.quantity).toBe(updateData.quantity);
      expect(result.notes).toBe(updateData.notes);
    });

    it('ควร throw BadRequestException เมื่อ isEditable = false', async () => {
      // Arrange
      const mockBomItem = {
        id: 'BOM-001',
        productId: 'PROD-001',
        rawMaterialId: 'RM-001',
        quantity: 2.5,
        unit: 'kg',
        bomSource: 'D365',
        isEditable: false,
        rawMaterial: { id: 'RM-001', name: 'Steel' },
        product: { id: 'PROD-001', name: 'Test Product' },
      };

      mockBomRepository.findOne.mockResolvedValue(mockBomItem);

      // Act & Assert
      await expect(service.updateBOMItem('BOM-001', updateData)).rejects.toThrow(BadRequestException);
      await expect(service.updateBOMItem('BOM-001', updateData)).rejects.toThrow(
        'BOQ item from D365 cannot be edited',
      );
    });

    it('ควร throw NotFoundException เมื่อไม่พบ BOQ item', async () => {
      // Arrange
      mockBomRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateBOMItem('BOM-999', updateData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBOMItem', () => {
    it('ควรลบ BOQ item สำเร็จเมื่อ isEditable = true', async () => {
      // Arrange
      const mockBomItem = {
        id: 'BOM-001',
        productId: 'PROD-001',
        bomSource: 'PRICECAL',
        isEditable: true,
        rawMaterial: { id: 'RM-001', name: 'Steel' },
        product: { id: 'PROD-001', name: 'Test Product' },
      };

      mockBomRepository.findOne.mockResolvedValue(mockBomItem);
      mockBomRepository.update.mockResolvedValue({});
      mockBomRepository.count.mockResolvedValue(0); // ไม่มี BOQ เหลือ

      // Act
      await service.deleteBOMItem('BOM-001');

      // Assert
      expect(bomRepository.update).toHaveBeenCalledWith('BOM-001', { isActive: false });
      expect(productRepository.update).toHaveBeenCalledWith('PROD-001', { hasBOQ: false });
    });

    it('ควร throw BadRequestException เมื่อ isEditable = false', async () => {
      // Arrange
      const mockBomItem = {
        id: 'BOM-001',
        productId: 'PROD-001',
        bomSource: 'D365',
        isEditable: false,
        rawMaterial: { id: 'RM-001', name: 'Steel' },
        product: { id: 'PROD-001', name: 'Test Product' },
      };

      mockBomRepository.findOne.mockResolvedValue(mockBomItem);

      // Act & Assert
      await expect(service.deleteBOMItem('BOM-001')).rejects.toThrow(BadRequestException);
      await expect(service.deleteBOMItem('BOM-001')).rejects.toThrow(
        'BOQ item from D365 cannot be deleted',
      );
    });

    it('ควรไม่ update hasBOQ เป็น false ถ้ายังมี BOQ items เหลือ', async () => {
      // Arrange
      const mockBomItem = {
        id: 'BOM-001',
        productId: 'PROD-001',
        bomSource: 'PRICECAL',
        isEditable: true,
        rawMaterial: { id: 'RM-001', name: 'Steel' },
        product: { id: 'PROD-001', name: 'Test Product' },
      };

      mockBomRepository.findOne.mockResolvedValue(mockBomItem);
      mockBomRepository.update.mockResolvedValue({});
      mockBomRepository.count.mockResolvedValue(2); // ยังมี BOQ 2 รายการ

      // Act
      await service.deleteBOMItem('BOM-001');

      // Assert
      expect(productRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('copyBOM', () => {
    it('ควร copy BOQ จาก source product ไป target product สำเร็จ', async () => {
      // Arrange
      const sourceProductId = 'PROD-001';
      const targetProductId = 'PROD-002';

      mockProductRepository.findOne
        .mockResolvedValueOnce({ id: sourceProductId, name: 'Source Product' })
        .mockResolvedValueOnce({ id: targetProductId, name: 'Target Product' });

      const sourceBomItems = [
        {
          id: 'BOM-001',
          productId: sourceProductId,
          rawMaterialId: 'RM-001',
          quantity: 2.5,
          unit: 'kg',
          notes: 'Original notes',
        },
        {
          id: 'BOM-002',
          productId: sourceProductId,
          rawMaterialId: 'RM-002',
          quantity: 1.0,
          unit: 'kg',
          notes: '',
        },
      ];

      mockBomRepository.find.mockResolvedValue(sourceBomItems);
      mockBomRepository.count.mockResolvedValue(0); // Target ยังไม่มี BOQ
      mockBomRepository.create.mockImplementation((data) => data);
      mockBomRepository.save.mockImplementation((data) => Promise.resolve(data));
      mockProductRepository.update.mockResolvedValue({});

      // Act
      const result = await service.copyBOM(sourceProductId, targetProductId, 'user-123');

      // Assert
      expect(productRepository.findOne).toHaveBeenCalledTimes(2);
      expect(bomRepository.create).toHaveBeenCalledTimes(2);
      expect(bomRepository.save).toHaveBeenCalledTimes(2);
      expect(productRepository.update).toHaveBeenCalledWith(targetProductId, { hasBOQ: true });
      expect(result).toHaveLength(2);
      expect(result[0].productId).toBe(targetProductId);
      expect(result[0].bomSource).toBe('PRICECAL');
      expect(result[0].isEditable).toBe(true);
    });

    it('ควร throw NotFoundException เมื่อไม่พบ source product', async () => {
      // Arrange
      mockProductRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.copyBOM('PROD-999', 'PROD-002')).rejects.toThrow(NotFoundException);
      await expect(service.copyBOM('PROD-999', 'PROD-002')).rejects.toThrow(
        'Source product with ID PROD-999 not found',
      );
    });

    it('ควร throw NotFoundException เมื่อไม่พบ target product', async () => {
      // Arrange
      mockProductRepository.findOne
        .mockResolvedValueOnce({ id: 'PROD-001' })
        .mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.copyBOM('PROD-001', 'PROD-999')).rejects.toThrow(NotFoundException);
      await expect(service.copyBOM('PROD-001', 'PROD-999')).rejects.toThrow(
        'Target product with ID PROD-999 not found',
      );
    });

    it('ควร throw BadRequestException เมื่อ source ไม่มี BOQ', async () => {
      // Arrange
      mockProductRepository.findOne
        .mockResolvedValueOnce({ id: 'PROD-001' })
        .mockResolvedValueOnce({ id: 'PROD-002' });
      mockBomRepository.find.mockResolvedValue([]);

      // Act & Assert
      await expect(service.copyBOM('PROD-001', 'PROD-002')).rejects.toThrow(BadRequestException);
      await expect(service.copyBOM('PROD-001', 'PROD-002')).rejects.toThrow(
        'Source product PROD-001 has no BOQ items',
      );
    });

    it('ควร throw BadRequestException เมื่อ target มี BOQ อยู่แล้ว', async () => {
      // Arrange
      mockProductRepository.findOne
        .mockResolvedValueOnce({ id: 'PROD-001' })
        .mockResolvedValueOnce({ id: 'PROD-002' });
      mockBomRepository.find.mockResolvedValue([{ id: 'BOM-001' }]);
      mockBomRepository.count.mockResolvedValue(2); // มี BOQ อยู่แล้ว

      // Act & Assert
      await expect(service.copyBOM('PROD-001', 'PROD-002')).rejects.toThrow(BadRequestException);
      await expect(service.copyBOM('PROD-001', 'PROD-002')).rejects.toThrow(
        'Target product PROD-002 already has BOQ items',
      );
    });
  });

  describe('getBOMSummary', () => {
    it('ควร return summary ของ BOQ อย่างถูกต้อง', async () => {
      // Arrange
      const mockBomItems = [
        { id: 'BOM-001', bomSource: 'D365', isEditable: false },
        { id: 'BOM-002', bomSource: 'D365', isEditable: false },
        { id: 'BOM-003', bomSource: 'PRICECAL', isEditable: true },
        { id: 'BOM-004', bomSource: 'PRICECAL', isEditable: true },
        { id: 'BOM-005', bomSource: 'PRICECAL', isEditable: true },
      ];

      mockBomRepository.find.mockResolvedValue(mockBomItems);

      // Act
      const result = await service.getBOMSummary('PROD-001');

      // Assert
      expect(result.totalItems).toBe(5);
      expect(result.editableItems).toBe(3);
      expect(result.readonlyItems).toBe(2);
      expect(result.sources).toHaveLength(2);
      expect(result.sources).toContainEqual({ source: 'D365', count: 2 });
      expect(result.sources).toContainEqual({ source: 'PRICECAL', count: 3 });
    });

    it('ควร return summary ว่างเมื่อไม่มี BOQ', async () => {
      // Arrange
      mockBomRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getBOMSummary('PROD-001');

      // Assert
      expect(result.totalItems).toBe(0);
      expect(result.editableItems).toBe(0);
      expect(result.readonlyItems).toBe(0);
      expect(result.sources).toHaveLength(0);
    });
  });

  describe('isBOMEditable', () => {
    it('ควร return true เมื่อ BOQ ทั้งหมด editable', async () => {
      // Arrange
      const mockBomItems = [
        { id: 'BOM-001', bomSource: 'PRICECAL', isEditable: true },
        { id: 'BOM-002', bomSource: 'PRICECAL', isEditable: true },
      ];

      mockBomRepository.find.mockResolvedValue(mockBomItems);

      // Act
      const result = await service.isBOMEditable('PROD-001');

      // Assert
      expect(result).toBe(true);
    });

    it('ควร return false เมื่อมี BOQ บางรายการไม่ editable', async () => {
      // Arrange
      const mockBomItems = [
        { id: 'BOM-001', bomSource: 'D365', isEditable: false },
        { id: 'BOM-002', bomSource: 'PRICECAL', isEditable: true },
      ];

      mockBomRepository.find.mockResolvedValue(mockBomItems);

      // Act
      const result = await service.isBOMEditable('PROD-001');

      // Assert
      expect(result).toBe(false);
    });

    it('ควร return true เมื่อไม่มี BOQ', async () => {
      // Arrange
      mockBomRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.isBOMEditable('PROD-001');

      // Assert
      expect(result).toBe(true); // every() returns true for empty array
    });
  });
});
