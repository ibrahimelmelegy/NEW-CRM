import CustomField from './customFieldModel';
import CustomFieldValue from './customFieldValueModel';
import { CustomFieldType, CustomFieldEntity } from './customFieldEnum';
import BaseError from '../utils/error/base-http-exception';
import { ERRORS } from '../utils/error/errors';

interface CreateFieldData {
  entityType: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string;
  isRequired?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  validationRules?: Record<string, unknown>;
  createdBy?: string;
}

interface UpdateFieldData {
  fieldLabel?: string;
  fieldType?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string;
  isRequired?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  validationRules?: Record<string, unknown>;
}

class CustomFieldService {
  /**
   * Get all active custom field definitions for a given entity type
   */
  async getFieldsByEntity(entityType: string) {
    return CustomField.findAll({
      where: { entityType, isActive: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
    });
  }

  /**
   * Get all custom field definitions for an entity type (including inactive)
   */
  async getAllFieldsByEntity(entityType: string) {
    return CustomField.findAll({
      where: { entityType },
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
    });
  }

  /**
   * Get a single custom field by ID
   */
  async getFieldById(id: string) {
    const field = await CustomField.findByPk(id);
    if (!field) throw new BaseError(ERRORS.CUSTOM_FIELD_NOT_FOUND, 404);
    return field;
  }

  /**
   * Create a new custom field definition
   */
  async createField(data: CreateFieldData) {
    // Validate entityType
    if (!Object.values(CustomFieldEntity).includes(data.entityType as CustomFieldEntity)) {
      throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, 'Invalid entity type');
    }

    // Validate fieldType
    if (!Object.values(CustomFieldType).includes(data.fieldType as CustomFieldType)) {
      throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, 'Invalid field type');
    }

    // Check for duplicate fieldName within the same entityType
    const existing = await CustomField.findOne({
      where: { fieldName: data.fieldName, entityType: data.entityType }
    });
    if (existing) {
      throw new BaseError(ERRORS.CUSTOM_FIELD_DUPLICATE_NAME, 400, 'A field with this name already exists for this entity type');
    }

    // Validate options for select/multiselect types
    if ((data.fieldType === CustomFieldType.SELECT || data.fieldType === CustomFieldType.MULTISELECT) && (!data.options || data.options.length === 0)) {
      throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, 'Select and multiselect fields must have at least one option');
    }

    // Auto-set sortOrder if not provided
    if (data.sortOrder === undefined) {
      const maxOrder = await CustomField.max('sortOrder', {
        where: { entityType: data.entityType }
      });
      data.sortOrder = ((maxOrder as number) || 0) + 1;
    }

    return CustomField.create(data as unknown as Record<string, unknown>);
  }

  /**
   * Update an existing custom field definition
   */
  async updateField(id: string, data: UpdateFieldData) {
    const field = await CustomField.findByPk(id);
    if (!field) throw new BaseError(ERRORS.CUSTOM_FIELD_NOT_FOUND, 404);

    // If changing to select/multiselect, validate options
    if (data.fieldType) {
      if (!Object.values(CustomFieldType).includes(data.fieldType as CustomFieldType)) {
        throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, 'Invalid field type');
      }
      if ((data.fieldType === CustomFieldType.SELECT || data.fieldType === CustomFieldType.MULTISELECT) && (!data.options || data.options.length === 0)) {
        throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, 'Select and multiselect fields must have at least one option');
      }
    }

    return field.update(data);
  }

  /**
   * Soft delete a custom field (set isActive=false)
   */
  async deleteField(id: string) {
    const field = await CustomField.findByPk(id);
    if (!field) throw new BaseError(ERRORS.CUSTOM_FIELD_NOT_FOUND, 404);
    await field.update({ isActive: false });
    return { deleted: true };
  }

  /**
   * Hard delete a custom field and all its values
   */
  async hardDeleteField(id: string) {
    const field = await CustomField.findByPk(id);
    if (!field) throw new BaseError(ERRORS.CUSTOM_FIELD_NOT_FOUND, 404);
    await CustomFieldValue.destroy({ where: { customFieldId: id } });
    await field.destroy();
    return { deleted: true };
  }

  /**
   * Reorder fields by updating sortOrder values
   */
  async reorderFields(fields: { id: string; sortOrder: number }[]) {
    await Promise.all(
      fields.map(f =>
        CustomField.update({ sortOrder: f.sortOrder }, { where: { id: f.id } })
      )
    );
    return { reordered: true };
  }

  /**
   * Get all custom field values for a specific entity instance
   */
  async getValuesForEntity(entityType: string, entityId: string) {
    return CustomFieldValue.findAll({
      where: { entityId, entityType },
      include: [{ model: CustomField }]
    });
  }

  /**
   * Set a single custom field value
   */
  async setFieldValue(customFieldId: string, entityType: string, entityId: string, value: string | null) {
    const field = await CustomField.findByPk(customFieldId);
    if (!field) throw new BaseError(ERRORS.CUSTOM_FIELD_NOT_FOUND, 404);

    // Validate value against field definition
    this.validateFieldValue(field, value);

    const existing = await CustomFieldValue.findOne({
      where: { entityId, entityType, customFieldId }
    });

    if (existing) {
      return existing.update({ value });
    }

    return CustomFieldValue.create({
      entityId,
      entityType,
      customFieldId,
      value
    } as Record<string, unknown>);
  }

  /**
   * Bulk set/update custom field values for an entity
   */
  async setFieldValues(entityType: string, entityId: string, values: { customFieldId: string; value: string | null }[]) {
    // Fetch all field definitions for validation
    const fieldIds = values.map(v => v.customFieldId);
    const fields = await CustomField.findAll({
      where: { id: fieldIds }
    });

    const fieldMap = new Map(fields.map(f => [f.id, f]));

    // Validate all values first
    for (const v of values) {
      const field = fieldMap.get(v.customFieldId);
      if (!field) throw new BaseError(ERRORS.CUSTOM_FIELD_NOT_FOUND, 404, `Custom field ${v.customFieldId} not found`);
      this.validateFieldValue(field, v.value);
    }

    // Check required fields
    const allActiveFields = await CustomField.findAll({
      where: { entityType, isActive: true, isRequired: true }
    });

    for (const requiredField of allActiveFields) {
      const provided = values.find(v => v.customFieldId === requiredField.id);
      if (!provided || provided.value === null || provided.value === '') {
        // Only enforce required on existing entities (entityId present)
        if (entityId) {
          const existingValue = await CustomFieldValue.findOne({
            where: { entityId, entityType, customFieldId: requiredField.id }
          });
          if (!existingValue || !existingValue.value) {
            throw new BaseError(
              ERRORS.CUSTOM_FIELD_VALIDATION_ERROR,
              400,
              `Field "${requiredField.fieldLabel}" is required`
            );
          }
        }
      }
    }

    // Upsert all values
    for (const v of values) {
      const existing = await CustomFieldValue.findOne({
        where: { entityId, entityType, customFieldId: v.customFieldId }
      });
      if (existing) {
        await existing.update({ value: v.value });
      } else {
        await CustomFieldValue.create({
          entityId,
          entityType,
          customFieldId: v.customFieldId,
          value: v.value
        } as Record<string, unknown>);
      }
    }

    return this.getValuesForEntity(entityType, entityId);
  }

  /**
   * Validate a field value against its field definition
   */
  validateFieldValue(field: CustomField, value: string | null | unknown): void {
    // Null/empty is OK for non-required fields
    if (value === null || value === undefined || value === '') {
      if (field.isRequired) {
        throw new BaseError(
          ERRORS.CUSTOM_FIELD_VALIDATION_ERROR,
          400,
          `Field "${field.fieldLabel}" is required`
        );
      }
      return;
    }

    const strValue = String(value);
    const rules = field.validationRules || {};

    switch (field.fieldType) {
      case CustomFieldType.NUMBER:
      case CustomFieldType.CURRENCY: {
        const num = Number(strValue);
        if (isNaN(num)) {
          throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" must be a valid number`);
        }
        if (rules.min !== undefined && num < rules.min) {
          throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && num > rules.max) {
          throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" must be at most ${rules.max}`);
        }
        break;
      }

      case CustomFieldType.EMAIL: {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(strValue)) {
          throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" must be a valid email address`);
        }
        break;
      }

      case CustomFieldType.URL: {
        try {
          new URL(strValue);
        } catch {
          throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" must be a valid URL`);
        }
        break;
      }

      case CustomFieldType.PHONE: {
        const phoneRegex = /^[+]?[\d\s\-().]{7,20}$/;
        if (!phoneRegex.test(strValue)) {
          throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" must be a valid phone number`);
        }
        break;
      }

      case CustomFieldType.DATE: {
        const dateVal = new Date(strValue);
        if (isNaN(dateVal.getTime())) {
          throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" must be a valid date`);
        }
        break;
      }

      case CustomFieldType.SELECT: {
        if (field.options && field.options.length > 0) {
          const validValues = field.options.map(o => (typeof o === 'string' ? o : o.value));
          if (!validValues.includes(strValue)) {
            throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" has an invalid option`);
          }
        }
        break;
      }

      case CustomFieldType.MULTISELECT: {
        if (field.options && field.options.length > 0) {
          const validValues = field.options.map(o => (typeof o === 'string' ? o : o.value));
          // Multiselect values are stored as JSON array string
          try {
            const selected = JSON.parse(strValue);
            if (!Array.isArray(selected)) {
              throw new Error('not array');
            }
            for (const s of selected) {
              if (!validValues.includes(String(s))) {
                throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" has an invalid option: ${s}`);
              }
            }
          } catch (e) {
            if (e instanceof BaseError) throw e;
            throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" must be a valid multiselect array`);
          }
        }
        break;
      }

      case CustomFieldType.CHECKBOX: {
        if (!['true', 'false', '1', '0'].includes(strValue.toLowerCase())) {
          throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" must be true or false`);
        }
        break;
      }

      case CustomFieldType.TEXT:
      case CustomFieldType.TEXTAREA: {
        if (rules.minLength !== undefined && strValue.length < rules.minLength) {
          throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength !== undefined && strValue.length > rules.maxLength) {
          throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" must be at most ${rules.maxLength} characters`);
        }
        if (rules.pattern) {
          try {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(strValue)) {
              throw new BaseError(ERRORS.CUSTOM_FIELD_VALIDATION_ERROR, 400, `Field "${field.fieldLabel}" does not match the required pattern`);
            }
          } catch (e) {
            if (e instanceof BaseError) throw e;
            // Invalid regex pattern in rules, skip validation
          }
        }
        break;
      }
    }
  }

  /**
   * Delete all custom field values for an entity (cleanup on entity delete)
   */
  async deleteFieldValues(entityType: string, entityId: string) {
    await CustomFieldValue.destroy({
      where: { entityType, entityId }
    });
    return { deleted: true };
  }
}

export default new CustomFieldService();
