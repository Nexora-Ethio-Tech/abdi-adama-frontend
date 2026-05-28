import { useState, useEffect } from 'react';
import { getAssets, createAsset, type Asset } from '../services/asset.service';
import { branchService, type Branch } from '../services/branchService';
import { X, Plus } from 'lucide-react';

const AssetList = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ name: '', description: '', value: '', branch_id: '' });
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = async () => {
    try {
      const response = await branchService.getAllBranches();
      const list = response.data || [];
      setBranches(list);
      if (!form.branch_id && list.length > 0) {
        setForm((current) => ({ ...current, branch_id: list[0].id }));
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load branches');
    }
  };

  const fetchAssets = async () => {
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchAssets();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAsset({
        name: form.name,
        description: form.description || undefined,
        value: parseFloat(form.value),
        branch_id: form.branch_id
      });
      setShowModal(false);
      setForm({ name: '', description: '', value: '', branch_id: '' });
      fetchAssets();
    } catch (e: any) {
      setError(e.message || 'Failed to create asset');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Assets</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Description</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-slate-600 uppercase">Value</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-slate-600 uppercase">Branch</th>
                <th className="px-4 py-2 text-center text-xs font-bold text-slate-600 uppercase">Created</th>
                <th className="px-4 py-2 text-center text-xs font-bold text-slate-600 uppercase">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-4 py-2">{a.name}</td>
                  <td className="px-4 py-2 text-sm text-slate-500">{a.description || '-'} </td>
                  <td className="px-4 py-2 text-right font-medium">{a.value.toLocaleString()}</td>
                  <td className="px-4 py-2">{branches.find((branch) => branch.id === a.branch_id)?.name || a.branch_id}</td>
                  <td className="px-4 py-2 text-center text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-center text-xs text-slate-400">{new Date(a.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Asset</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && <div className="bg-rose-100 text-rose-800 p-2 rounded mb-2">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <input
                  name="value"
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={handleChange}
                  required
                  className="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Branch</label>
                <select
                  name="branch_id"
                  value={form.branch_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mr-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetList;
