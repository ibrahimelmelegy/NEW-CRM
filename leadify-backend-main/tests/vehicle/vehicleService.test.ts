
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import vehicleService from '../../src/vehicle/vehicle.service';
import { Vehicle } from '../../src/vehicle/vehicle.model';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
jest.mock('../../src/vehicle/vehicle.model');
jest.mock('../../src/utils/emailHelper');
jest.mock('../../src/server', () => ({ io: { emit: jest.fn() } }));

describe('VehicleService', () => {
    const mockVehicle: any = {
        id: 1,
        plate: 'ABC-1234',
        manufacturer: 'Toyota',
        rentCost: 100,
        gasCost: 50,
        oilCost: 30,
        regularMaintenanceCost: 200,
        createdAt: '2026-01-01',
        set: jest.fn(),
        save: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // createVehicle
    // --------------------------------------------------------------------------
    describe('createVehicle', () => {
        it('should create a vehicle when plate is unique', async () => {
            (Vehicle.findOne as jest.Mock<any>).mockResolvedValue(null);
            (Vehicle.create as jest.Mock<any>).mockResolvedValue(mockVehicle);

            const result = await vehicleService.createVehicle({ plate: 'ABC-1234', manufacturer: 'Toyota' } as any);
            expect(Vehicle.create).toHaveBeenCalledWith(expect.objectContaining({ plate: 'ABC-1234' }));
            expect(result).toEqual(mockVehicle);
        });

        it('should throw VEHICLE_ALREADY_EXIST if plate is duplicate', async () => {
            (Vehicle.findOne as jest.Mock<any>).mockResolvedValue(mockVehicle);

            await expect(vehicleService.createVehicle({ plate: 'ABC-1234' } as any))
                .rejects.toThrow(new BaseError(ERRORS.VEHICLE_ALREADY_EXIST));
        });
    });

    // --------------------------------------------------------------------------
    // getVehicle
    // --------------------------------------------------------------------------
    describe('getVehicle', () => {
        it('should return a vehicle by id', async () => {
            (Vehicle.findByPk as jest.Mock<any>).mockResolvedValue(mockVehicle);
            const result = await vehicleService.getVehicle('1');
            expect(result).toEqual(mockVehicle);
        });

        it('should throw VEHICLE_NOT_FOUND when vehicle does not exist', async () => {
            (Vehicle.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(vehicleService.getVehicle('999'))
                .rejects.toThrow(new BaseError(ERRORS.VEHICLE_NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // getVehicles
    // --------------------------------------------------------------------------
    describe('getVehicles', () => {
        it('should return paginated vehicles', async () => {
            (Vehicle.findAndCountAll as jest.Mock<any>).mockResolvedValue({
                rows: [mockVehicle],
                count: 1,
            });

            const result = await vehicleService.getVehicles({ page: 1, limit: 10 } as any);
            expect(result.docs).toHaveLength(1);
            expect(result.pagination.totalItems).toBe(1);
            expect(result.pagination.page).toBe(1);
        });

        it('should use default page and limit when not provided', async () => {
            (Vehicle.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 0 });

            const result = await vehicleService.getVehicles({} as any);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(10);
        });

        it('should compute totalPages correctly', async () => {
            (Vehicle.findAndCountAll as jest.Mock<any>).mockResolvedValue({ rows: [], count: 25 });

            const result = await vehicleService.getVehicles({ page: 1, limit: 10 } as any);
            expect(result.pagination.totalPages).toBe(3);
        });
    });

    // --------------------------------------------------------------------------
    // updateVehicle
    // --------------------------------------------------------------------------
    describe('updateVehicle', () => {
        it('should update vehicle when plate is unique', async () => {
            (Vehicle.findByPk as jest.Mock<any>).mockResolvedValue(mockVehicle);
            (Vehicle.findOne as jest.Mock<any>).mockResolvedValue(null); // no collision

            const result = await vehicleService.updateVehicle({ vehicleId: '1', plate: 'XYZ-9999' } as any);
            expect(mockVehicle.set).toHaveBeenCalledWith(expect.objectContaining({ plate: 'XYZ-9999' }));
            expect(mockVehicle.save).toHaveBeenCalled();
        });

        it('should throw VEHICLE_NOT_FOUND when vehicle does not exist', async () => {
            (Vehicle.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(vehicleService.updateVehicle({ vehicleId: '999', plate: 'ABC' } as any))
                .rejects.toThrow(new BaseError(ERRORS.VEHICLE_NOT_FOUND));
        });

        it('should throw VEHICLE_ALREADY_EXIST when plate collides with another vehicle', async () => {
            (Vehicle.findByPk as jest.Mock<any>).mockResolvedValue(mockVehicle);
            (Vehicle.findOne as jest.Mock<any>).mockResolvedValue({ id: 2, plate: 'EXISTING' });

            await expect(vehicleService.updateVehicle({ vehicleId: '1', plate: 'EXISTING' } as any))
                .rejects.toThrow(new BaseError(ERRORS.VEHICLE_ALREADY_EXIST));
        });
    });
});
