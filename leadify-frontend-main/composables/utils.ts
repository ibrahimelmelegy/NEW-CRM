import { ElNotification } from 'element-plus';
import logger from '~/utils/logger';

export const numberOfFilters = ref();

export function copyText(slug: string) {
  navigator.clipboard.writeText(slug);
  ElNotification({
    type: 'success',
    message: h('h1', { style: 'color:#1BC5C3' }, 'Code copied Successfully')
  });
}

interface RouteLocation {
  fullPath: string;
}

export function checkRouteDispatch(to: RouteLocation, from: RouteLocation) {
  const toRoue = to.fullPath.split('/');
  const fromRoute = from.fullPath.split('/');

  return toRoue[toRoue.length - 2] === fromRoute[fromRoute.length - 1];
}
export function checkSecParent(to: RouteLocation, from: RouteLocation) {
  const toRoue = to.fullPath.split('/');
  const fromRoute = from.fullPath.includes('?') ? from.fullPath.split('?')[0]!.split('/') : from.fullPath.split('/');

  return toRoue[2] === fromRoute[2];
}
export function checkparent(to: RouteLocation, from: RouteLocation) {
  const toRoue = to.fullPath.split('/');
  const fromRoute = from.fullPath.split('/');

  return toRoue[1] === fromRoute[1];
}
export function isObjectValid(obj: unknown): boolean {
  // Check if the input is an object and not null
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // Iterate through object properties
  const record = obj as Record<string, unknown>;
  for (const key in record) {
    if (!record[key]) {
      return false; // Return false if any value is null or undefined
    }
  }

  return true; // All properties are valid
}

export const filterLength = (obj: Record<string, unknown>): number => {
  if (!Object.entries(obj).length) return 0;
  return Object.entries(obj)?.reduce((total, [_key, value]) => {
    if (Array.isArray(value) || typeof value === 'string') {
      // Add the length of arrays or strings
      return total + value.length;
    }
    return total; // Skip other types
  }, 0);
};

export const cleanObject = (obj: Record<string, unknown>): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_key, value]) => {
      // Remove falsy values, empty arrays, and empty objects
      if (value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))) return false; // Falsy values
      if (Array.isArray(value) && value.length === 0) return false; // Empty array
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) return false; // Empty object
      return true; // Keep other values
    })
  );
};

export function isNullish(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') || // Empty string
    (Array.isArray(value) && value.length === 0) || // Empty array
    (typeof value === 'object' && value !== null && Object.keys(value as object).length === 0) // Empty object
  );
}

interface UploadRequestParams {
  file: File;
  filename: string;
  data: Record<string, string>;
}

export const handleUploadRequestApi = async (params: UploadRequestParams, payloadName?: string, model?: string) => {
  const result = ref<unknown>();
  const errorData = ref<unknown>();

  const { file, filename: initialFilename, data } = params;
  let filename = initialFilename;
  try {
    data.model = model || '';
    if (payloadName) {
      filename = payloadName;
    }

    const formData = new FormData();
    const fileToUpload = new File([file], file.name);

    formData.append(filename, fileToUpload);

    Object.entries(data).forEach(([key, value]: [string, string]) => {
      formData.append(key, value);
    });

    const response = await useApiFetch('upload', 'POST', formData, false, true);
    if (response?.success) {
      result.value = response.body;
    }
  } catch (error) {
    errorData.value = error;
    logger.error('Upload failed:', error);
  }
  return { result, errorData };
};
