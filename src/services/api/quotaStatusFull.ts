import { apiClient } from './client';
import type { QuotaFullResponse } from '@/types/quotaStatusFull';

export const quotaStatusFullApi = {
  getAll: (): Promise<QuotaFullResponse> =>
    apiClient.get<QuotaFullResponse>('/quota-status/full', { timeout: 60000 }),
};
