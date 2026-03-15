/* eslint-disable no-use-before-define */
import { ElNotification } from 'element-plus';
import logger from '~/utils/logger';
// Helper function to normalize phone numbers
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\s+/g, '').replace(/^\+/, '').replace(/^2/, ''); // Assuming removing country code prefix '2', modify if needed
}

// Safe i18n accessor — useI18n() throws in vue-i18n v11 outside setup context
function getT() {
  return useNuxtApp().$i18n.t;
}

// Handle error during lead creation
function handleError(message: string) {
  const t = getT();
  ElNotification({
    type: 'error',
    title: t('common.error'),
    message
  });
}
function handleSuccess(message: string) {
  const t = getT();
  ElNotification({
    type: 'success',
    title: t('common.success'),
    message
  });
}

export interface Lead {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  leadSource: string;
  user: number;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  assign?: string;
  [key: string]: string | number | undefined | UserSummary[];
}

interface UserSummary {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
}

export interface Activity {
  id: string;
  status: string;
  description: string;
  createdAt: string;
  user?: {
    name: string;
    profilePicture?: string;
  };
}

export interface ActivityResponse {
  docs: Activity[];
  pagination: {
    page: number | string;
    totalPages: number | string;
    totalItems: number;
    limit: number;
  };
}

export enum LeadSourceEnums {
  REFERRAL = 'REFERRAL',
  WEBSITE = 'WEBSITE',
  EVENT = 'EVENT',
  EMAIL = 'EMAIL',
  OTHER = 'OTHER'
}

export enum LeadStatusEnums {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  DISQUALIFIED = 'DISQUALIFIED'
}

export const leadSources = [
  { label: 'Referral', value: LeadSourceEnums.REFERRAL },
  { label: 'Website', value: LeadSourceEnums.WEBSITE },
  { label: 'Event', value: LeadSourceEnums.EVENT },
  { label: 'Email', value: LeadSourceEnums.EMAIL },
  { label: 'Other', value: LeadSourceEnums.OTHER }
];

export const leadStates = [
  { label: 'New', value: LeadStatusEnums.NEW },
  { label: 'Contacted', value: LeadStatusEnums.CONTACTED },
  { label: 'Qualified', value: LeadStatusEnums.QUALIFIED },
  { label: 'Disqualified', value: LeadStatusEnums.DISQUALIFIED }
];
interface UseLeadsResult {
  leads: Lead[];
  pagination: Pagination;
}
/**
 * Fetches a list of leads from the API
 * @returns {Promise<Lead[]>} A promise that resolves to an array of Lead objects
 * @throws {Error} If the API call is unsuccessful, an error is thrown with a message
 */
export async function getLeads(): Promise<UseLeadsResult> {
  try {
    // Make the API call
    const { body, success, message } = await useApiFetch('lead');

    if (success) {
      // Return the docs (leads) from the response
      const leads = body?.docs?.map((lead: Lead) => ({
        ...lead,
        createdAt: formatDate(lead.createdAt),
        // updatedAt: formatDate(lead.updatedAt),
        leadDetails: { title: lead?.name, text: lead?.companyName },
        updatedAt: '-',
        assign: (lead.users as UserSummary[] | undefined)?.map((el: UserSummary) => el.name).join(', ')
      }));
      const pagination = body?.pagination;
      return { leads, pagination };
    } else {
      // If the API call is unsuccessful, throw an error with the message
      const t = getT();
      throw new Error(message || t('common.fetchError'));
    }
  } catch (error) {
    // Catch and log any errors, either from the API call or from unexpected issues
    logger.error('Error fetching leads:', error instanceof Error ? error.message : error);

    const t = getT();
    handleError(t('common.fetchError'));

    // Return an empty array as fallback
    return { leads: [], pagination: { totalItems: 0, page: 1, limit: 10, totalPages: 1 } };
  }
}

/**
 * Fetches a single lead from the API
 * @param id - The ID of the lead to fetch
 * @returns {Promise<Lead>} A promise that resolves to a Lead object
 * @throws {Error} If the API call is unsuccessful, an error is thrown with a message
 */
export async function getLead(id: string | string[]): Promise<Lead> {
  try {
    const { body: lead } = await useApiFetch(`lead/${id}`);
    return lead;
  } catch (error) {
    logger.error('Error fetching lead:', error instanceof Error ? error.message : error);
    const t = getT();
    handleError(t('common.fetchError'));
    return {} as Lead;
  }
}

export async function getActivity(id: string | string[]): Promise<ActivityResponse> {
  try {
    const { body: activities } = await useApiFetch(`activity/lead/${id}`);
    return activities;
  } catch (error) {
    logger.error('Error fetching activity:', error instanceof Error ? error.message : error);
    const t = getT();
    handleError(t('common.fetchError'));
    return { docs: [], pagination: { page: 1, totalPages: 1, totalItems: 0, limit: 10 } } as ActivityResponse;
  }
}

export interface LeadValues {
  id?: string | string[];
  leadName: string;
  companyName: string;
  email: string;
  phone: string;
  leadSource: string;
  assignUser: string;
  lastContactDate: string;
  notes: string;
  leadState: string;
  otherSource?: string;
}

/**
 * Create a new lead
 * @param values - The values to create the lead with
 * @returns {Promise<void>}
 */

export async function createLead(values: LeadValues) {
  try {
    // Normalize the phone number before sending
    const normalizedPhone = normalizePhoneNumber(values.phone);

    // Prepare the lead data
    const leadData = {
      name: values.leadName,
      companyName: values.companyName,
      email: values.email,
      phone: normalizedPhone,
      leadSource: values.leadSource,
      users: values.assignUser,
      notes: values.notes,
      status: values.leadState,
      otherSource: values.otherSource
    };

    // Call API to create the lead
    const response = await useApiFetch('lead', 'POST', cleanObject(leadData));

    const t = getT();
    // Handle the API response
    if (response?.success) {
      handleSuccess(t('leads.createSuccess'));
    } else {
      handleError(response?.message || t('leads.createFailed'));
    }
    return response;
  } catch (error) {
    const t = getT();
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : t('errors.generic'));
    return { success: false, body: null, message: error instanceof Error ? error.message : 'Unknown error', code: 500 };
  }
}

/**
 * Update an existing lead
 * @param values - The values to update the lead with
 */
export async function updateLead(values: LeadValues) {
  try {
    // Normalize the phone number before sending
    const normalizedPhone = normalizePhoneNumber(values.phone);

    // Prepare the lead data
    const leadData = {
      name: values.leadName,
      companyName: values.companyName,
      email: values.email,
      phone: normalizedPhone,
      leadSource: values.leadSource,
      lastContactDate: getYear(values.lastContactDate),
      users: values.assignUser,
      notes: values.notes,
      status: values.leadState,
      otherSource: values.otherSource
    };

    // Call API to create the lead
    const response = await useApiFetch(`lead/${values.id}`, 'PUT', leadData);

    const t = getT();
    // Handle the API response
    if (response?.success) {
      handleSuccess(t('leads.updateSuccess'));
    } else {
      handleError(response?.message || t('leads.updateFailed'));
    }
    return response;
  } catch (error) {
    const t = getT();
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : t('errors.generic'));
    return { success: false, body: null, message: error instanceof Error ? error.message : 'Unknown error', code: 500 };
  }
}

export async function deleteLead(id: string) {
  try {
    const response = await useApiFetch(`lead/${id}`, 'DELETE');
    const t = getT();
    if (response?.success) {
      handleSuccess(t('leads.deleteSuccess'));
    } else {
      handleError(response?.message || t('leads.deleteFailed'));
    }
    return response;
  } catch (error) {
    const t = getT();
    handleError(error instanceof Error ? error.message : t('errors.generic'));
    return { success: false, body: null, message: error instanceof Error ? error.message : 'Unknown error', code: 500 };
  }
}
