import { DealActivity } from './model/dealActivities';
import { ActivityActionType } from './model/activities';
import { OpportunityActivity } from './model/opportunityActivities';
import { LeadActivity } from './model/leadActivities';
import { ClientActivity } from './model/clientActivities';
import { ProjectActivity } from './model/projectActivities';
import { VendorActivity } from './model/vendorActivities';
import { PurchaseOrderActivity } from './model/purchaseOrderActivities';
import User from '../user/userModel';

type ActivityModel = 'deal' | 'opportunity' | 'lead' | 'client' | 'project' | 'vendor' | 'purchaseOrder';
const actionModel: Record<ActivityModel, any> = {
  deal: DealActivity,
  opportunity: OpportunityActivity,
  lead: LeadActivity,
  client: ClientActivity,
  project: ProjectActivity,
  vendor: VendorActivity,
  purchaseOrder: PurchaseOrderActivity
};

const userInclude = { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture'] };

export async function createActivityLog(
  model: ActivityModel,
  actionType: ActivityActionType,
  modelId: string | number,
  userId: number,
  transation?: any,
  data?: any
) {
  await actionModel[model].create(
    {
      userId,
      description: `${data}`,
      status: actionType,
      [model + 'Id']: modelId
    },
    { transation }
  );
  return true;
}
export async function getAllActivityLogs(limit: number = 100) {
  const perModel = Math.ceil(limit / Object.keys(actionModel).length);

  // Run all model queries in parallel instead of sequentially
  const results = await Promise.allSettled(
    Object.entries(actionModel).map(async ([modelName, Model]) => {
      const logs = await Model.findAll({
        limit: perModel,
        order: [['createdAt', 'DESC']],
        include: [userInclude],
        attributes: ['id', 'description', 'status', 'userId', 'createdAt']
      });
      return logs.map((log: any) => ({ ...log.toJSON(), entityType: modelName }));
    })
  );

  const allLogs = results.filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled').flatMap(r => r.value);

  allLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return allLogs.slice(0, limit);
}

export async function getActivityLogs(model: ActivityModel, modelId: string, page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const { rows: docs, count: totalItems } = await actionModel[model].findAndCountAll({
    where: {
      [model + 'Id']: modelId
    },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    include: [userInclude]
  });

  return {
    docs,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
}
