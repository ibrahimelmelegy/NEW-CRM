import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import customFieldService from '../../src/customField/customFieldService';
import CustomField from '../../src/customField/customFieldModel';
import CustomFieldValue from '../../src/customField/customFieldValueModel';
import BaseError from '../../src/utils/error/base-http-exception';
import { ERRORS } from '../../src/utils/error/errors';

jest.mock('../../src/customField/customFieldModel');
jest.mock('../../src/customField/customFieldValueModel');

describe('CustomFieldService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getFieldsByEntity', () => {
        it('should return active fields for a given entity type', async () => {
            const mockFields = [
                { id: 'f1', entityType: 'LEAD', fieldName: 'industry', isActive: true },
            ];
            (CustomField.findAll as jest.Mock<any>).mockResolvedValue(mockFields);
            const result = await customFieldService.getFieldsByEntity('LEAD');
            expect(CustomField.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { entityType: 'LEAD', isActive: true } })
            );
            expect(result).toEqual(mockFields);
        });
    });

    describe('getFieldById', () => {
        it('should return a field when found', async () => {
            const mockField = { id: 'f1', fieldName: 'industry' };
            (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(mockField);
            const result = await customFieldService.getFieldById('f1');
            expect(result).toEqual(mockField);
        });

        it('should throw CUSTOM_FIELD_NOT_FOUND when field does not exist', async () => {
            (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(customFieldService.getFieldById('nonexistent'))
                .rejects.toThrow(new BaseError(ERRORS.CUSTOM_FIELD_NOT_FOUND, 404));
        });
    });

    describe('createField', () => {
        it('should create a field with valid data', async () => {
            const data = {
                entityType: 'LEAD',
                fieldName: 'company_size',
                fieldLabel: 'Company Size',
                fieldType: 'NUMBER',
            };
            (CustomField.findOne as jest.Mock<any>).mockResolvedValue(null);
            (CustomField.max as jest.Mock<any>).mockResolvedValue(3);
            (CustomField.create as jest.Mock<any>).mockResolvedValue({ id: 'f1', ...data, sortOrder: 4 });
            const result = await customFieldService.createField(data);
            expect(CustomField.create).toHaveBeenCalledWith(
                expect.objectContaining({ entityType: 'LEAD', fieldName: 'company_size', sortOrder: 4 })
            );
            expect(result.id).toBe('f1');
        });

        it('should throw for invalid entity type', async () => {
            const data = { entityType: 'INVALID_TYPE', fieldName: 'test', fieldLabel: 'Test', fieldType: 'TEXT' };
            await expect(customFieldService.createField(data)).rejects.toThrow();
        });

        it('should throw for duplicate fieldName within same entityType', async () => {
            const data = { entityType: 'LEAD', fieldName: 'industry', fieldLabel: 'Industry', fieldType: 'TEXT' };
            (CustomField.findOne as jest.Mock<any>).mockResolvedValue({ id: 'existing' });
            await expect(customFieldService.createField(data)).rejects.toThrow();
        });

        it('should throw when SELECT type has no options', async () => {
            const data = { entityType: 'LEAD', fieldName: 'status', fieldLabel: 'Status', fieldType: 'SELECT', options: [] };
            (CustomField.findOne as jest.Mock<any>).mockResolvedValue(null);
            await expect(customFieldService.createField(data)).rejects.toThrow();
        });
    });

    describe('updateField', () => {
        it('should update an existing field', async () => {
            const mockField: any = {
                id: 'f1',
                fieldType: 'TEXT',
                update: jest.fn().mockImplementation(() => Promise.resolve({ id: 'f1', fieldLabel: 'Updated Label' })),
            };
            (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(mockField);
            await customFieldService.updateField('f1', { fieldLabel: 'Updated Label' });
            expect(mockField.update).toHaveBeenCalledWith({ fieldLabel: 'Updated Label' });
        });

        it('should throw when field not found', async () => {
            (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(customFieldService.updateField('nonexistent', { fieldLabel: 'X' }))
                .rejects.toThrow(new BaseError(ERRORS.CUSTOM_FIELD_NOT_FOUND, 404));
        });
    });

    describe('deleteField', () => {
        it('should soft-delete a field by setting isActive to false', async () => {
            const mockField: any = {
                id: 'f1',
                update: jest.fn().mockImplementation(() => Promise.resolve()),
            };
            (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(mockField);
            const result = await customFieldService.deleteField('f1');
            expect(mockField.update).toHaveBeenCalledWith({ isActive: false });
            expect(result).toEqual({ deleted: true });
        });

        it('should throw when field not found', async () => {
            (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(null);
            await expect(customFieldService.deleteField('nonexistent'))
                .rejects.toThrow(new BaseError(ERRORS.CUSTOM_FIELD_NOT_FOUND, 404));
        });
    });

    describe('hardDeleteField', () => {
        it('should hard-delete a field and its values', async () => {
            const mockField: any = {
                id: 'f1',
                destroy: jest.fn().mockImplementation(() => Promise.resolve()),
            };
            (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(mockField);
            (CustomFieldValue.destroy as jest.Mock<any>).mockResolvedValue(3);
            const result = await customFieldService.hardDeleteField('f1');
            expect(CustomFieldValue.destroy).toHaveBeenCalledWith({ where: { customFieldId: 'f1' } });
            expect(mockField.destroy).toHaveBeenCalled();
            expect(result).toEqual({ deleted: true });
        });
    });

    describe('validateFieldValue', () => {
        it('should allow null/empty for non-required fields', () => {
            const field: any = { isRequired: false, fieldType: 'TEXT', fieldLabel: 'Test' };
            expect(() => customFieldService.validateFieldValue(field, null)).not.toThrow();
            expect(() => customFieldService.validateFieldValue(field, '')).not.toThrow();
        });

        it('should throw for null/empty on required fields', () => {
            const field: any = { isRequired: true, fieldType: 'TEXT', fieldLabel: 'Test' };
            expect(() => customFieldService.validateFieldValue(field, null)).toThrow();
            expect(() => customFieldService.validateFieldValue(field, '')).toThrow();
        });

        it('should validate NUMBER type rejects non-numeric values', () => {
            const field: any = { isRequired: false, fieldType: 'NUMBER', fieldLabel: 'Count', validationRules: {} };
            expect(() => customFieldService.validateFieldValue(field, 'abc')).toThrow();
            expect(() => customFieldService.validateFieldValue(field, '42')).not.toThrow();
        });

        it('should validate EMAIL type rejects invalid emails', () => {
            const field: any = { isRequired: false, fieldType: 'EMAIL', fieldLabel: 'Email', validationRules: {} };
            expect(() => customFieldService.validateFieldValue(field, 'notanemail')).toThrow();
            expect(() => customFieldService.validateFieldValue(field, 'test@example.com')).not.toThrow();
        });

        it('should validate CHECKBOX type accepts true/false', () => {
            const field: any = { isRequired: false, fieldType: 'CHECKBOX', fieldLabel: 'Active', validationRules: {} };
            expect(() => customFieldService.validateFieldValue(field, 'true')).not.toThrow();
            expect(() => customFieldService.validateFieldValue(field, 'false')).not.toThrow();
            expect(() => customFieldService.validateFieldValue(field, 'maybe')).toThrow();
        });
    });
});
