export interface LeaderboardEntry {
  rank: number;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    profilePicture?: string;
  };
  totalPoints: number;
}

export interface UserPointsEntry {
  id: number;
  userId: number;
  points: number;
  reason: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface UserPointsResponse {
  userId: number;
  user: any;
  totalPoints: number;
  recentPoints: UserPointsEntry[];
}

export interface Achievement {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  pointsValue: number;
  criteria?: string;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { body, success } = await useApiFetch('gamification');
  return success && body ? (body as LeaderboardEntry[]) : [];
}

export async function fetchMyPoints(): Promise<UserPointsResponse | null> {
  const { body, success } = await useApiFetch('gamification/my-points');
  return success && body ? (body as UserPointsResponse) : null;
}

export async function awardPoints(data: { userId: number; points: number; reason: string; entityType?: string; entityId?: string }) {
  return useApiFetch('gamification/award', 'POST', data);
}

export async function fetchAchievements(): Promise<Achievement[]> {
  const { body, success } = await useApiFetch('gamification/achievements');
  return success && body ? (body as Achievement[]) : [];
}

export async function createAchievement(data: Partial<Achievement>) {
  return useApiFetch('gamification/achievements', 'POST', data);
}

export async function deleteAchievement(id: number) {
  return useApiFetch(`gamification/achievements/${id}`, 'DELETE');
}
