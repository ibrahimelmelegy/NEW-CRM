/**
 * useDeals - Unit Tests
 * =======================
 * Tests for composables/useDeals.ts
 */

import { describe, it, expect, vi } from 'vitest';
import {
  type Deal,
  DealStageEnums,
  ContractTypeEnums,
  dealStageOptions,
  contractTypeOptions,
  type Delivery,
  type Invoice
} from '@/composables/useDeals';

// Mock the API fetch
vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: vi.fn()
}));

describe('useDeals.ts', () => {
  // ============================================
  // DealStageEnums
  // ============================================
  describe('DealStageEnums', () => {
    it('should have correct values', () => {
      expect(DealStageEnums.PROGRESS).toBe('PROGRESS');
      expect(DealStageEnums.CLOSED).toBe('CLOSED');
      expect(DealStageEnums.CANCELLED).toBe('CANCELLED');
    });

    it('should have 3 stages', () => {
      const values = Object.values(DealStageEnums);
      expect(values).toHaveLength(3);
    });
  });

  // ============================================
  // ContractTypeEnums
  // ============================================
  describe('ContractTypeEnums', () => {
    it('should have correct values', () => {
      expect(ContractTypeEnums.Contract).toBe('Contract');
      expect(ContractTypeEnums.PurchaseOrder).toBe('PurchaseOrder');
    });

    it('should have 2 types', () => {
      const values = Object.values(ContractTypeEnums);
      expect(values).toHaveLength(2);
    });
  });

  // ============================================
  // dealStageOptions
  // ============================================
  describe('dealStageOptions', () => {
    it('should have 3 stage options', () => {
      expect(dealStageOptions).toHaveLength(3);
    });

    it('should have correct structure', () => {
      dealStageOptions.forEach(option => {
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('value');
      });
    });

    it('should include In Progress option', () => {
      const progress = dealStageOptions.find(o => o.value === DealStageEnums.PROGRESS);
      expect(progress).toBeDefined();
      expect(progress?.label).toBe('In Progress');
    });

    it('should include Closed option', () => {
      const closed = dealStageOptions.find(o => o.value === DealStageEnums.CLOSED);
      expect(closed).toBeDefined();
      expect(closed?.label).toBe('Closed');
    });
  });

  // ============================================
  // contractTypeOptions
  // ============================================
  describe('contractTypeOptions', () => {
    it('should have 2 contract type options', () => {
      expect(contractTypeOptions).toHaveLength(2);
    });

    it('should include Contract option', () => {
      const contract = contractTypeOptions.find(o => o.value === ContractTypeEnums.Contract);
      expect(contract).toBeDefined();
      expect(contract?.label).toBe('Contract');
    });

    it('should include Purchase Order option', () => {
      const po = contractTypeOptions.find(o => o.value === ContractTypeEnums.PurchaseOrder);
      expect(po).toBeDefined();
      expect(po?.label).toBe('Purchase Order');
    });
  });

  // ============================================
  // Deal Interface
  // ============================================
  describe('Deal interface', () => {
    it('should create valid Deal object', () => {
      const deal: Deal = {
        name: 'Test Deal',
        companyName: 'Test Company',
        price: 50000,
        contractType: ContractTypeEnums.Contract,
        stage: 'PROGRESS',
        signatureDate: '2024-01-15'
      };

      expect(deal.name).toBe('Test Deal');
      expect(deal.price).toBe(50000);
      expect(deal.stage).toBe('PROGRESS');
    });

    it('should allow optional fields', () => {
      const deal: Deal = {
        name: 'Minimal Deal'
      };

      expect(deal.name).toBe('Minimal Deal');
      expect(deal.price).toBeUndefined();
    });
  });

  // ============================================
  // Delivery Interface
  // ============================================
  describe('Delivery interface', () => {
    it('should create valid Delivery object', () => {
      const delivery: Delivery = {
        id: 'delivery-123',
        deliveryDetails: 'Deliver to main office',
        deliveryDate: new Date('2024-02-01')
      };

      expect(delivery.id).toBe('delivery-123');
      expect(delivery.deliveryDetails).toBe('Deliver to main office');
    });

    it('should allow null delivery date', () => {
      const delivery: Delivery = {
        id: 'delivery-456',
        deliveryDetails: 'TBD',
        deliveryDate: null
      };

      expect(delivery.deliveryDate).toBeNull();
    });
  });

  // ============================================
  // Invoice Interface
  // ============================================
  describe('Invoice interface', () => {
    it('should create valid Invoice object', () => {
      const invoice: Invoice = {
        id: 'inv-123',
        invoiceNumber: 'INV-2024-001',
        amount: 25000,
        invoiceDate: new Date('2024-01-01'),
        dueDate: new Date('2024-02-01'),
        collectedDate: null,
        collected: false
      };

      expect(invoice.invoiceNumber).toBe('INV-2024-001');
      expect(invoice.amount).toBe(25000);
      expect(invoice.collected).toBe(false);
    });

    it('should mark invoice as collected', () => {
      const invoice: Invoice = {
        id: 'inv-456',
        invoiceNumber: 'INV-2024-002',
        amount: 15000,
        invoiceDate: new Date('2024-01-15'),
        collectedDate: new Date('2024-01-20'),
        collected: true
      };

      expect(invoice.collected).toBe(true);
      expect(invoice.collectedDate).not.toBeNull();
    });
  });
});
