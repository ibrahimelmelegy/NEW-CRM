
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import shippingService from '../../src/shipping/shippingService';
import { Shipment, ShippingRate } from '../../src/shipping/shippingModel';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
jest.mock('../../src/shipping/shippingModel');
jest.mock('../../src/server', () => ({ io: { emit: jest.fn() } }));

jest.mock('../../src/utils/pagination', () => ({
    clampPagination: jest.fn((q: any) => ({
        page: q.page || 1,
        limit: q.limit || 10,
        offset: ((q.page || 1) - 1) * (q.limit || 10),
    })),
}));

describe('ShippingService', () => {
    const mockShipment: any = {
        id: 1,
        shipmentNumber: 'SHP-ABC123',
        trackingNumber: 'TRK-001',
        status: 'PREPARING',
        carrier: 'DHL',
        origin: 'Riyadh',
        destination: 'Jeddah',
        recipientName: 'John',
        weight: 5,
        shippingCost: 50,
        estimatedDelivery: '2026-03-15',
        actualDelivery: null,
        createdAt: '2026-03-01T00:00:00Z',
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    const mockRate: any = {
        id: 1,
        carrier: 'DHL',
        zone: 'domestic',
        weightMin: 0,
        weightMax: 10,
        rate: 25,
        currency: 'SAR',
        estimatedDays: 3,
        isActive: true,
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // createShipment
    // --------------------------------------------------------------------------
    describe('createShipment', () => {
        it('should create a shipment with generated shipment number', async () => {
            (Shipment.create as jest.Mock<any>).mockResolvedValue(mockShipment);
            const result = await shippingService.createShipment({ carrier: 'DHL' }, 'tenant-1');
            expect(Shipment.create).toHaveBeenCalledWith(
                expect.objectContaining({ carrier: 'DHL', tenantId: 'tenant-1', shipmentNumber: expect.any(String) })
            );
            expect(result).toEqual(mockShipment);
        });
    });

    // --------------------------------------------------------------------------
    // getShipments
    // --------------------------------------------------------------------------
    describe('getShipments', () => {
        it('should return paginated shipments', async () => {
            (Shipment.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [mockShipment], count: 1 });
            const result = await shippingService.getShipments({ page: 1, limit: 10 }, 'tenant-1');
            expect(result.docs).toHaveLength(1);
            expect(result.pagination.totalItems).toBe(1);
        });

        it('should filter by status when provided', async () => {
            (Shipment.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });
            await shippingService.getShipments({ status: 'SHIPPED' }, 'tenant-1');
            expect(Shipment.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: expect.objectContaining({ status: 'SHIPPED' }) })
            );
        });
    });

    // --------------------------------------------------------------------------
    // updateShipment
    // --------------------------------------------------------------------------
    describe('updateShipment', () => {
        it('should update and return the shipment', async () => {
            (Shipment.findByPk as jest.Mock<any>).mockResolvedValue(mockShipment);
            const result = await shippingService.updateShipment(1, { carrier: 'FedEx' });
            expect(mockShipment.update).toHaveBeenCalledWith({ carrier: 'FedEx' });
            expect(result).toEqual(mockShipment);
        });

        it('should return null when shipment not found', async () => {
            (Shipment.findByPk as jest.Mock<any>).mockResolvedValue(null);
            const result = await shippingService.updateShipment(999, { carrier: 'FedEx' });
            expect(result).toBeNull();
        });

        it('should auto-set actualDelivery when status is DELIVERED', async () => {
            const noDelivery = { ...mockShipment, actualDelivery: null, update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true) };
            (Shipment.findByPk as jest.Mock<any>).mockResolvedValue(noDelivery);
            await shippingService.updateShipment(1, { status: 'DELIVERED' });
            expect(noDelivery.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'DELIVERED', actualDelivery: expect.any(Date) })
            );
        });
    });

    // --------------------------------------------------------------------------
    // deleteShipment
    // --------------------------------------------------------------------------
    describe('deleteShipment', () => {
        it('should delete and return true', async () => {
            (Shipment.findByPk as jest.Mock<any>).mockResolvedValue(mockShipment);
            const result = await shippingService.deleteShipment(1);
            expect(mockShipment.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should return false when shipment not found', async () => {
            (Shipment.findByPk as jest.Mock<any>).mockResolvedValue(null);
            const result = await shippingService.deleteShipment(999);
            expect(result).toBe(false);
        });
    });

    // --------------------------------------------------------------------------
    // calculateShippingRate
    // --------------------------------------------------------------------------
    describe('calculateShippingRate', () => {
        it('should return cheapest matching rate', async () => {
            (ShippingRate.findAll as jest.Mock<any>).mockResolvedValue([mockRate]);
            const result = await shippingService.calculateShippingRate(5, 'domestic');
            expect(result.found).toBe(true);
            expect(result.rate).toBe(25);
            expect(result.carrier).toBe('DHL');
        });

        it('should return not found when no rates match', async () => {
            (ShippingRate.findAll as jest.Mock<any>).mockResolvedValue([]);
            const result = await shippingService.calculateShippingRate(5);
            expect(result.found).toBe(false);
        });

        it('should throw for non-positive weight', async () => {
            await expect(shippingService.calculateShippingRate(0))
                .rejects.toThrow('Weight must be a positive number');
        });
    });

    // --------------------------------------------------------------------------
    // updateShipmentStatus
    // --------------------------------------------------------------------------
    describe('updateShipmentStatus', () => {
        it('should allow valid status transitions', async () => {
            const preparing = { ...mockShipment, status: 'PREPARING', update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true) };
            (Shipment.findByPk as jest.Mock<any>).mockResolvedValue(preparing);

            const result = await shippingService.updateShipmentStatus(1, 'SHIPPED');
            expect(preparing.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'SHIPPED' }));
            expect(result).toEqual(preparing);
        });

        it('should reject invalid status transitions', async () => {
            const delivered = { ...mockShipment, status: 'DELIVERED' };
            (Shipment.findByPk as jest.Mock<any>).mockResolvedValue(delivered);

            await expect(shippingService.updateShipmentStatus(1, 'PREPARING'))
                .rejects.toThrow(/Invalid status transition/);
        });

        it('should throw if shipment not found', async () => {
            (Shipment.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(shippingService.updateShipmentStatus(999, 'SHIPPED'))
                .rejects.toThrow('Shipment not found');
        });
    });

    // --------------------------------------------------------------------------
    // getShipmentTracking
    // --------------------------------------------------------------------------
    describe('getShipmentTracking', () => {
        it('should return tracking info for a valid tracking number', async () => {
            (Shipment.findOne as jest.Mock<any>).mockResolvedValue(mockShipment);
            const result = await shippingService.getShipmentTracking('TRK-001');
            expect(result.trackingNumber).toBe('TRK-001');
            expect(result.status).toBe('PREPARING');
        });

        it('should throw for invalid tracking number', async () => {
            (Shipment.findOne as jest.Mock<any>).mockResolvedValue(null);
            await expect(shippingService.getShipmentTracking('INVALID'))
                .rejects.toThrow(/Shipment not found/);
        });
    });
});
