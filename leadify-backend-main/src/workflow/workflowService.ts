import Workflow from './workflowModel';
import WorkflowLog from './workflowLogModel';

class WorkflowService {
  async getAll() {
    return Workflow.findAll({ order: [['createdAt', 'DESC']] });
  }

  async getById(id: string) {
    const workflow = await Workflow.findByPk(id);
    if (!workflow) throw new Error('Workflow not found');
    return workflow;
  }

  async create(data: any) {
    return Workflow.create(data);
  }

  async update(id: string, data: any) {
    const workflow = await Workflow.findByPk(id);
    if (!workflow) throw new Error('Workflow not found');
    return workflow.update(data);
  }

  async delete(id: string) {
    const workflow = await Workflow.findByPk(id);
    if (!workflow) throw new Error('Workflow not found');
    await WorkflowLog.destroy({ where: { workflowId: id } });
    await workflow.destroy();
  }

  async getLogs(workflowId?: string, limit: number = 50) {
    const where: any = {};
    if (workflowId) where.workflowId = workflowId;

    return WorkflowLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      include: [{ model: Workflow, attributes: ['name'] }]
    });
  }
}

export default new WorkflowService();
