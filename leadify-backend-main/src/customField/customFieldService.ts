import CustomField from './customFieldModel';
import CustomFieldValue from './customFieldValueModel';

class CustomFieldService {
  async getFieldsByEntity(entityType: string) {
    return CustomField.findAll({
      where: { entityType },
      order: [['sortOrder', 'ASC']]
    });
  }

  async createField(data: any) {
    return CustomField.create(data);
  }

  async updateField(id: string, data: any) {
    const field = await CustomField.findByPk(id);
    if (!field) throw new Error('Custom field not found');
    return field.update(data);
  }

  async deleteField(id: string) {
    const field = await CustomField.findByPk(id);
    if (!field) throw new Error('Custom field not found');
    await CustomFieldValue.destroy({ where: { customFieldId: id } });
    await field.destroy();
  }

  async reorderFields(fields: { id: string; sortOrder: number }[]) {
    await Promise.all(fields.map(f => CustomField.update({ sortOrder: f.sortOrder }, { where: { id: f.id } })));
  }

  async getValuesForEntity(entityId: string, entityType: string) {
    return CustomFieldValue.findAll({
      where: { entityId, entityType },
      include: [{ model: CustomField }]
    });
  }

  async saveValues(entityId: string, entityType: string, values: { customFieldId: string; value: any }[]) {
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
        });
      }
    }
    return this.getValuesForEntity(entityId, entityType);
  }
}

export default new CustomFieldService();
