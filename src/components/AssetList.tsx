import { useState, useEffect } from 'react';
import { getAssets, createAsset, type Asset } from '../services/asset.service';
import { useStore } from '../context/useStore';
import { useUser } from '../context/UserContext';
import { X, Plus, MapPin, Sparkles, AlertCircle } from 'lucide-react';

const AssetList = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', amount: '1', value: '', branch_id: '' });
  const [error, setError] = useState<string | null>(null);
  const { selectedBranchId } = useStore();
  const { selectedBranch, user } = useUser();

  const currentBranchId = selectedBranchId || (user as any)?.branchId || selectedBranch?.id || '';
  const currentBranchName = (user as any)?.branchName || selectedBranch?.name || 'Selected Branch';

  const fetchAssets = async (branchId: string) => {
    try {
      const data = await getAssets(branchId);
      setAssets(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentBranchId) {
      setAssets([]);
      setLoading(false);
      return;
    }

    setForm((current) => ({ ...current, branch_id: currentBranchId }));
    fetchAssets(currentBranchId);
  }, [currentBranchId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAsset({
        name: form.name,
        description: form.description || undefined,
        amount: parseInt(form.amount, 10),
        value: parseFloat(form.value),
        branch_id: form.branch_id
      });
      setShowModal(false);
      setForm({ name: '', description: '', amount: '1', value: '', branch_id: currentBranchId });
      fetchAssets(currentBranchId);
    } catch (e: any) {
      setError(e.message || 'Failed to create asset');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-slate-900/20 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.55),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.35),_transparent_30%)]" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200 backdrop-blur">
              <Sparkles size={12} />
              Inventory
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">School Inventory</h2>
            <p className="text-slate-200 text-sm md:text-base leading-6 max-w-xl">
              Manage fixed assets and equipment for the active branch from one clean panel.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-200">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <MapPin size={12} />
                {currentBranchName}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                {assets.length} recorded items
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              disabled={!currentBranchId}
              className="flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>
      </div>

      {!currentBranchId && (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 dark:bg-amber-900/20 dark:border-amber-800 p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div className="space-y-1">
            <p className="font-black text-sm uppercase tracking-widest">Branch Required</p>
            <p className="text-sm leading-6">Select a branch first. Inventory is branch-specific, so this panel only loads after a branch is active.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : currentBranchId ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-separate border-spacing-y-3">
            <thead className="bg-transparent">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Item</th>
                <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Details</th>
                <th className="px-4 py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Amount</th>
                <th className="px-4 py-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Value</th>
                <th className="px-4 py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Created</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="bg-white dark:bg-slate-900 shadow-[0_1px_0_rgba(148,163,184,0.08)] rounded-[1.25rem]">
                  <td className="px-4 py-4 rounded-l-[1.25rem]">
                    <div className="font-bold text-slate-900 dark:text-white">{a.name}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {a.description || 'No description'}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-slate-700 dark:text-slate-200">
                    {a.amount}
                  </td>
                  <td className="px-4 py-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                    {Number(a.value).toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-4 text-center text-xs text-slate-400 rounded-r-[1.25rem]">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {assets.length === 0 && (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-10 text-center">
              <p className="text-slate-900 dark:text-white font-black text-lg">No inventory items yet</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Add the first item for {currentBranchName} using the button above.</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 md:items-center">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white dark:bg-slate-950 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-100">Inventory</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight">Add Inventory Item</h3>
                <p className="mt-1 text-sm text-emerald-50/90">Record an asset for {currentBranchName}.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8">
              {error && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-slate-500">Item Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Projector, desk, laptop..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-slate-500">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Short note about condition, serial number, or location"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-slate-500">Amount</label>
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      step="1"
                      value={form.amount}
                      onChange={handleChange}
                      required
                      placeholder="1"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-slate-500">Value (ETB)</label>
                    <input
                      name="value"
                      type="number"
                      step="0.01"
                      value={form.value}
                      onChange={handleChange}
                      required
                      placeholder="0.00"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.25em] text-slate-500">Branch</label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                      {currentBranchName}
                    </div>
                  </div>
                </div>

                <input type="hidden" name="branch_id" value={currentBranchId} />

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!currentBranchId}
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
                  >
                    Save Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetList;
