
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import playbookService from '../../src/playbook/playbookService';
import Playbook from '../../src/playbook/playbookModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
jest.mock('../../src/playbook/playbookModel');
jest.mock('../../src/server', () => ({ io: { emit: jest.fn() } }));

describe('PlaybookService', () => {
    const mockPlaybook: any = {
        id: 'pb-1',
        name: 'Standard Sales Playbook',
        description: 'A guide for the sales process',
        tenantId: 'tenant-1',
        stages: [
            { id: 's1', name: 'Prospecting', order: 1, steps: [], tips: [] },
            { id: 's2', name: 'Qualification', order: 2, steps: [], tips: [] },
        ],
        update: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
        destroy: (jest.fn() as jest.Mock<any>).mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // getPlaybooks
    // --------------------------------------------------------------------------
    describe('getPlaybooks', () => {
        it('should return all playbooks for a tenant', async () => {
            (Playbook.count as jest.Mock<any>).mockResolvedValue(1); // skip seeding
            (Playbook.findAll as jest.Mock<any>).mockResolvedValue([mockPlaybook]);

            const result = await playbookService.getPlaybooks('tenant-1');
            expect(result).toHaveLength(1);
            expect(Playbook.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { tenantId: 'tenant-1' } })
            );
        });

        it('should seed defaults when no playbooks exist', async () => {
            (Playbook.count as jest.Mock<any>).mockResolvedValue(0);
            (Playbook.create as jest.Mock<any>).mockResolvedValue(mockPlaybook);
            (Playbook.findAll as jest.Mock<any>).mockResolvedValue([mockPlaybook]);

            const result = await playbookService.getPlaybooks('tenant-1');
            expect(Playbook.create).toHaveBeenCalled(); // Default playbook seeded
            expect(result).toHaveLength(1);
        });

        it('should return all playbooks without tenant filter when tenantId is undefined', async () => {
            (Playbook.count as jest.Mock<any>).mockResolvedValue(1);
            (Playbook.findAll as jest.Mock<any>).mockResolvedValue([mockPlaybook]);

            await playbookService.getPlaybooks();
            expect(Playbook.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: {} })
            );
        });
    });

    // --------------------------------------------------------------------------
    // getPlaybookById
    // --------------------------------------------------------------------------
    describe('getPlaybookById', () => {
        it('should return a playbook by id', async () => {
            (Playbook.findByPk as jest.Mock<any>).mockResolvedValue(mockPlaybook);
            const result = await playbookService.getPlaybookById('pb-1');
            expect(result).toEqual(mockPlaybook);
        });

        it('should throw NOT_FOUND when playbook does not exist', async () => {
            (Playbook.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(playbookService.getPlaybookById('missing'))
                .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
        });
    });

    // --------------------------------------------------------------------------
    // createPlaybook
    // --------------------------------------------------------------------------
    describe('createPlaybook', () => {
        it('should create a new playbook', async () => {
            (Playbook.create as jest.Mock<any>).mockResolvedValue(mockPlaybook);
            const result = await playbookService.createPlaybook({
                name: 'Custom Playbook',
                stages: [],
            }, 'tenant-1');
            expect(Playbook.create).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Custom Playbook', tenantId: 'tenant-1' })
            );
            expect(result).toEqual(mockPlaybook);
        });

        it('should create playbook without tenantId', async () => {
            (Playbook.create as jest.Mock<any>).mockResolvedValue(mockPlaybook);
            await playbookService.createPlaybook({ name: 'Test' });
            expect(Playbook.create).toHaveBeenCalledWith(
                expect.objectContaining({ tenantId: undefined })
            );
        });
    });

    // --------------------------------------------------------------------------
    // updatePlaybook
    // --------------------------------------------------------------------------
    describe('updatePlaybook', () => {
        it('should update the playbook when found', async () => {
            (Playbook.findByPk as jest.Mock<any>).mockResolvedValue(mockPlaybook);
            const result = await playbookService.updatePlaybook('pb-1', { name: 'Updated Playbook' });
            expect(mockPlaybook.update).toHaveBeenCalledWith({ name: 'Updated Playbook' });
            expect(result).toEqual(mockPlaybook);
        });

        it('should throw NOT_FOUND when updating non-existent playbook', async () => {
            (Playbook.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(playbookService.updatePlaybook('missing', { name: 'x' }))
                .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
        });

        it('should allow updating stages', async () => {
            (Playbook.findByPk as jest.Mock<any>).mockResolvedValue(mockPlaybook);
            const newStages = [{ id: 's-new', name: 'New Stage', order: 1, steps: [], tips: [] }];
            await playbookService.updatePlaybook('pb-1', { stages: newStages });
            expect(mockPlaybook.update).toHaveBeenCalledWith({ stages: newStages });
        });
    });

    // --------------------------------------------------------------------------
    // deletePlaybook
    // --------------------------------------------------------------------------
    describe('deletePlaybook', () => {
        it('should delete the playbook when found', async () => {
            (Playbook.findByPk as jest.Mock<any>).mockResolvedValue(mockPlaybook);
            await playbookService.deletePlaybook('pb-1');
            expect(mockPlaybook.destroy).toHaveBeenCalled();
        });

        it('should throw NOT_FOUND when deleting non-existent playbook', async () => {
            (Playbook.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(playbookService.deletePlaybook('missing'))
                .rejects.toThrow(new BaseError(ERRORS.NOT_FOUND));
        });
    });
});
