import React, { useState, useEffect } from 'react';
import { Search, Edit3, DollarSign, Landmark, FileText, X, Save, AlertCircle, Award } from 'lucide-react';
import payrollService, { EmployeePayrollProfile } from '../services/payrollService';
import { useUser } from '../context/UserContext';

export const EmployeeProfiles = () => {
  const { role, branches } = useUser();
  const [profiles, setProfiles] = useState<EmployeePayrollProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Editing Profile Modal
  const [editingProfile, setEditingProfile] = useState<EmployeePayrollProfile | null>(null);
  const [basicSalary, setBasicSalary] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');
  const [housingAllowance, setHousingAllowance] = useState('');
  const [positionAllowance, setPositionAllowance] = useState('');
  const [overtimeRatePerHour, setOvertimeRatePerHour] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [selectedBranch]);

  const loadProfiles = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await payrollService.getAllProfiles({
        branchId: selectedBranch || undefined
      });
      setProfiles(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load employee salary profiles.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (profile: EmployeePayrollProfile) => {
    setEditingProfile(profile);
    setBasicSalary(profile.basic_salary.toString());
    setTransportAllowance(profile.transport_allowance.toString());
    setHousingAllowance(profile.housing_allowance.toString());
    setPositionAllowance(profile.position_allowance.toString());
    setOvertimeRatePerHour(profile.overtime_rate_per_hour.toString());
    setBankAccount(profile.bank_account || '');
    setTinNumber(profile.tin_number || '');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    setModalLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await payrollService.createOrUpdateProfile({
        userId: editingProfile.user_id,
        basicSalary: Number(basicSalary),
        transportAllowance: Number(transportAllowance),
        housingAllowance: Number(housingAllowance),
        positionAllowance: Number(positionAllowance),
        overtimeRatePerHour: Number(overtimeRatePerHour),
        bankAccount,
        tinNumber
      });

      setSuccessMsg(`Salary parameters for ${editingProfile.name} updated successfully!`);
      setEditingProfile(null);
      await loadProfiles();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update employee salary profile.');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.digital_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const paginatedProfiles = filteredProfiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Employee Payroll Profiles</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Configure basic salary rates, position allowances, bank accounts, and tax identifications for school staff.</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider">
          {errorMsg}
        </div>
      )}

      {/* Filters Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search employee name, ID or email..."
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            className="w-full md:w-48 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Profiles Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 dark:border-slate-700 dark:border-t-white rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Fetching staff salary configurations...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Landmark size={48} />
            <p className="font-bold uppercase text-[11px] tracking-widest">No active staff payroll accounts matching criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee Details</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Basic Salary</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Allowances (Sum)</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">OT Rate (Hr)</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">TIN Number</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bank Account</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                  {paginatedProfiles.map((p) => {
                    const allowancesSum = p.transport_allowance + p.housing_allowance + p.position_allowance;
                    const hasProfile = p.profile_id !== null;
                    return (
                      <tr key={p.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-300">
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">{p.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">{p.role}</span>
                                <span className="text-[9px] font-bold text-slate-400">{p.digital_id}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {hasProfile ? (
                            <span className="font-black text-slate-800 dark:text-white">{p.basic_salary.toLocaleString()} ETB</span>
                          ) : (
                            <span className="text-rose-500 font-bold uppercase text-[9px] tracking-wider bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-xl flex items-center gap-1.5 w-fit">
                              <AlertCircle size={10} /> Not Configured
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {hasProfile ? (
                            <div>
                              <span className="font-bold text-slate-700 dark:text-slate-300">+{allowancesSum.toLocaleString()} ETB</span>
                              <div className="flex gap-1.5 text-[8px] text-slate-400 font-semibold mt-1">
                                <span>T: {p.transport_allowance}</span>
                                <span>H: {p.housing_allowance}</span>
                                <span>P: {p.position_allowance}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">&mdash;</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {hasProfile ? (
                            <span className="font-bold text-slate-700 dark:text-slate-300">{p.overtime_rate_per_hour} ETB/hr</span>
                          ) : (
                            <span className="text-slate-400">&mdash;</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">{p.tin_number || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          {p.bank_account ? (
                            <div className="flex items-center gap-1.5">
                              <Landmark size={12} className="text-slate-400" />
                              <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">{p.bank_account}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 p-2 rounded-xl transition-all shadow-md"
                          >
                            <Edit3 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <span className="text-xs text-slate-500 font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredProfiles.length)} of {filteredProfiles.length} entries
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>


      {/* Editing Sliding/Modal Panel */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full p-8 overflow-y-auto shadow-2xl flex flex-col justify-between transition-all duration-300 animate-slide-in">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                    <Award size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-white text-base uppercase tracking-tight">Configure Salary Details</h3>
                    <p className="text-xs text-slate-400 font-semibold">{editingProfile.name} &bull; {editingProfile.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingProfile(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Core Compensation Card */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Core Salary Parameters</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Basic Monthly Salary (ETB) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 text-slate-400" size={16} />
                      <input
                        type="number"
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(e.target.value)}
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Overtime Rate Per Hour (ETB)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      value={overtimeRatePerHour}
                      onChange={(e) => setOvertimeRatePerHour(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>

                {/* Fixed Allowances Card */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Fixed Allowances</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Transport</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                        value={transportAllowance}
                        onChange={(e) => setTransportAllowance(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Housing</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                        value={housingAllowance}
                        onChange={(e) => setHousingAllowance(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Position</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                        value={positionAllowance}
                        onChange={(e) => setPositionAllowance(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Direct Bank Deposit Details */}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800/80 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Payment & Tax Details</h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Account Number</label>
                    <div className="relative">
                      <Landmark className="absolute left-3 top-3 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="e.g. CBE 1000..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">TIN Number (Tax ID)</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Tax Identification Number"
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
                        value={tinNumber}
                        onChange={(e) => setTinNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(null)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50"
                  >
                    {modalLoading ? 'Saving...' : (
                      <>
                        <Save size={14} />
                        Save Profile
                      </>
                    )}
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
export default EmployeeProfiles;
