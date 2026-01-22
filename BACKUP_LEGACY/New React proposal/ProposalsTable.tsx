
import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, Search, TrendingUp, Filter, Edit, Trash2, Eye, Send, Percent, DollarSign,
  Folder, FolderOpen, FolderSearch, Archive, CheckCircle, XCircle, Clock, AlertCircle, MoreHorizontal, ArrowUpRight
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ProposalData } from '../../types';

const STATUS_COLORS = {
  'Draft': '#94a3b8',
  'In Review': '#f59e0b',
  'Sent': '#3b82f6',
  'Approved': '#10b981',
  'Rejected': '#ef4444',
  'Archived': '#64748b'
};

const CHART_COLORS = ['#94a3b8', '#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

export const ProposalsTable: React.FC<{ 
    proposals: ProposalData[], 
    onAdd: () => void, 
    onEdit: (p: ProposalData) => void,
    onDelete: (id: number) => void,
    onArchive: (id: number) => void
}> = ({ proposals, onAdd, onEdit, onDelete, onArchive }) => {
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const archiveTree = useMemo(() => {
        const tree: Record<string, Record<string, string[]>> = {};
        proposals.forEach(p => {
            const date = new Date(p.date);
            if (isNaN(date.getTime())) return;
            
            const year = date.getFullYear().toString();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');

            if (!tree[year]) tree[year] = {};
            if (!tree[year][month]) tree[year][month] = [];
            if (!tree[year][month].includes(day)) tree[year][month].push(day);
        });
        
        const sortedTree: Record<string, Record<string, string[]>> = {};
        Object.keys(tree).sort().reverse().forEach(year => {
            sortedTree[year] = {};
            Object.keys(tree[year]).sort().reverse().forEach(month => {
                sortedTree[year][month] = tree[year][month].sort().reverse();
            });
        });
        
        return sortedTree;
    }, [proposals]);

    const filtered = useMemo(() => proposals.filter(p => {
        const matchesSearch = 
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.refNumber.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter !== 'All') {
            if (statusFilter === 'Pending' && p.status !== 'In Review') return false;
            if (statusFilter === 'Canceled' && p.status !== 'Rejected') return false;
            if (statusFilter === 'Sent' && p.status !== 'Sent') return false;
            if (statusFilter === 'Draft' && p.status !== 'Draft') return false;
            if (statusFilter === 'Approved' && p.status !== 'Approved') return false;
        }

        const date = new Date(p.date);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        if (selectedYear && year !== selectedYear) return false;
        if (selectedMonth && month !== selectedMonth) return false;
        if (selectedDay && day !== selectedDay) return false;

        return true;
    }), [proposals, searchTerm, selectedYear, selectedMonth, selectedDay, statusFilter]);

    const stats = useMemo(() => {
        const total = proposals.length;
        const pipelineValue = proposals.reduce((sum, p) => {
            if(p.status === 'Sent' || p.status === 'Draft' || p.status === 'In Review') {
                const sub = p.items.reduce((s, i) => s + (i.quantity * i.rate), 0);
                return sum + sub;
            }
            return sum;
        }, 0);
        
        const approvedCount = proposals.filter(p => p.status === 'Approved').length;
        const rejectedCount = proposals.filter(p => p.status === 'Rejected').length;
        const closedCount = approvedCount + rejectedCount;
        const winRate = closedCount > 0 ? (approvedCount / closedCount) * 100 : 0;
        
        const statusDist = [
            { name: 'Draft', value: proposals.filter(p => p.status === 'Draft').length },
            { name: 'Pending', value: proposals.filter(p => p.status === 'In Review').length },
            { name: 'Sent', value: proposals.filter(p => p.status === 'Sent').length },
            { name: 'Approved', value: approvedCount },
            { name: 'Canceled', value: rejectedCount },
        ].filter(d => d.value > 0);

        return { 
            total, 
            pipelineValue, 
            winRate, 
            statusDist,
            counts: {
                draft: proposals.filter(p => p.status === 'Draft').length,
                sent: proposals.filter(p => p.status === 'Sent').length,
                pending: proposals.filter(p => p.status === 'In Review').length,
                canceled: rejectedCount
            }
        };
    }, [proposals]);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 text-xs">
                    <p className="font-bold text-gray-900">{payload[0].name}</p>
                    <p className="text-gray-500">{payload[0].value} Proposals</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Proposals Dashboard</h2>
                    <p className="text-gray-500 mt-1 font-medium text-sm">Manage, track, and analyze your sales proposals.</p>
                </div>
                <button onClick={onAdd} className="bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-black transition-all shadow-xl shadow-gray-200 hover:-translate-y-1 active:scale-95">
                    <Plus size={18} /> New Proposal
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="flex-1 w-full space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-violet-200 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <DollarSign size={80} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-violet-100 font-bold text-xs uppercase tracking-wider mb-2">Total Pipeline Value</p>
                                <h3 className="text-4xl font-extrabold mb-4">{stats.pipelineValue.toLocaleString()} <span className="text-xl opacity-70 font-medium">SAR</span></h3>
                                <div className="flex items-center gap-2 text-xs bg-white/20 w-fit px-3 py-1.5 rounded-xl backdrop-blur-md font-medium border border-white/10">
                                    <TrendingUp size={14} />
                                    <span>Active Opportunities</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                             <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Percent size={64} /></div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Win Rate</p>
                            <h3 className="text-4xl font-extrabold text-gray-900">{stats.winRate.toFixed(1)}%</h3>
                            <div className="mt-6 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.winRate}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 font-medium">Based on approved vs rejected</p>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                             <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Clock size={64} /></div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Action Needed</p>
                            <h3 className="text-4xl font-extrabold text-amber-500">{stats.counts.pending}</h3>
                            <p className="text-gray-900 font-bold mt-1">Pending Proposals</p>
                            <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 w-fit px-3 py-1.5 rounded-xl font-bold">
                                <AlertCircle size={14} />
                                <span>In Review</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden min-w-0">
                        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                            <div className="flex bg-gray-100/80 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                                {['All', 'Sent', 'Pending', 'Draft', 'Approved', 'Canceled'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                            statusFilter === status 
                                            ? 'bg-white text-gray-900 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3 items-center w-full md:w-auto">
                                <div className="relative flex-1 md:flex-initial">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Search title, client, ref..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-full md:w-64 bg-gray-50/50 focus:bg-white transition-all font-medium" 
                                    />
                                </div>
                                <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl border border-gray-200 bg-white transition-colors">
                                    <Filter size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Proposal Details</th>
                                        <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Value</th>
                                        <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-8 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filtered.map((p) => {
                                        const subtotal = p.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
                                        const discount = p.discountType === 'percent' ? subtotal * (p.discount / 100) : p.discount;
                                        const total = (subtotal - discount) * (1 + p.taxRate / 100);
                                        
                                        let statusColor = 'bg-gray-100 text-gray-600 border-gray-200';
                                        let displayStatus: string = p.status;
                                        if (p.status === 'Sent') statusColor = 'bg-blue-50 text-blue-600 border-blue-100';
                                        if (p.status === 'Approved') statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                                        if (p.status === 'In Review') { statusColor = 'bg-amber-50 text-amber-600 border-amber-100'; displayStatus = 'Pending'; }
                                        if (p.status === 'Rejected') { statusColor = 'bg-red-50 text-red-600 border-red-100'; displayStatus = 'Canceled'; }
                                        if (p.status === 'Archived') statusColor = 'bg-slate-100 text-slate-600 border-slate-200';

                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50/80 transition-colors group cursor-default">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-violet-600 shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-900 text-sm truncate">{p.title}</p>
                                                            <p className="text-xs text-gray-500 truncate font-medium">{p.clientCompany} • <span className="font-mono text-gray-400">{p.refNumber}</span></p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="font-extrabold text-gray-900 text-sm whitespace-nowrap block">{total.toLocaleString()} {p.currency}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border whitespace-nowrap ${statusColor}`}>
                                                        {displayStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-xs text-gray-500 font-medium whitespace-nowrap">
                                                    {p.date}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => onEdit(p)} className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all" title="Edit">
                                                            <Edit size={16} />
                                                        </button>
                                                        <button onClick={() => onArchive && onArchive(p.id)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Archive">
                                                            <Archive size={16} />
                                                        </button>
                                                        <button onClick={() => onDelete(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <div className="p-20 text-center flex flex-col items-center">
                                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                                        <FolderSearch size={32} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-gray-900 font-bold mb-1">No proposals found</h3>
                                    <p className="text-gray-500 text-sm">Try adjusting your filters or search terms.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-80 space-y-8 flex-shrink-0">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-gray-900">Pipeline Distribution</h3>
                            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={16} /></button>
                        </div>
                        <div className="h-56 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={stats.statusDist} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60} 
                                        outerRadius={80} 
                                        paddingAngle={5} 
                                        dataKey="value"
                                        cornerRadius={6}
                                    >
                                        {stats.statusDist.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                <span className="block text-3xl font-extrabold text-gray-900">{stats.total}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</span>
                            </div>
                        </div>
                        <div className="space-y-3 mt-4">
                            {stats.statusDist.map((s, idx) => (
                                <div key={s.name} className="flex justify-between items-center text-xs font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></div>
                                        <span className="text-gray-600">{s.name === 'In Review' ? 'Pending' : s.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                                <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg"><FolderOpen size={16} /></div>
                                <h3>Archive</h3>
                            </div>
                            <button 
                                onClick={() => { setSelectedYear(null); setSelectedMonth(null); setSelectedDay(null); }}
                                className="text-[10px] font-bold text-violet-600 hover:bg-violet-50 px-2 py-1 rounded transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                        <div className="space-y-1">
                            {Object.keys(archiveTree).length > 0 ? (
                                Object.keys(archiveTree).map(year => (
                                    <div key={year} className="space-y-1">
                                        <button 
                                            onClick={() => { 
                                                setSelectedYear(selectedYear === year ? null : year); 
                                                setSelectedMonth(null); 
                                                setSelectedDay(null); 
                                            }}
                                            className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors ${selectedYear === year ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {selectedYear === year ? <FolderOpen size={16} /> : <Folder size={16} />}
                                            {year}
                                        </button>
                                        {selectedYear === year && (
                                            <div className="ml-4 pl-3 border-l-2 border-gray-100 space-y-1 mt-1">
                                                {Object.keys(archiveTree[year]).map(month => (
                                                    <div key={month}>
                                                        <button 
                                                            onClick={() => { 
                                                                setSelectedMonth(selectedMonth === month ? null : month);
                                                                setSelectedDay(null);
                                                            }}
                                                            className={`flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedMonth === month ? 'text-violet-700 bg-violet-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                                                        >
                                                            {monthNames[parseInt(month) - 1]}
                                                        </button>
                                                        {selectedMonth === month && (
                                                            <div className="ml-3 pl-3 border-l-2 border-gray-100 space-y-1 mt-1 mb-1">
                                                                {archiveTree[year][month].map(day => (
                                                                    <button 
                                                                        key={day}
                                                                        onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                                                                        className={`block w-full text-left px-3 py-1 text-[10px] font-bold rounded-lg transition-colors ${selectedDay === day ? 'text-white bg-violet-500 shadow-sm' : 'text-gray-400 hover:text-violet-600'}`}
                                                                    >
                                                                        {day}th
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-gray-400 text-center py-8">No archives found</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
