
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
    entityType: 'lead',
    name: 'industry',
    label: 'Industry',
    sortOrder: 0,
    update: jest.fn(),
    destroy: jest.fn()
  };

  const mockValue: any = {
    id: 'val-1',
    entityId: 'entity-1',
    entityType: 'lead',
    customFieldId: 'field-1',
    value: 'Technology',
    update: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Field CRUD
  // --------------------------------------------------------------------------
  describe('getFieldsByEntity', () => {
    it('should return custom fields for a given entity type ordered by sortOrder', async () => {
      (CustomField.findAll as jest.Mock<any>).mockResolvedValue([mockField]);

      const result = await customFieldService.getFieldsByEntity('lead');

      expect(CustomField.findAll).toHaveBeenCalledWith({
        where: { entityType: 'lead' },
        order: [['sortOrder', 'ASC']]
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no fields exist for entity type', async () => {
      (CustomField.findAll as jest.Mock<any>).mockResolvedValue([]);

      const result = await customFieldService.getFieldsByEntity('unknown');

      expect(result).toHaveLength(0);
    });
  });

  describe('createField', () => {
    it('should create a new custom field', async () => {
      const data = { entityType: 'lead', name: 'industry', label: 'Industry', fieldType: 'text' };
      (CustomField.create as jest.Mock<any>).mockResolvedValue({ id: 'field-new', ...data });

      const result = await customFieldService.createField(data);

      expect(CustomField.create).toHaveBeenCalledWith(data);
      expect(result).toHaveProperty('id', 'field-new');
    });
  });

  describe('updateField', () => {
    it('should update an existing custom field', async () => {
      (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(mockField);

      await customFieldService.updateField('field-1', { label: 'Updated Label' });

      expect(mockField.update).toHaveBeenCalledWith({ label: 'Updated Label' });
    });

    it('should throw error when field is not found', async () => {
      (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(customFieldService.updateField('field-999', { label: 'X' }))
        .rejects.toThrow('Custom field not found');
    });
  });

  describe('deleteField', () => {
    it('should delete the field and all its associated values', async () => {
      (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(mockField);
      (CustomFieldValue.destroy as jest.Mock<any>).mockResolvedValue(5);

      await customFieldService.deleteField('field-1');

      expect(CustomFieldValue.destroy).toHaveBeenCalledWith({ where: { customFieldId: 'field-1' } });
      expect(mockField.destroy).toHaveBeenCalled();
    });

    it('should throw error when field is not found', async () => {
      (CustomField.findByPk as jest.Mock<any>).mockResolvedValue(null);

      await expect(customFieldService.deleteField('field-999'))
        .rejects.toThrow('Custom field not found');
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

      const result = await customFieldService.getValuesForEntity('entity-1', 'lead');

      expect(CustomFieldValue.findAll).toHaveBeenCalledWith({
        where: { entityId: 'entity-1', entityType: 'lead' },
        include: [{ model: CustomField }]
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('saveValues', () => {
    it('should update existing values', async () => {
      (CustomFieldValue.findOne as jest.Mock<any>).mockResolvedValue(mockValue);
      (CustomFieldValue.findAll as jest.Mock<any>).mockResolvedValue([mockValue]);

      const values = [{ customFieldId: 'field-1', value: 'Finance' }];
      await customFieldService.saveValues('entity-1', 'lead', values);

      expect(mockValue.update).toHaveBeenCalledWith({ value: 'Finance' });
    });

    it('should create new values when they do not exist', async () => {
      (CustomFieldValue.findOne as jest.Mock<any>).mockResolvedValue(null);
      (CustomFieldValue.create as jest.Mock<any>).mockResolvedValue(mockValue);
      (CustomFieldValue.findAll as jest.Mock<any>).mockResolvedValue([mockValue]);

      const values = [{ customFieldId: 'field-2', value: 'New Value' }];
      await customFieldService.saveValues('entity-1', 'lead', values);

      expect(CustomFieldValue.create).toHaveBeenCalledWith({
        entityId: 'entity-1',
        entityType: 'lead',
        customFieldId: 'field-2',
        value: 'New Value'
      });
    });
  });
});
