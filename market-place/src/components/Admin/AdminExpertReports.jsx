import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdminExpertReports = () => {
    const { i18n } = useTranslation();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isAr = i18n.language === 'ar';

    const fetchReports = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expert-reports`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setReports(data);
            } else {
                setReports([]);
                if (data.error) setError(data.error);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expert-reports/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchReports();
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: { fr: 'En attente', ar: 'في الانتظار', class: 'bg-yellow-100 text-yellow-600' },
            reviewed: { fr: 'Examiné', ar: 'تمت المراجعة', class: 'bg-blue-100 text-blue-600' },
            resolved: { fr: 'Résolu', ar: 'تم الحل', class: 'bg-green-100 text-green-600' },
            rejected: { fr: 'Rejeté', ar: 'مرفوض', class: 'bg-red-100 text-red-600' }
        };
        return labels[status] || { fr: status, ar: status, class: 'bg-stone-100 text-stone-600' };
    };

    if (loading) return (
        <div className="p-8 flex items-center gap-3 text-stone-500">
            <span className="material-symbols-outlined animate-spin">sync</span>
            {isAr ? 'جار التحميل...' : 'Chargement...'}
        </div>
    );

    if (error) return (
        <div className="p-8 text-red-600 bg-red-50 rounded-2xl border border-red-100 m-6">
            <h2 className="font-bold mb-2">{isAr ? 'خطأ في تحميل البيانات' : 'Erreur de chargement'}</h2>
            <p className="text-sm">{error}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black text-stone-900 dark:text-white">
                {isAr ? 'بلاغات الخبراء' : 'Signalements des experts'}
            </h1>
            
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
                            <tr className={isAr ? 'text-right' : 'text-left'}>
                                <th className="p-4 font-bold text-sm text-stone-500">{isAr ? 'التاريخ' : 'Date'}</th>
                                <th className="p-4 font-bold text-sm text-stone-500">{isAr ? 'العميل' : 'Client'}</th>
                                <th className="p-4 font-bold text-sm text-stone-500">{isAr ? 'الخبير' : 'Expert'}</th>
                                <th className="p-4 font-bold text-sm text-stone-500">{isAr ? 'السبب' : 'Raison'}</th>
                                <th className="p-4 font-bold text-sm text-stone-500">{isAr ? 'الوصف' : 'Description'}</th>
                                <th className="p-4 font-bold text-sm text-stone-500">{isAr ? 'الحالة' : 'Statut'}</th>
                                <th className={`p-4 font-bold text-sm text-stone-500 ${isAr ? 'text-left' : 'text-right'}`}>{isAr ? 'إجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                            {reports.map((report) => {
                                const statusInfo = getStatusLabel(report.status);
                                return (
                                    <tr key={report.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                                        <td className="p-4 text-sm whitespace-nowrap">{new Date(report.created_at).toLocaleDateString(isAr ? 'ar-MA' : 'fr-FR')}</td>
                                        <td className="p-4 text-sm font-bold">{report.client_name}</td>
                                        <td className="p-4 text-sm font-bold text-primary">{report.expert_name}</td>
                                        <td className="p-4 text-sm">
                                            <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100">
                                                {report.reason}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm max-w-xs truncate" title={report.description}>{report.description || '-'}</td>
                                        <td className="p-4 text-sm">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusInfo.class}`}>
                                                {isAr ? statusInfo.ar : statusInfo.fr}
                                            </span>
                                        </td>
                                        <td className={`p-4 space-x-2 whitespace-nowrap ${isAr ? 'text-left space-x-reverse' : 'text-right'}`}>
                                            {report.status === 'pending' && (
                                                <button 
                                                    onClick={() => updateStatus(report.id, 'reviewed')}
                                                    className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border border-blue-100"
                                                >
                                                    {isAr ? 'تعليم كمراجع' : 'Marquer comme examiné'}
                                                </button>
                                            )}
                                            {(report.status === 'pending' || report.status === 'reviewed') && (
                                                <>
                                                    <button 
                                                        onClick={() => updateStatus(report.id, 'resolved')}
                                                        className="px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors border border-green-100"
                                                    >
                                                        {isAr ? 'حل البلاغ' : 'Résoudre'}
                                                    </button>
                                                    <button 
                                                        onClick={() => updateStatus(report.id, 'rejected')}
                                                        className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors border border-red-100"
                                                    >
                                                        {isAr ? 'رفض' : 'Rejeter'}
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {reports.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-stone-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl opacity-20">flag</span>
                                            <p className="font-bold">
                                                {isAr ? 'لا توجد بلاغات حالياً.' : 'Aucun signalement pour le moment.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminExpertReports;
