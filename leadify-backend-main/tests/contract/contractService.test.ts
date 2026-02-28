
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('../../src/contract/contractModel');
jest.mock('../../src/deal/model/dealModel');
jest.mock('../../src/utils/emailHelper');
jest.mock('../../src/server', () => ({
    io: { emit: jest.fn() }
}));

import contractService from '../../src/contract/contractService';
import Contract from '../../src/contract/contractModel';
import { ContractStatus } from '../../src/contract/contractEnum';

describe('ContractService', () => {
    const mockUserId = 1;

    const mockContract: any = {
        id: 'contract-uuid-1',
        title: 'Service Agreement',
        content: '<p>Contract content</p>',
        status: ContractStatus.DRAFT,
        signerEmail: 'signer@test.com',
        signingToken: 'abc123token',
        userId: mockUserId,
        expiresAt: null,
        update: (jest.fn() as jest.Mock<any>).mockImplementation(function (this: any, data: any) {
            Object.assign(this, data);
            return Promise.resolve(this);
        }),
        destroy: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------------
    // 1. getAll
    // --------------------------------------------------------------------------
    describe('getAll', () => {
        it('should return all contracts for a user', async () => {
            const mockContracts = [mockContract];
            (Contract.findAll as jest.Mock<any>).mockResolvedValue(mockContracts);

            const result = await contractService.getAll(mockUserId);

            expect(result).toEqual(mockContracts);
            expect(Contract.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { userId: mockUserId } })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 2. getById
    // --------------------------------------------------------------------------
    describe('getById', () => {
        it('should return contract by id', async () => {
            (Contract.findByPk as jest.Mock<any>).mockResolvedValue(mockContract);

            const result = await contractService.getById('contract-uuid-1');
            expect(result).toEqual(mockContract);
        });

        it('should throw when contract not found', async () => {
            (Contract.findByPk as jest.Mock<any>).mockResolvedValue(null);

            await expect(contractService.getById('nonexistent'))
                .rejects.toThrow('Contract not found');
        });
    });

    // --------------------------------------------------------------------------
    // 3. create
    // --------------------------------------------------------------------------
    describe('create', () => {
        it('should create a contract with DRAFT status and signing token', async () => {
            (Contract.create as jest.Mock<any>).mockResolvedValue(mockContract);

            const data = { title: 'New Contract', content: 'Content' };
            const result = await contractService.create(mockUserId, data);

            expect(result).toEqual(mockContract);
            expect(Contract.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'New Contract',
                    content: 'Content',
                    userId: mockUserId,
                    status: ContractStatus.DRAFT,
                    signingToken: expect.any(String),
                })
            );
        });
    });

    // --------------------------------------------------------------------------
    // 4. update
    // --------------------------------------------------------------------------
    describe('update', () => {
        it('should update a draft contract', async () => {
            const draftContract = { ...mockContract, status: ContractStatus.DRAFT, update: jest.fn().mockResolvedValue(true) };
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(draftContract);

            await contractService.update('contract-uuid-1', mockUserId, { title: 'Updated' });

            expect(draftContract.update).toHaveBeenCalledWith({ title: 'Updated' });
        });

        it('should throw when contract not found', async () => {
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(contractService.update('nonexistent', mockUserId, { title: 'X' }))
                .rejects.toThrow('Contract not found');
        });

        it('should throw when trying to edit signed contract', async () => {
            const signedContract = { ...mockContract, status: ContractStatus.SIGNED };
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(signedContract);

            await expect(contractService.update('contract-uuid-1', mockUserId, { title: 'X' }))
                .rejects.toThrow('Cannot edit signed contract');
        });
    });

    // --------------------------------------------------------------------------
    // 5. delete
    // --------------------------------------------------------------------------
    describe('delete', () => {
        it('should delete a contract', async () => {
            const contractToDelete = { ...mockContract, destroy: jest.fn().mockResolvedValue(true) };
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(contractToDelete);

            await contractService.delete('contract-uuid-1', mockUserId);

            expect(contractToDelete.destroy).toHaveBeenCalled();
        });

        it('should throw when contract not found', async () => {
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(contractService.delete('nonexistent', mockUserId))
                .rejects.toThrow('Contract not found');
        });
    });

    // --------------------------------------------------------------------------
    // 6. getByToken
    // --------------------------------------------------------------------------
    describe('getByToken', () => {
        it('should return contract and update status from SENT to VIEWED', async () => {
            const sentContract = {
                ...mockContract,
                status: ContractStatus.SENT,
                expiresAt: new Date(Date.now() + 86400000), // tomorrow
                update: jest.fn().mockResolvedValue(true),
            };
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(sentContract);

            const result = await contractService.getByToken('abc123token');

            expect(result).toBeDefined();
            expect(sentContract.update).toHaveBeenCalledWith({ status: ContractStatus.VIEWED });
        });

        it('should throw when contract not found by token', async () => {
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(contractService.getByToken('invalid-token'))
                .rejects.toThrow('Contract not found');
        });

        it('should throw when contract already signed', async () => {
            const signed = { ...mockContract, status: ContractStatus.SIGNED };
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(signed);

            await expect(contractService.getByToken('abc123token'))
                .rejects.toThrow('Contract already signed');
        });

        it('should throw when signing link has expired', async () => {
            const expired = {
                ...mockContract,
                status: ContractStatus.SENT,
                expiresAt: new Date(Date.now() - 86400000), // yesterday
            };
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(expired);

            await expect(contractService.getByToken('abc123token'))
                .rejects.toThrow('Signing link has expired');
        });
    });

    // --------------------------------------------------------------------------
    // 7. sign
    // --------------------------------------------------------------------------
    describe('sign', () => {
        it('should sign a contract successfully', async () => {
            const viewedContract = {
                id: 'contract-uuid-1',
                status: ContractStatus.VIEWED,
                update: jest.fn().mockResolvedValue(true),
            };
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(viewedContract);

            const result = await contractService.sign('abc123token', 'base64signature', 'John Doe');

            expect(viewedContract.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: ContractStatus.SIGNED,
                    signatureData: 'base64signature',
                    signerName: 'John Doe',
                    signatureHash: expect.any(String),
                    signedAt: expect.any(Date),
                })
            );
        });

        it('should throw when contract not found for signing', async () => {
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(null);

            await expect(contractService.sign('invalid', 'sig', 'Name'))
                .rejects.toThrow('Contract not found');
        });

        it('should throw when contract already signed', async () => {
            const signed = { ...mockContract, status: ContractStatus.SIGNED };
            (Contract.findOne as jest.Mock<any>).mockResolvedValue(signed);

            await expect(contractService.sign('abc123token', 'sig', 'Name'))
                .rejects.toThrow('Already signed');
        });
    });
});
