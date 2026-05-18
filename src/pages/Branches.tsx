
import { Building2, MapPin, Users, GraduationCap, ChevronRight, Plus, ArrowLeft, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useStore } from '../context/useStore';
import { useState, useEffect } from 'react';
import { branchService, type Branch } from '../services/branchService';

export const Branches = () => {
  const { branches: mockBranches, setSelectedBranch } = useUser();
  const { selectedBranchId, setSelectedBranchId } = useStore();
  const navigate = useNavigate();

  // API Integration: Fetch real branches
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await branchService.getAllBranches();
        if (response.success) {
          setBranches(response.data);
          console.log('✅ Branches API Success:', response.data);
        }
      } catch (err: any) {
        console.error('❌ Branches API Error:', err);
        setError(err.message || 'Failed to fetch branches');
        // Fallback to mock data
        setBranches(mockBranches as any);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [mockBranches]);

  const handleEnterBranch = (branch: Branch) => {
    setSelectedBranch(branch as any);
    setSelectedBranchId(branch.id);
    navigate('/');
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await branchService.createBranch(branchForm);
      console.log('✅ Branch created:', response);
      alert('Branch created successfully!');
      setShowAddModal(false);
      setBranchForm({ name: '', code: '', phone: '', email: '', address: '' });
      // Refresh branches
      const refreshResponse = await branchService.getAllBranches();
      if (refreshResponse.success) {
        setBranches(refreshResponse.data);
      }
    } catch (err: any) {
      console.error('❌ Error creating branch:', err);
      alert(err.response?.data?.error?.message || 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 mt-4">Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Breadcrumbs />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">School Branches</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage and monitor all school locations from one place.
            {error && <span className="text-amber-600 ml-2">⚠️ Using cached data</span>}
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
        >
          <Plus size={20} />
          <span>Add New Branch</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none hover:shadow-xl dark:hover:shadow-none transition-all overflow-hidden group hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                  <Building2 size={24} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${selectedBranchId === branch.id ? 'bg-blue-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                  {selectedBranchId === branch.id ? 'Selected' : 'Active'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{branch.name}</h3>
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-6">
                <MapPin size={14} />
                <span>{branch.address || branch.location || 'No location'}</span>
              </div>

              <button
                onClick={() => handleEnterBranch(branch)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-slate-200/50 dark:shadow-none"
              >
                Enter Branch View
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Building2 size={20} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Add New Branch</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleCreateBranch}>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Branch Name</label>
                <input
                  type="text"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="e.g. Main Branch"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Branch Code</label>
                <input
                  type="text"
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                  placeholder="e.g. MB"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                <input
                  type="tel"
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                  placeholder="+251911000000"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                <input
                  type="email"
                  value={branchForm.email}
                  onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                  placeholder="branch@abdiadama.com"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                <input
                  type="text"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="Addis Ababa, Ethiopia"
                  className="w-full mt-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  <span>{creating ? 'Creating...' : 'Create Branch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
