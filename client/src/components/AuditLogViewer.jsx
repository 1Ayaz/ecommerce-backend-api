import { useState, useEffect } from 'react';
import { Clock, User, FileText, Search, Activity } from 'lucide-react';
import API from '../config/api';

export default function AuditLogViewer() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await API.get(`/audit-logs?pageNumber=${page}`);
            setLogs(res.data.data);
            setTotalPages(res.data.pages);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center text-white">
                    <Activity size={20} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-brand-dark">Audit Logs</h2>
                    <p className="text-sm text-brand-muted">Track system activities and security events</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Time</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">User</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Action</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Resource</th>
                                <th className="p-4 text-xs font-black text-brand-muted uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-brand-muted">Loading logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-brand-muted">No logs recorded.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-brand-muted">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-brand-muted" />
                                                <span className="font-bold text-sm text-brand-dark">{log.user?.name || 'Unknown'}</span>
                                            </div>
                                            <p className="text-[10px] text-brand-muted ml-6">{log.user?.email}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                                        log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm font-bold text-brand-dark">
                                                <FileText size={14} className="text-brand-muted" />
                                                {log.resource}
                                            </div>
                                            <p className="text-[10px] font-mono text-brand-muted ml-6">{log.resourceId}</p>
                                        </td>
                                        <td className="p-4 text-xs text-brand-muted max-w-xs truncate">
                                            {JSON.stringify(log.details)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 text-sm font-bold text-brand-dark disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-bold text-brand-muted">Page {page} of {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 text-sm font-bold text-brand-dark disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
