/* eslint-disable require-await */
export interface FieldCheckIn {
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  address?: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  notes?: string;
  photoUrl?: string;
  user?: { id: number; name: string; email?: string; profilePicture?: string };
  createdAt: string;
  updatedAt: string;
}

export async function fetchCheckIns(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`field-ops${query}`);
  if (success && body) {
    return body as { docs: FieldCheckIn[]; pagination: unknown };
  }
  return {
    docs: [],
    pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 }
  };
}

export async function createCheckIn(data: unknown) {
  return useApiFetch('field-ops', 'POST', data);
}

export async function fetchMyHistory() {
  const { body, success } = await useApiFetch('field-ops/my-history');
  return success && body ? (body as FieldCheckIn[]) : [];
}

export async function fetchTeamLocations() {
  const { body, success } = await useApiFetch('field-ops/team-locations');
  return success && body ? (body as FieldCheckIn[]) : [];
}
