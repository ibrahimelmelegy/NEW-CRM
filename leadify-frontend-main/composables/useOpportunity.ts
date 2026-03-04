/* eslint-disable no-use-before-define */
import { ElNotification } from 'element-plus';
// Handle error during Opportunity creation
function handleError(message: string) {
  ElNotification({
    type: 'error',
    title: 'Error',
    message
  });
}
function handleSuccess(message: string) {
  ElNotification({
    type: 'success',
    title: 'Success',
    message
  });
}

export interface Leads {
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  users?: number;
}

export interface Opportunities {
  id?: number;
  name?: string;
  stage?: string;
  estimatedValue?: number;
  expectedCloseDate?: string;
  priority?: string;
  interestedIn?: string;
  nextSteps?: string | string[];
  reasonOfLose?: string;
  users?: number | Array<{ id: number; name: string }>;
  leadId?: number;
  createdAt?: string;
  updatedAt?: string;
  user?: { name: string };
  assign?: string;
  [key: string]: string | number | boolean | undefined | string[] | Array<{ id: number; name: string }> | { name: string };
}

export interface FormattedValues {
  leads?: Leads;
  opportunities?: Opportunities;
  [key: string]: Leads | Opportunities | undefined;
}

interface UseOpportunitiesResult {
  opportunties: Opportunities[];
  pagination: Pagination;
}

export enum StageEnum {
  Discovery = 'DISCOVERY',
  Proposal = 'PROPOSAL',
  Negotiation = 'NEGOTIATION',
  Lost = 'LOST',
  Won = 'WON'
}

export const stageOptions = [
  { label: 'opportunities.stages.discovery', value: StageEnum.Discovery },
  { label: 'opportunities.stages.proposal', value: StageEnum.Proposal },
  { label: 'opportunities.stages.negotiation', value: StageEnum.Negotiation },
  { label: 'opportunities.stages.lost', value: StageEnum.Lost },
  { label: 'opportunities.stages.won', value: StageEnum.Won }
];

export enum priorityEnum {
  VeryLow = 'VERY_LOW',
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH',
  VeryHigh = 'VERY_HIGH'
}

export const priorityOptions = [
  { label: 'opportunities.priorities.veryLow', value: priorityEnum.VeryLow },
  { label: 'opportunities.priorities.low', value: priorityEnum.Low },
  { label: 'opportunities.priorities.medium', value: priorityEnum.Medium },
  { label: 'opportunities.priorities.high', value: priorityEnum.High },
  { label: 'opportunities.priorities.veryHigh', value: priorityEnum.VeryHigh }
];

export enum stepsEnum {
  ScheduleMeeting = 'Schedule Meeting',
  SendProposal = 'Send Proposal',
  FollowUpCall = 'Follow-Up Call',
  NegotiateTerms = 'Negotiate Terms',
  CloseTheDeal = 'Close the Deal'
}

export const stepsOptions = [
  { label: 'opportunities.steps.scheduleMeeting', value: stepsEnum.ScheduleMeeting },
  { label: 'opportunities.steps.sendProposal', value: stepsEnum.SendProposal },
  { label: 'opportunities.steps.followUpCall', value: stepsEnum.FollowUpCall },
  { label: 'opportunities.steps.negotiateTerms', value: stepsEnum.NegotiateTerms },
  { label: 'opportunities.steps.closeTheDeal', value: stepsEnum.CloseTheDeal }
];

export enum reasonEnum {
  NotInterested = 'Not Interested',
  NoBudget = 'No Budget',
  CompetitorChosen = 'Competitor Chosen',
  Other = 'Other'
}

export const reasonOptions = [
  { label: 'opportunities.reasons.notInterested', value: reasonEnum.NotInterested },
  { label: 'opportunities.reasons.noBudget', value: reasonEnum.NoBudget },
  { label: 'opportunities.reasons.competitorChosen', value: reasonEnum.CompetitorChosen },
  { label: 'opportunities.reasons.other', value: reasonEnum.Other }
];
/**
 * Fetches a list of opportunties from the API
 * @returns {Promise<Opportunities[]>} A promise that resolves to an array of Opportunities objects
 * @throws {Error} If the API call is unsuccessful, an error is thrown with a message
 */
export async function getOpportunities(all?: false): Promise<UseOpportunitiesResult> {
  try {
    // Make the API call
    const { body, success, message } = all ? await useApiFetch('opportunity?limit=1000') : await useApiFetch('opportunity');

    if (success) {
      // Return the docs (opportunties) from the response
      const opportunties = body?.docs?.map((opportunity: Opportunities) => ({
        ...opportunity,
        createdAt: formatDate(opportunity.createdAt as string),
        // updatedAt: formatDate(opportunity.updatedAt),
        updatedAt: '-',
        assign: opportunity.user?.name
      }));
      const pagination = body?.pagination;
      return { opportunties, pagination };
    } else {
      // If the API call is unsuccessful, throw an error with the message
      throw new Error(message || 'Failed to fetch opportunties');
    }
  } catch (error) {
    // Catch and log any errors, either from the API call or from unexpected issues
    console.error('Error fetching opportunties:', error instanceof Error ? error.message : error);

    // Optionally, you could show a notification here if needed
    handleError('An error occurred while fetching opportunties. Please try again.');

    // Return an empty array as fallback
    return { opportunties: [], pagination: { totalItems: 0, page: 1, limit: 10, totalPages: 1 } };
  }
}

/**
 * Fetches a single opportunity from the API
 */
export async function getOpportunity(id: string | string[]): Promise<Opportunities> {
  try {
    const { body: opportunity, success } = await useApiFetch(`opportunity/${id}`);
    return opportunity;
  } catch (error) {
    console.error('Error fetching opportunity:', error instanceof Error ? error.message : error);
    handleError('An error occurred while fetching opportunity. Please try again.');
    return {} as Opportunities;
  }
}

export async function getOpportunityActivity(id: string | string[]): Promise<ActivityResponse> {
  try {
    const { body: activity, success } = await useApiFetch(`activity/opportunity/${id}`);
    return activity as unknown as ActivityResponse;
  } catch (error) {
    console.error('Error fetching activity:', error instanceof Error ? error.message : error);
    handleError('An error occurred while fetching opportunity. Please try again.');
    return { docs: [], pagination: { page: 1, totalPages: 1, totalItems: 0, limit: 10 } };
  }
}

interface ActivityResponse {
  docs: Array<{ id: string; status: string; description: string; createdAt: string }>;
  pagination: { page: number | string; totalPages: number | string; totalItems: number; limit: number };
}

/**
 * Create a new opportunity
 * @param values - The values to create the opportunity with
 * @returns {Promise<void>}
 */

export async function createOpportunity(values: FormattedValues) {
  try {
    // Call API to create the opportunity
    const response = await useApiFetch('opportunity', 'POST', values);

    // Handle the API response
    if (response?.success) {
      handleSuccess('Opportunity created successfully');
    } else {
      handleError(response?.message || 'Something went wrong');
    }
    return response;
  } catch (error) {
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, body: null, message: error instanceof Error ? error.message : 'Unknown error', code: 500 };
  }
}

/**
 * Update an existing opportunity
 * @param values - The values to update the opportunity with
 */
export async function updateOpportunity(values: FormattedValues, id: string | string[]) {
  try {
    // Call API to create the opportunity
    const response = await useApiFetch(`opportunity/${id}`, 'PUT', values);

    // Handle the API response
    if (response?.success) {
      handleSuccess('Opportunity updated successfully');
    } else {
      handleError(response?.message || 'Something went wrong');
    }
    return response;
  } catch (error) {
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, body: null, message: error instanceof Error ? error.message : 'Unknown error', code: 500 };
  }
}

/**
 * Convert a lead to an opportunity
 * @param values - The values to create the opportunity with
 */
export async function convertLeadToOpportunity(values: Opportunities) {
  try {
    // Call API to create the opportunity
    const response = await useApiFetch(`opportunity/convert-lead`, 'POST', values);

    // Handle the API response
    if (response?.success) {
      handleSuccess('Opportunity Added successfully');
    } else {
      handleError(response?.message || 'Something went wrong');
    }
    return response;
  } catch (error) {
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, body: null, message: error instanceof Error ? error.message : 'Unknown error', code: 500 };
  }
}

export async function deleteOpportunity(id: string) {
  try {
    const response = await useApiFetch(`opportunity/${id}`, 'DELETE');
    if (response?.success) {
      handleSuccess('Opportunity deleted successfully');
    } else {
      handleError(response?.message || 'Failed to delete opportunity');
    }
    return response;
  } catch (error) {
    handleError(error instanceof Error ? error.message : 'Unknown error');
    return { success: false, body: null, message: error instanceof Error ? error.message : 'Unknown error', code: 500 };
  }
}
