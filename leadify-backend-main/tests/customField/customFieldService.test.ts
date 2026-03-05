
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import customFieldService from '../../src/customField/customFieldService';
import CustomField from '../../src/customField/customFieldModel';
import CustomFieldValue from '../../src/customField/customFieldValueModel';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

jest.mock('../../src/customField/customFieldModel');
jest.mock('../../src/customField/customFieldValueModel');

describe('CustomFieldService', () => {
  const mockField: any = {
    id: 'field-1',
    entityType: 'LEAD',
    fieldName: 'industry',
    fieldLabel: 'Industry',
    fieldType: 'TEXT',
    isRequired: false,
    isActive: true,
    sortOrder: 0,
    validationRules: null,
    options: null,
    update: jest.fn().mockImplementation(function (this: any, data: any) {
      Object.assign(this, data);
      return Promise.resolve(this);
    }),
    destroy: jest.fn().mockImplementation(() => Promise.resolve())
  };

  const mockValue: any = {
    id: 'val-1',
    entityId: 'entity-1',
    entityType: 'LEAD',
    customFieldId: 'field-1',
    value: 'Technology',
    update: jest.fn().mockImplementation(() => Promise.resolve(mockValue))
  };

  beforeEach(() => {
    jest.resetAllMocks();
    // Restore mock implementations (resetAllMocks removes them)
    mockField.update = jest.fn().mockImplementation(function (this: any, data: any) {
      Object.assign(this, data);
      return Promise.resolve(this);
    });
    mockField.destroy = jest.fn().mockImplementation(() => Promise.resolve());
    mockValue.update = jest.fn().mockImplementation(() => Promise.resolve(mockValue));
  });

  // --------------------------------------------------------------------------
  // Field CRUD
  // --------------------------------------------------------------------------
  describe('getFieldsByEntity', () => {
    it('should return active custom fields for a given entity type ordered by sortOrder', async () => {
      (CustomField.findAll as jest.Mock<any>).mockResolvedValue([mockField]);

      const result = await customFieldService.getFieldsByEntity('LEAD');

      expect(CustomField.findAll).toHaveBeenCalledWith({
        where: { entityType: 'LEAD', isActive: true },
        order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no fields exist for entity type', async () => {
      (CustomField.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await customFieldService.getFieldsByEntity('unknown');

      expect(result).toHaveLength(0);
    });
  });

  describe('getAllFieldsByEntity', () => {
    it('should return all fields including inactive', async () => {
      (CustomField.findAll as jest.Mock<any>).mockResolvedValue([mockField]);

      const result = await customFieldService.getAllFieldsByEntity('LEAD');

      expect(CustomField.findAll).toHaveBeenCalledWith({
        where: { entityType: 'LEAD' },
        order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('createField', () => {
    it('should create a new custom field', async () => {
      const data = {
        entityType: 'LEAD',
        fieldName: 'industry',
        fieldLabel: 'Industry',
        fieldType: 'TEXT'
      };
      (CustomField.findOne as jest.Mock<any>).mockResolvedValue(null);
      (CustomField.max as jest.Mock<any>).mockResolvedValue(0);
      (CustomField.create as jest.Mock<any>).mockResolvedValue({ id: 'field-new', ...data });

      const result = await customFieldService.createField(data);

      expect(CustomField.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'field-new');
    });

    it('should throw for duplicate field name in same entity', async () => {
      const data = {
        entityType: 'LEAD',
        fieldName: 'industry',
        fieldLabel: 'Industry',
        fieldType: 'TEXT'
      };
      (CustomField.findOne as jest.Mock<any>).mockResolvedValue(mockField);

      await expect(customFieldService.createField(data))
        .rejects.toThrow();
    });

    it('should throw for invalid entity type', async () => {
      const data = {
        entityType: 'INVALID',
        fieldName: 'test',
        fieldLabel: 'Test',
        fieldType: 'TEXT'
      };

      await expect(customFieldService.createField(data))
        .rejects.toThrow();
    });

    it('should throw for invalid field type', async () => {
      const data = {
        entityType: 'LEAD',
        fieldName: 'test',
        fieldLabel: 'Test',
        fieldType: 'INVALID'
      };

      await expect(customFieldService.createField(data))
        .rejects.toThrow();
    });

    it('should throw for select without options', async () => {
      const data = {
        entityType: 'LEAD',
        fieldName: 'test',
        fieldLabel: 'Test',
        fieldType: 'SELECT',
        options: []
      };
      (CustomField.findOne as jest.Mock<any>).mockResolvedValue(null);

      await expect(customFieldService.createField(data))
        .rejects.toThrow();
    });
  });

  describe('updateField', () => {
    it('should update an existing custom field', async () => {
      (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(mockField);

      await customFieldService.updateField('field-1', { fieldLabel: 'Updated Label' });

      expect(mockField.update).toHaveBeenCalledWith({ fieldLabel: 'Updated Label' });
    });

    it('should throw error when field is not found', async () => {
      (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(customFieldService.updateField('field-999', { fieldLabel: 'X' }))
        .rejects.toThrow();
    });
  });

  describe('deleteField (soft delete)', () => {
    it('should soft-delete the field by setting isActive to false', async () => {
      (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(mockField);

      await customFieldService.deleteField('field-1');

      expect(mockField.update).toHaveBeenCalledWith({ isActive: false });
    });

    it('should throw error when field is not found', async () => {
      (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(customFieldService.deleteField('field-999'))
        .rejects.toThrow();
    });
  });

  describe('hardDeleteField', () => {
    it('should hard-delete the field and all its associated values', async () => {
      (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(mockField);
      (CustomFieldValue.destroy as jest.Mock<any>).mockResolvedValue(5);

      await customFieldService.hardDeleteField('field-1');

      expect(CustomFieldValue.destroy).toHaveBeenCalledWith({ where: { customFieldId: 'field-1' } });
      expect(mockField.destroy).toHaveBeenCalled();
    });
  });

  describe('reorderFields', () => {
    it('should update sortOrder for each field', async () => {
      (CustomField.update as jest.Mock<any>).mockResolvedValue([1]);

      const fields = [
        { id: 'field-1', sortOrder: 2 },
        { id: 'field-2', sortOrder: 1 }
      ];
      await customFieldService.reorderFields(fields);

      expect(CustomField.update).toHaveBeenCalledTimes(2);
      expect(CustomField.update).toHaveBeenCalledWith({ sortOrder: 2 }, { where: { id: 'field-1' } });
      expect(CustomField.update).toHaveBeenCalledWith({ sortOrder: 1 }, { where: { id: 'field-2' } });
    });
  });

  // --------------------------------------------------------------------------
  // Values
  // --------------------------------------------------------------------------
  describe('getValuesForEntity', () => {
    it('should return custom field values for a specific entity', async () => {
      (CustomFieldValue.findAll as jest.Mock<any>).mockResolvedValue([mockValue]);

      const result = await customFieldService.getValuesForEntity('LEAD', 'entity-1');

      expect(CustomFieldValue.findAll).toHaveBeenCalledWith({
        where: { entityId: 'entity-1', entityType: 'LEAD' },
        include: [{ model: CustomField }]
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('setFieldValues', () => {
    it('should update existing values', async () => {
      const fieldWithDef: any = { ...mockField, id: 'field-1', isRequired: false };
      (CustomField.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([fieldWithDef])   // field lookup for validation
        .mockResolvedValueOnce([]);              // required field check
      (CustomFieldValue.findOne as jest.Mock<any>).mockResolvedValue(mockValue);
      (CustomFieldValue.findAll as jest.Mock<any>).mockResolvedValue([mockValue]);

      const values = [{ customFieldId: 'field-1', value: 'Finance' }];
      await customFieldService.setFieldValues('LEAD', 'entity-1', values);

      expect(mockValue.update).toHaveBeenCalledWith({ value: 'Finance' });
    });

    it('should create new values when they do not exist', async () => {
      const fieldWithDef: any = { ...mockField, id: 'field-2', fieldType: 'TEXT', isRequired: false };
      (CustomField.findAll as jest.Mock<any>)
        .mockResolvedValueOnce([fieldWithDef])   // field lookup by id array
        .mockResolvedValueOnce([]);              // required fields check (none required)
      (CustomFieldValue.findOne as jest.Mock<any>).mockResolvedValue(null);
      (CustomFieldValue.create as jest.Mock<any>).mockResolvedValue(mockValue);
      (CustomFieldValue.findAll as jest.Mock<any>).mockResolvedValue([mockValue]);

      const values = [{ customFieldId: 'field-2', value: 'New Value' }];
      await customFieldService.setFieldValues('LEAD', 'entity-1', values);

      expect(CustomFieldValue.create).toHaveBeenCalledWith({
        entityId: 'entity-1',
        entityType: 'LEAD',
        customFieldId: 'field-2',
        value: 'New Value'
      });
    });
  });

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------
  describe('validateFieldValue', () => {
    it('should throw for required field with empty value', () => {
      const requiredField: any = { ...mockField, isRequired: true, fieldLabel: 'Industry' };

      expect(() => customFieldService.validateFieldValue(requiredField, null))
        .toThrow();
      expect(() => customFieldService.validateFieldValue(requiredField, ''))
        .toThrow();
    });

    it('should pass for non-required field with empty value', () => {
      const optionalField: any = { ...mockField, isRequired: false };

      expect(() => customFieldService.validateFieldValue(optionalField, null)).not.toThrow();
      expect(() => customFieldService.validateFieldValue(optionalField, '')).not.toThrow();
    });

    it('should validate NUMBER type', () => {
      const numField: any = { ...mockField, fieldType: 'NUMBER', validationRules: { min: 0, max: 100 } };

      expect(() => customFieldService.validateFieldValue(numField, '50')).not.toThrow();
      expect(() => customFieldService.validateFieldValue(numField, 'abc')).toThrow();
      expect(() => customFieldService.validateFieldValue(numField, '-5')).toThrow();
      expect(() => customFieldService.validateFieldValue(numField, '150')).toThrow();
    });

    it('should validate EMAIL type', () => {
      const emailField: any = { ...mockField, fieldType: 'EMAIL' };

      expect(() => customFieldService.validateFieldValue(emailField, 'test@example.com')).not.toThrow();
      expect(() => customFieldService.validateFieldValue(emailField, 'invalid')).toThrow();
    });

    it('should validate URL type', () => {
      const urlField: any = { ...mockField, fieldType: 'URL' };

      expect(() => customFieldService.validateFieldValue(urlField, 'https://example.com')).not.toThrow();
      expect(() => customFieldService.validateFieldValue(urlField, 'not a url')).toThrow();
    });

    it('should validate SELECT type against options', () => {
      const selectField: any = {
        ...mockField,
        fieldType: 'SELECT',
        options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
      };

      expect(() => customFieldService.validateFieldValue(selectField, 'a')).not.toThrow();
      expect(() => customFieldService.validateFieldValue(selectField, 'c')).toThrow();
    });

    it('should validate CHECKBOX type', () => {
      const cbField: any = { ...mockField, fieldType: 'CHECKBOX' };

      expect(() => customFieldService.validateFieldValue(cbField, 'true')).not.toThrow();
      expect(() => customFieldService.validateFieldValue(cbField, 'false')).not.toThrow();
      expect(() => customFieldService.validateFieldValue(cbField, 'maybe')).toThrow();
    });

    it('should validate TEXT with minLength/maxLength', () => {
      const textField: any = {
        ...mockField,
        fieldType: 'TEXT',
        validationRules: { minLength: 2, maxLength: 5 }
      };

      expect(() => customFieldService.validateFieldValue(textField, 'ab')).not.toThrow();
      expect(() => customFieldService.validateFieldValue(textField, 'a')).toThrow();
      expect(() => customFieldService.validateFieldValue(textField, 'abcdef')).toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // deleteFieldValues
  // --------------------------------------------------------------------------
  describe('deleteFieldValues', () => {
    it('should delete all values for an entity', async () => {
      (CustomFieldValue.destroy as jest.Mock<any>).mockResolvedValue(3);

      const result = await customFieldService.deleteFieldValues('LEAD', 'entity-1');

      expect(CustomFieldValue.destroy).toHaveBeenCalledWith({
        where: { entityType: 'LEAD', entityId: 'entity-1' }
      });
      expect(result).toEqual({ deleted: true });
    });
  });
});
