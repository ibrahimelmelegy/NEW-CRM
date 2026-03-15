import { ElNotification } from 'element-plus';
import logger from '~/utils/logger'

// Handle error during service creation
function handleError(message: string) {
  const t = useNuxtApp().$i18n.t;
  ElNotification({
    type: 'error',
    title: t('common.error'),
    message
  });
}
function handleSuccess(message: string, id?: string, redirect: boolean = true) {
  const t = useNuxtApp().$i18n.t;
  ElNotification({
    type: 'success',
    title: t('common.success'),
    message
  });
  if (!redirect) {
    return;
  }
  if (id) {
    navigateTo(`/operations/services/${id}`); // Navigate to the service details
  } else {
    navigateTo('/operations/services'); // Navigate to the services list
  }
}

export interface Service {
  type: string;
  price: string | number;
  [key: string]: unknown;
}

interface UseServicesResult {
  services: Service[];
  pagination: Pagination;
}

/**
 * Fetches a list of services from the API
 * @returns {Promise<UseServicesResult>} A promise that resolves to an object containing the services and pagination
 * @throws {Error} If the API call is unsuccessful, an error is thrown with a message
 */
export async function getServices(): Promise<UseServicesResult> {
  try {
    // Make the API call
    const { body, success, message } = await useApiFetch('service');

    if (success) {
      // Return the docs (services) from the response
      const services = body?.docs?.map(service => ({
        ...service,
        createdAt: formatDate(service.createdAt),
        // updatedAt: formatDate(service.updatedAt),
        updatedAt: '-',
        assign: service.user?.name
      }));
      const pagination = body?.pagination;
      return { services, pagination };
    } else {
      // If the API call is unsuccessful, throw an error with the message
      throw new Error(message || 'Failed to fetch services');
    }
  } catch (error) {
    // Catch and log any errors, either from the API call or from unexpected issues
    logger.error('Error fetching services:', error instanceof Error ? error.message : error);

    // Optionally, you could show a notification here if needed
    handleError('An error occurred while fetching services. Please try again.');

    // Return an empty array as fallback
    return { services: [], pagination: { totalItems: 0, page: 1, limit: 10, totalPages: 1 } };
  }
}

/**
 * Fetches a single service from the API
 * @param id - The ID of the service to fetch
 * @returns {Promise<Service>} A promise that resolves to a Service object
 * @throws {Error} If the API call is unsuccessful, an error is thrown with a message
 */
export async function getService(id: string | string[]): Promise<Service> {
  try {
    const { body: service } = await useApiFetch(`service/${id}`);
    return service;
  } catch (error) {
    logger.error('Error fetching service:', error instanceof Error ? error.message : error);
    handleError('An error occurred while fetching service. Please try again.');
    return {} as Service;
  }
}

/**
 * Creates a new service
 * @param values - The values to create the service with
 * @returns {Promise<void>} A promise that resolves when the service is created
 * @throws {Error} If the API call is unsuccessful, an error is thrown with a message
 */

export async function createService(values: Service, redirect: boolean = true): Promise<void> {
  const t = useNuxtApp().$i18n.t;
  // Normalize the phone number before sending
  try {
    const mappedService = mapToNumbers(values);
    // Call API to create the service
    const response = await useApiFetch('service', 'POST', mappedService);

    // Handle the API response
    if (response?.success) {
      handleSuccess(t('common.created'), '', redirect);
    } else {
      handleError(response?.message || 'Something went wrong');
    }
  } catch (error) {
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Updates an existing service
 * @param values - The values to update the service with
 * @returns {Promise<void>} A promise that resolves when the service is updated
 * @throws {Error} If the API call is unsuccessful, an error is thrown with a message
 */
export async function updateService(values: Service, redirect: boolean = true): Promise<void> {
  const t = useNuxtApp().$i18n.t;
  try {
    const mappedService = mapToNumbers(values);
    delete mappedService.id;
    // Call API to create the service
    const response = await useApiFetch(`service/${values.id}`, 'PUT', mappedService);

    // Handle the API response
    if (response?.success) {
      handleSuccess(t('common.saved'), values.id, redirect);
    } else {
      handleError(response?.message || 'Something went wrong');
    }
  } catch (error) {
    // Catch any unexpected errors and handle them
    handleError(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Maps numeric fields of a Service object to numbers if they are strings.
 * a number with two decimal places; otherwise, the original value is retained.
 *
 * @param {Service} data - The service data to map
 * @returns {Service} The mapped service data with numeric fields converted
 */
function mapToNumbers(data: Service): Service {
  const numericFields = ['price'];

  // Convert specified fields to numbers if they are strings
  const mappedData = { ...data };
  numericFields.forEach(field => {
    if (typeof mappedData[field as keyof Service] === 'string') {
      const numericValue = parseFloat(mappedData[field as keyof Service] as unknown as string);
      mappedData[field as keyof Service] = isNaN(numericValue)
        ? mappedData[field as keyof Service] // Keep original value if parsing fails
        : Number(numericValue.toFixed(2)); // Convert to number and fix to 2 decimal places
    }
  });

  return mappedData;
}

export async function deleteServiceById(id: string) {
  const t = useNuxtApp().$i18n.t;
  try {
    const response = await useApiFetch(`service/${id}`, 'DELETE');
    if (response?.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: response?.message || 'Failed to delete service' });
    }
    return response;
  } catch (error) {
    ElNotification({ type: 'error', title: t('common.error'), message: error instanceof Error ? error.message : 'Unknown error' });
    return { success: false, body: null, message: 'Unknown error', code: 500 };
  }
}
