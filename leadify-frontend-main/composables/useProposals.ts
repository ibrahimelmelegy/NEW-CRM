/* eslint-disable no-use-before-define */
import { getOpportunities } from './useOpportunity';
import type { RelatedTypesValues, RelatedTypeOptions, RelatedToOptions, ProposalTypeOptions, ProposalInfoPayload } from '~/types/Proposal';

// Handle error during lead creation
function handleError(message: string) {
  ElNotification({
    type: 'error',
    title: 'Error',
    message
  });
}
function handleSuccess(message: string, proposalId?: string) {
  ElNotification({
    type: 'success',
    title: 'Success',
    message
  });
  if (proposalId) {
    navigateTo(`/sales/proposals/editor/content/${proposalId}`); // Navigate to the leads list
  }
}
// Form options
export const proposalRelatedTypes: RelatedTypeOptions[] = [
  { label: 'Opportunity', value: 'Opportunity' },
  { label: 'Deal', value: 'Deal' },
  { label: 'Project', value: 'Project' }
];
export const proposalStatus = [
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Waiting Approval', value: 'WAITING_APPROVAL' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Archived', value: 'ARCHIVED' }
];

export const ProposalType: ProposalTypeOptions[] = [
  { label: 'Financial', value: 'FINANCIAL' },
  { label: 'Technical', value: 'TECHNICAL' },
  { label: 'Tech & Financial', value: 'MIXED' }
];

export const fileAttachmentsFormats = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpg',
  'image/jpeg',
  'image/png'
];
export const proposalRelatedToOptions = ref<RelatedToOptions[]>([]);

export async function fetchRelatedToOptions(type: RelatedTypesValues) {
  const functionMap: { [key in RelatedTypesValues]: () => Promise<Record<string, Array<{ id?: string | number; name?: string }>>> } = {
    Opportunity: getOpportunities as unknown as () => Promise<Record<string, Array<{ id?: string | number; name?: string }>>>,
    Deal: getDeals as unknown as () => Promise<Record<string, Array<{ id?: string | number; name?: string }>>>,
    Project: getProjects as () => Promise<Record<string, Array<{ id?: string | number; name?: string }>>>
  };

  const existingType = type === 'Project' ? 'projects' : type === 'Deal' ? 'deals' : 'opportunties';

  const fetchFunction = functionMap[type];

  const response = await fetchFunction();
  proposalRelatedToOptions.value =
    response[existingType]?.map((item: { id?: string | number; name?: string }) => ({
      label: item?.name ?? '',
      value: String(item?.id ?? '')
    })) ?? [];

  return proposalRelatedToOptions.value;
}

export interface ProposalData {
  id?: string;
  title?: string;
  version?: string;
  proposalDate?: string;
  type?: string;
  reference?: string;
  proposalFor?: string;
  companyLogo?: string;
  status?: string;
  content?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  notes?: string;
  fileAttachments?: string[];
  users?: Array<{ id: number; name: string }>;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceTableData {
  financeTable?: Array<FinanceTable>;
  pagination?: { page: number; limit: number; totalItems: number; totalPages: number };
}

export interface FinanceTable {
  id: number;
  proposalId?: string;
  name?: string;
  totalPrice?: number;
  customColumns?: Record<string, unknown>;
  items?: FinanceTableItem[];
  subtotal?: number;
  total?: number;
}

export interface FinanceTableItem {
  id: number;
  financeTableId?: number;
  description?: string;
  qty?: number;
  unitPrice?: number;
  totalPrice?: number;
  customColumns?: Record<string, unknown>;
  proposalId?: string;
}

/**
 * Fetches a single proposal from the API
 * @param id - The ID of the proposal to fetch
 * @returns {Promise<ProposalData>} A promise that resolves to a ProposalData object
 * @throws {Error} If the API call is unsuccessful, an error is thrown with a message
 */
export async function getProposal(id: string | string[]): Promise<ProposalData> {
  try {
    const { body: proposal } = await useApiFetch(`proposal/${id}`);
    return proposal as unknown as ProposalData;
  } catch (error) {
    console.error('Error fetching proposal:', error instanceof Error ? error.message : error);
    handleError('An error occurred while fetching proposal. Please try again.');
    return {} as ProposalData;
  }
}

export async function getProposalFinanceTableByPropsalId(proposalId: string | string[]): Promise<FinanceTableData> {
  try {
    const { body: table } = await useApiFetch(`proposal-finance-table/?page=1&limit=10&proposalId=${proposalId}`);
    return table as unknown as FinanceTableData;
  } catch (error) {
    console.error('Error fetching proposal:', error instanceof Error ? error.message : error);
    handleError('An error occurred while fetching proposal. Please try again.');
    return {} as FinanceTableData;
  }
}

export async function getProposalFinanceTableItemByTablelId(TablelId: string | string[]): Promise<{ items?: FinanceTableItem[] }> {
  try {
    const { body: tableItem } = await useApiFetch(`proposal-finance-table-item/?page=1&limit=1000&financeTableId=${TablelId}`);
    return tableItem as unknown as { items?: FinanceTableItem[] };
  } catch (error) {
    console.error('Error fetching tableItem:', error instanceof Error ? error.message : error);
    handleError('An error occurred while fetching table Item. Please try again.');
    return {};
  }
}

export async function createProposalFinanceTable(values: Record<string, unknown> & { proposalId?: string }): Promise<void> {
  try {
    // Prepare the client data
    const ProposalFinanceTableData = {
      ...values
    };
    // Call API to create the client
    const response = await useApiFetch(`proposal-finance-table`, 'POST', ProposalFinanceTableData);

    // Handle the API response
    if (response?.success) {
      handleSuccess('proposal finance table create successfully', ProposalFinanceTableData?.proposalId);
    } else {
      handleError(response?.message || 'Something went wrong');
    }
  } catch (error) {
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function updateProposalFinanceTable(values: Record<string, unknown>, id: number, proposalId: string | undefined): Promise<void> {
  try {
    // Prepare the client data
    const ProposalFinanceTableData = {
      ...values
    };
    // Call API to create the client
    const response = await useApiFetch(`proposal-finance-table/${id}`, 'PUT', ProposalFinanceTableData);

    // Handle the API response
    if (response?.success) {
      handleSuccess('proposal finance table update successfully', proposalId);
    } else {
      handleError(response?.message || 'Something went wrong');
    }
  } catch (error) {
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function updateProposalFinanceTableitem(
  values: { customColumns?: Record<string, unknown>; qty?: number; proposalId?: string },
  id: number,
  type: string = 'all'
): Promise<void> {
  try {
    // Prepare the client data
    const ProposalFinanceTableData: Record<string, unknown> = {
      customColumns: values?.customColumns,
      qty: values?.qty
    };
    // Call API to create the client
    const response = await useApiFetch(`proposal-finance-table-item/${id}`, 'PUT', ProposalFinanceTableData);

    // Handle the API response
    if (response?.success) {
      if (type === 'one') {
        handleSuccess('proposal finance table item update successfully');
      } else {
        handleSuccess('proposal finance table item update successfully', values?.proposalId);
      }
    } else {
      handleError(response?.message || 'Something went wrong');
    }
  } catch (error) {
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function createProposalFinanceTableitem(values: Record<string, unknown> & { proposalId?: string }, type: string = 'all'): Promise<void> {
  try {
    // Prepare the client data
    const ProposalFinanceTableData = {
      ...values
    };
    // Call API to create the client
    const response = await useApiFetch(`proposal-finance-table-item`, 'POST', ProposalFinanceTableData);

    // Handle the API response
    if (response?.success) {
      if (type === 'one') {
        handleSuccess('proposal finance table item create successfully');
      } else {
        handleSuccess('proposal finance table item create successfully', ProposalFinanceTableData?.proposalId);
      }
    } else {
      handleError(response?.message || 'Something went wrong');
    }
  } catch (error) {
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function deleteProposalFinanceTableItem(id: number): Promise<void> {
  try {
    // Call API to create the client
    const response = await useApiFetch(`proposal-finance-table-item/${id}`, 'DELETE');

    // Handle the API response
    if (response?.success) {
      ElNotification({
        type: 'success',
        title: 'Success',
        message: 'proposal finance table DELETE successfully'
      });
    } else {
      handleError(response?.message || 'Something went wrong');
    }
  } catch (error) {
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function deleteCustomColumn(idFinanceTable: number, columnKey: string): Promise<void> {
  try {
    // Call API to create the client
    const response = await useApiFetch(`proposal-finance-table/${idFinanceTable}/${columnKey}`, 'DELETE');

    // Handle the API response
    if (response?.success) {
      handleSuccess('column DELETE successfully');
    } else {
      handleError(response?.message || 'Something went wrong');
    }
  } catch (error) {
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : 'Unknown error');
  }
}
/**
 * Creates a new proposal
 * @param values - The values to create the proposal with
 * @throws {Error} If the API call is unsuccessful, an error is thrown with a message
 * @returns {Promise<void>} A promise that resolves when the proposal is created
 */
export async function createProposal(values: ProposalInfoPayload & { file?: Array<{ response?: string }> }): Promise<void> {
  try {
    const formattedValues: Record<string, unknown> = {
      ...values,
      fileAttachments: values?.file?.map((el: { response?: string }) => el?.response),
      relatedEntityId: values?.relatedEntityId === '' ? undefined : values?.relatedEntityId,
      relatedEntityType: values?.relatedEntityType === '' ? undefined : values?.relatedEntityType
    };
    delete formattedValues.file;
    // Call API to create the proposal
    const response = await useApiFetch('proposal', 'POST', formattedValues);

    // Handle the API response
    if (response?.success) {
      ElNotification({
        type: 'success',
        title: 'Success',
        message: 'proposal  create successfully'
      });
      navigateTo(`/sales/proposals/add-table/${response.body?.id}`);
    } else {
      const errorMessage = response?.message || 'Something went wrong';
      ElNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      throw new Error(errorMessage); // Throw an error to be caught in the calling function
    }
    // await fetchExistingProject();
  } catch (error) {
    // Catch any unexpected errors and handle them
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    ElNotification({
      type: 'error',
      title: 'Error',
      message: errorMessage
    });
    throw new Error(errorMessage); // Re-throw the error to propagate it to the calling function
  }
}

interface UpdateProposalValues {
  id?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  title?: string;
  version?: string;
  content?: string;
  notes?: string;
  type?: string;
  companyLogo?: string;
  proposalFor?: string;
  reference?: string;
  status?: string;
  reason?: string;
  file?: Array<{ response?: string }>;
}

export async function updateProposal(values: UpdateProposalValues): Promise<void> {
  try {
    // Call API to create the proposal
    const proposalData: Record<string, unknown> = {
      relatedEntityId: values?.relatedEntityId === '' ? undefined : values?.relatedEntityId,
      relatedEntityType: values?.relatedEntityType === '' ? undefined : values?.relatedEntityType,
      title: values?.title ?? undefined,
      version: values?.version ?? undefined,
      content: values?.content ?? undefined,
      // users: values.users?.map((el) => el?.id ?? el),
      notes: values?.notes ?? undefined,
      type: values?.type ?? undefined,
      companyLogo: values?.companyLogo ?? undefined,
      proposalFor: values?.proposalFor ?? undefined,
      reference: values?.reference ?? undefined,
      fileAttachments: values?.file?.map((el: { response?: string }) => el?.response) ?? undefined
    };
    if (values.status) {
      const responseChange =
        values.status === 'reject'
          ? await useApiFetch(`proposal/reject/${values.id}`, 'PUT', {
              rejectionReason: values.reason
            })
          : values.status === 'waiting-approval'
            ? await useApiFetch(`proposal/waiting-approval/${values.id}`, 'PUT')
            : await useApiFetch(`proposal/approve/${values.id}`, 'PUT');
      // Handle the API response
      if (responseChange?.success) {
        ElNotification({
          type: 'success',
          title: 'Success',
          message: `proposal update status (${values.status}) successfully`
        });
        navigateTo(`/sales/proposals`);
      } else {
        const errorMessage = responseChange?.message || 'Something went wrong';
        ElNotification({
          type: 'error',
          title: 'Error',
          message: errorMessage
        });
        throw new Error(errorMessage); // Throw an error to be caught in the calling function
      }
    } else {
      const response = await useApiFetch(`proposal/${values.id}`, 'PUT', {
        ...proposalData
      });
      // Handle the API response
      if (response?.success) {
        ElNotification({
          type: 'success',
          title: 'Success',
          message: 'proposal update successfully'
        });
        navigateTo(`/sales/proposals`);
      } else {
        const errorMessage = response?.message || 'Something went wrong';
        ElNotification({
          type: 'error',
          title: 'Error',
          message: errorMessage
        });
        throw new Error(errorMessage); // Throw an error to be caught in the calling function
      }
    }

    // await fetchExistingProject();
  } catch (error) {
    // Catch any unexpected errors and handle them
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    ElNotification({
      type: 'error',
      title: 'Error',
      message: errorMessage
    });
    throw new Error(errorMessage); // Re-throw the error to propagate it to the calling function
  }
}

/**
 * Submit proposal for approval
 * @param id - Proposal ID
 */
export async function submitForApproval(id: string | number): Promise<boolean> {
  try {
    const response = await useApiFetch(`proposal/waiting-approval/${id}`, 'PUT');
    if (response?.success) {
      ElNotification({
        type: 'success',
        title: 'Success',
        message: 'Proposal submitted for approval'
      });
      return true;
    }
    handleError(response?.message || 'Failed to submit proposal');
    return false;
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Approve proposal
 * @param id - Proposal ID
 */
export async function approveProposal(id: string | number): Promise<boolean> {
  try {
    const response = await useApiFetch(`proposal/approve/${id}`, 'PUT');
    if (response?.success) {
      ElNotification({
        type: 'success',
        title: 'Success',
        message: 'Proposal approved successfully'
      });
      return true;
    }
    handleError(response?.message || 'Failed to approve proposal');
    return false;
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Reject proposal
 * @param id - Proposal ID
 * @param reason - Rejection reason
 */
/**
 * Reject proposal
 * @param id - Proposal ID
 * @param reason - Rejection reason
 */
export async function rejectProposal(id: string | number, reason: string): Promise<boolean> {
  try {
    const response = await useApiFetch(`proposal/reject/${id}`, 'PUT', {
      rejectionReason: reason
    });
    if (response?.success) {
      ElNotification({
        type: 'success',
        title: 'Success',
        message: 'Proposal rejected'
      });
      return true;
    }
    handleError(response?.message || 'Failed to reject proposal');
    return false;
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Archive proposal
 * @param id - Proposal ID
 */
export async function archiveProposal(id: string | number): Promise<boolean> {
  try {
    const response = await useApiFetch(`proposal/archive/${id}`, 'PUT');
    if (response?.success) {
      ElNotification({
        type: 'success',
        title: 'Success',
        message: 'Proposal archived successfully'
      });
      return true;
    }
    handleError(response?.message || 'Failed to archive proposal');
    return false;
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Download proposal as PDF from server-side generation endpoint.
 * Triggers a browser download of the generated file.
 * @param id - Proposal ID
 * @param reference - Optional reference number for the filename
 */
export async function downloadProposalPdf(id: string | number, reference?: string): Promise<boolean> {
  try {
    const config = useRuntimeConfig();

    const response = await $fetch(`${config.public.API_BASE_URL}proposal/${id}/pdf`, {
      method: 'GET',
      credentials: 'include',
      responseType: 'blob'
    });

    const blob = response as Blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Proposal-${reference || id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    ElNotification({
      type: 'success',
      title: 'Success',
      message: 'Proposal PDF downloaded successfully'
    });
    return true;
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Failed to download PDF');
    return false;
  }
}

/**
 * Delete proposal
 * @param id - Proposal ID
 */
export async function deleteProposal(id: string | number): Promise<boolean> {
  try {
    const response = await useApiFetch(`proposal/${id}`, 'DELETE');
    if (response?.success) {
      ElNotification({
        type: 'success',
        title: 'Success',
        message: 'Proposal deleted successfully'
      });
      return true;
    }
    handleError(response?.message || 'Failed to delete proposal');
    return false;
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Get proposal finance tables with items
 * @param proposalId - Proposal ID
 */
export async function getProposalFinanceTable(proposalId: string | number): Promise<FinanceTable[]> {
  try {
    const { body: tables } = await useApiFetch(`proposal-finance-table/?page=1&limit=100&proposalId=${proposalId}`);
    const tablesBody = tables as unknown as FinanceTableData;
    if (!tablesBody?.financeTable?.length) return [];

    // Fetch items for each table
    const tablesWithItems = await Promise.all(
      tablesBody.financeTable.map(async (table: FinanceTable) => {
        const { body: items } = await useApiFetch(`proposal-finance-table-item/?page=1&limit=1000&financeTableId=${table.id}`);
        const itemsBody = items as unknown as { items?: FinanceTableItem[] };
        return {
          ...table,
          items: itemsBody?.items || [],
          subtotal: itemsBody?.items?.reduce((sum: number, item: FinanceTableItem) => sum + (item.totalPrice || 0), 0) || 0,
          total: table.totalPrice || itemsBody?.items?.reduce((sum: number, item: FinanceTableItem) => sum + (item.totalPrice || 0), 0) || 0
        };
      })
    );

    return tablesWithItems;
  } catch (error) {
    console.error('Error fetching finance tables:', error);
    return [];
  }
}
