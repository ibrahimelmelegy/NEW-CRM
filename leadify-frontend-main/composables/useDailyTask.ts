import { ElNotification } from 'element-plus';

// Handle error during task operations
function handleError(message: string) {
  const t = useNuxtApp().$i18n.t;
  ElNotification({
    type: 'error',
    title: t('common.error'),
    message
  });
}

function handleSuccess(message: string) {
  const t = useNuxtApp().$i18n.t;
  ElNotification({
    type: 'success',
    title: t('common.success'),
    message
  });
  navigateTo('/operations/daily-task');
}

export enum TaskStatus {
  WAITING_FOR_CONTRACT = 'WAITING_FOR_CONTRACT',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED'
}

export const taskStatusOptions = [
  { label: 'Waiting for Contract', value: TaskStatus.WAITING_FOR_CONTRACT },
  { label: 'Contract Signed', value: TaskStatus.CONTRACT_SIGNED },
  { label: 'Active', value: TaskStatus.ACTIVE },
  { label: 'Completed', value: TaskStatus.COMPLETED },
  { label: 'On Hold', value: TaskStatus.ON_HOLD }
];

export enum TaskPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export const taskPriorityOptions = [
  { label: 'High', value: TaskPriority.HIGH },
  { label: 'Medium', value: TaskPriority.MEDIUM },
  { label: 'Low', value: TaskPriority.LOW }
];

export interface DailyTask {
  id?: string;
  name: string;
  priority: TaskPriority;
  salesRepresentativeId: number;
  userId: number;
  clientId: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  cost: number;
  downPayment: number;
  totalPaid: number;
  notes: string;
}

interface UseDailyTaskResult {
  tasks: DailyTask[];
  pagination: {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Fetches a list of daily tasks from the API
 * @returns {Promise<UseDailyTaskResult>} A promise that resolves to an object containing the tasks and pagination
 */
export async function getDailyTasks(all?: boolean): Promise<UseDailyTaskResult> {
  try {
    const { body, success, message } = all ? await useApiFetch('daily-task?limit=1000') : await useApiFetch('daily-task');

    if (success && body) {
      const tasks =
        (body as unknown).docs?.map(task => ({
          ...task,
          createdAt: formatDate(task.createdAt ?? ''),
          updatedAt: '-',
          clientName: task.client?.clientName,
          salesRepresentativeName: task.salesRepresentative?.name,
          assignedToName: task.user?.name
        })) ?? [];
      const pagination = (body as unknown).pagination;
      return { tasks, pagination };
    } else {
      throw new Error(message || 'Failed to fetch Daily Tasks');
    }
  } catch (error) {
    console.error('Error fetching daily tasks:', error instanceof Error ? error.message : error);
    handleError('An error occurred while fetching daily tasks. Please try again.');
    return {
      tasks: [],
      pagination: { totalItems: 0, page: 1, limit: 10, totalPages: 1 }
    };
  }
}

/**
 * Fetches a single daily task from the API
 * @param id - The ID of the task to fetch
 * @returns {Promise<DailyTask>} A promise that resolves to a DailyTask object
 */
export async function getDailyTask(id: string | string[]): Promise<DailyTask> {
  try {
    const { body: task } = await useApiFetch(`daily-task/${id}`);
    return task as DailyTask;
  } catch (error) {
    console.error('Error fetching daily task:', error instanceof Error ? error.message : error);
    handleError('An error occurred while fetching daily task. Please try again.');
    return {} as DailyTask;
  }
}

/**
 * Creates a new daily task
 * @param values - The values to create the task with
 */
export async function createDailyTask(values: DailyTask) {
  const t = useNuxtApp().$i18n.t;
  try {
    const dataSend = {
      ...values,
      clientId: values?.clientId === '' ? undefined : values?.clientId
    };
    const response = await useApiFetch('daily-task', 'POST', dataSend);

    if (response?.success) {
      handleSuccess(t('common.created'));
    } else {
      handleError(response?.message || 'Something went wrong');
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Updates an existing daily task
 * @param values - The values to update the task with
 */
export async function updateDailyTask(values: DailyTask, id: string) {
  const t = useNuxtApp().$i18n.t;
  try {
    const dataSend = {
      ...values,
      clientId: values?.clientId === '' ? undefined : values?.clientId
    };
    const response = await useApiFetch(`daily-task/${id}`, 'PUT', dataSend);

    if (response?.success) {
      handleSuccess(t('common.saved'));
    } else {
      handleError(response?.message || 'Something went wrong');
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Deletes a daily task
 * @param id - The ID of the task to delete
 */
export async function deleteDailyTask(id: string) {
  const t = useNuxtApp().$i18n.t;
  try {
    const response = await useApiFetch(`daily-task/${id}`, 'DELETE');

    if (response?.success) {
      handleSuccess(t('common.deleted'));
    } else {
      handleError(response?.message || 'Something went wrong');
    }
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
  }
}

export const dailyTaskStatisticsLoading = ref(false);

interface DailyTaskStatistics {
  activeTasks: number;
  completedTasks: number;
  grantedTasks: number;
  totalRevenue: number;
  taskStatusPercentage: { name: string; value: number }[];
  monthlyRevenue: { name: string; value: number }[];
  taskDistributionByClient: { name: string; value: number }[];
  salesPerformance: { name: string; value: number; value2: number }[];
}

export async function getDailyTaskStatistics(): Promise<DailyTaskStatistics> {
  dailyTaskStatisticsLoading.value = true;
  const { body, success, message } = await useApiFetch('daily-task/statistics');
  dailyTaskStatisticsLoading.value = false;
  if (!success || !body) {
    throw new Error(message || 'Failed to fetch daily task statistics');
  }

  const toNameValueArray = (obj: Record<string, number>): { name: string; value: number }[] =>
    Object.entries(obj).map(([name, value]) => ({ name: capitalizeName(name), value }));
  const {
    activeTasks = 0,
    completedTasks = 0,
    grantedTasks = 0,
    totalRevenue = 0,
    taskStatusPercentage = {},
    monthlyRevenue = [],
    taskDistributionByClient = [],
    salesPerformance = []
  } = body as unknown;

  return {
    activeTasks,
    completedTasks,
    grantedTasks,
    totalRevenue,
    taskStatusPercentage: toNameValueArray(taskStatusPercentage),
    taskDistributionByClient: taskDistributionByClient.map(item => ({
      name: item.clientName,
      value: item.taskCount
    })),
    salesPerformance: salesPerformance.map(item => ({
      name: item.name,
      value: item.tasksCount,
      value2: item.totalPaid
    })),
    monthlyRevenue: monthlyRevenue.map(item => ({
      name: item.month,
      value: item.totalPaid
    }))
  };
}
