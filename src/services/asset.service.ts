import api from './api';

export interface Asset {
  id: string;
  name: string;
  description?: string;
  amount: number;
  value: number;
  branch_id: string;
  created_at: string;
  updated_at: string;
}

export const getAssets = async (branchId?: string): Promise<Asset[]> => {
  const params = branchId ? { branchId } : {};
  const resp = await api.get('/finance-clerk/assets', { params });
  return resp.data;
};

export const createAsset = async (asset: {
  name: string;
  description?: string;
  amount: number;
  value: number;
  branch_id: string;
}): Promise<Asset> => {
  const resp = await api.post('/finance-clerk/assets', asset);
  return resp.data;
};

export const updateAsset = async (id: string, asset: {
  name?: string;
  description?: string;
  amount?: number;
  value?: number;
  branch_id?: string;
  reason?: string;
}): Promise<Asset> => {
  const resp = await api.post(`/finance-clerk/assets/${id}`, asset);
  return resp.data;
};

export const deleteAsset = async (id: string): Promise<void> => {
  await api.delete(`/finance-clerk/assets/${id}`);
};
