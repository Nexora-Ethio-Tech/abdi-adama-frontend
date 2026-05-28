import axios from 'axios';

export interface Asset {
  id: string;
  name: string;
  description?: string;
  value: number;
  branch_id: string;
  created_at: string;
  updated_at: string;
}

export const getAssets = async (branchId?: string): Promise<Asset[]> => {
  const params = branchId ? { branchId } : {};
  const resp = await axios.get('/api/assets', { params });
  return resp.data;
};

export const createAsset = async (asset: {
  name: string;
  description?: string;
  value: number;
  branch_id: string;
}): Promise<Asset> => {
  const resp = await axios.post('/api/assets', asset);
  return resp.data;
};

export const updateAsset = async (id: string, asset: {
  name?: string;
  description?: string;
  value?: number;
  branch_id?: string;
}): Promise<Asset> => {
  const resp = await axios.patch(`/api/assets/${id}`, asset);
  return resp.data;
};

export const deleteAsset = async (id: string): Promise<void> => {
  await axios.delete(`/api/assets/${id}`);
};
