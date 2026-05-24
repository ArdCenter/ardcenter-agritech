import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdminExpertApplications = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);

    const fetchApplications = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expert-applications`);
            const data = await res.json();
            setApplications(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching expert applications:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expert-applications/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchApplications();
                setSelectedApp(null);
            } else {
                alert('Erreur lors de la mise à jour du statut');
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending_validation':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">{isAr ? 'قيد المراجعة' : 'En attente de validation'}</span>;
            case 'approved_waiting_payment':
                return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{isAr ? 'في انتظار الدفع' : 'En attente de paiement'}</span>;
            case 'rejected':
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">{isAr ? 'مرفوض' : 'Rejeté'}</span>;
            case 'suspended':
                return <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-bold">{isAr ? 'موقوف' : 'Suspendu'}</span>;
            default:
                return <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-stone-900 dark:text-white">
                    {isAr ? 'طلبات تسجيل الخبراء' : 'Demandes d\'inscription Experts'}
                </h1>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
                            <tr className={isAr ? 'text-right' : 'text-left'}>
                                <th className="p-4 font-bold text-sm text-stone-500">Date</th>
                                <th className="p-4 font-bold text-sm text-stone-500">Expert</th>
                                <th className="p-4 font-bold text-sm text-stone-500">Spécialité</th>
                                <th className="p-4 font-bold text-sm text-stone-500">Statut</th>
                                <th className={`p-4 font-bold text-sm text-stone-500 ${isAr ? 'text-left' : 'text-right'}`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                            {applications.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-stone-500 font-medium">
                                        {isAr ? 'لا توجد طلبات جديدة' : 'Aucune nouvelle demande'}
                                    </td>
                                </tr>
                            ) : applications.map(app => (
                                <tr key={app.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                    <td className="p-4 text-sm">
                                        {new Date(app.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-sm">{app.full_name}</div>
                                        <div className="text-xs text-stone-500">{app.user_email} • {app.phone}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm font-medium">{isAr ? app.category_name_ar : app.category_name_fr}</div>
                                        <div className="text-xs text-stone-500">{app.specialty}</div>
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(app.approval_status)}
                                    </td>
                                    <td className={`p-4 ${isAr ? 'text-left' : 'text-right'}`}>
                                        <button 
                                            onClick={() => setSelectedApp(app)}
                                            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
                                        >
                                            {isAr ? 'مراجعة التفاصيل' : 'Examiner'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-stone-900 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center">
                            <h3 className="font-bold text-xl">
                                {isAr ? 'تفاصيل طلب الخبير' : 'Détails de la demande'}
                            </h3>
                            <button onClick={() => setSelectedApp(null)} className="text-stone-400 hover:text-stone-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Informations Personnelles</h4>
                                    <p><strong>Nom:</strong> {selectedApp.full_name}</p>
                                    <p><strong>Email:</strong> {selectedApp.user_email}</p>
                                    <p><strong>Téléphone:</strong> {selectedApp.phone}</p>
                                    <p><strong>Ville:</strong> {selectedApp.city}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Profil Professionnel</h4>
                                    <p><strong>Catégorie:</strong> {isAr ? selectedApp.category_name_ar : selectedApp.category_name_fr}</p>
                                    <p><strong>Spécialité:</strong> {selectedApp.specialty}</p>
                                    <p><strong>Expérience:</strong> {selectedApp.experience_years} ans</p>
                                    <p><strong>Langues:</strong> {selectedApp.languages}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Bio</h4>
                                <p className="bg-stone-50 dark:bg-stone-800 p-4 rounded-xl text-sm">{selectedApp.bio}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Diplômes & Documents</h4>
                                    <p className="mb-2"><strong>Diplômes:</strong> {selectedApp.degrees}</p>
                                    {selectedApp.documents ? (
                                        <a href={selectedApp.documents} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-sm">
                                            <span className="material-symbols-outlined text-sm">link</span>
                                            Voir les documents justificatifs
                                        </a>
                                    ) : (
                                        <p className="text-stone-500 italic text-sm">Aucun lien fourni</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-900/50">
                            <div>
                                <span className="text-sm font-bold text-stone-500 mr-4">Statut Actuel:</span>
                                {getStatusBadge(selectedApp.approval_status)}
                            </div>
                            <div className="flex gap-3">
                                {selectedApp.approval_status === 'pending_validation' && (
                                    <>
                                        <button onClick={() => updateStatus(selectedApp.id, 'rejected')} className="px-6 py-2 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors">
                                            Rejeter
                                        </button>
                                        <button onClick={() => updateStatus(selectedApp.id, 'approved_waiting_payment')} className="px-6 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors">
                                            Approuver (Attente Paiement)
                                        </button>
                                    </>
                                )}
                                {(selectedApp.approval_status === 'approved_waiting_payment' || selectedApp.approval_status === 'active') && (
                                    <button onClick={() => updateStatus(selectedApp.id, 'suspended')} className="px-6 py-2 bg-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-300 transition-colors">
                                        Suspendre
                                    </button>
                                )}
                                {selectedApp.approval_status === 'suspended' && (
                                    <button onClick={() => updateStatus(selectedApp.id, 'active')} className="px-6 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors">
                                        Réactiver
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExpertApplications;
