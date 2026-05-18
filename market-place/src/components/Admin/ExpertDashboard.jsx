import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const ExpertDashboard = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'expert' && user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      // Assuming user.id corresponds to expert_id in experts table for MVP, 
      // otherwise would need an endpoint to get expert_id by user_id
      fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/expert/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setConsultations(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching consultations:', err);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) return <div className="p-8">{i18n.language === 'ar' ? 'جار التحميل...' : 'Chargement...'}</div>;

  const pending = consultations.filter(c => c.status === 'pending').length;
  const inProgress = consultations.filter(c => c.status === 'in_progress').length;
  const closed = consultations.filter(c => c.status === 'closed').length;

  return (
    <main className="pt-24 pb-16 min-h-screen bg-surface">
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{i18n.language === 'ar' ? 'لوحة الخبير' : 'Tableau de bord expert'}</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center">
            <span className="text-stone-500 font-medium mb-1">{i18n.language === 'ar' ? 'إجمالي الاستشارات' : 'Total consultations'}</span>
            <span className="text-4xl font-black text-stone-900">{consultations.length}</span>
          </div>
          <div className="bg-yellow-50 p-6 rounded-2xl shadow-sm border border-yellow-100 flex flex-col justify-center">
            <span className="text-yellow-700 font-medium mb-1">{i18n.language === 'ar' ? 'في الانتظار' : 'En attente'}</span>
            <span className="text-4xl font-black text-yellow-900">{pending}</span>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-center">
            <span className="text-blue-700 font-medium mb-1">{i18n.language === 'ar' ? 'قيد المعالجة' : 'En cours'}</span>
            <span className="text-4xl font-black text-blue-900">{inProgress}</span>
          </div>
          <div className="bg-stone-50 p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col justify-center">
            <span className="text-stone-500 font-medium mb-1">{i18n.language === 'ar' ? 'منتهية' : 'Terminées'}</span>
            <span className="text-4xl font-black text-stone-900">{closed}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h2 className="text-xl font-bold">{i18n.language === 'ar' ? 'محادثاتي' : 'Mes conversations'}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 text-stone-500 text-sm text-left">
                <tr>
                  <th className="py-4 px-6 font-medium">{i18n.language === 'ar' ? 'العميل' : 'Client'}</th>
                  <th className="py-4 px-6 font-medium">{i18n.language === 'ar' ? 'الفئة' : 'Catégorie'}</th>
                  <th className="py-4 px-6 font-medium">{i18n.language === 'ar' ? 'الحالة' : 'Statut'}</th>
                  <th className="py-4 px-6 font-medium">{i18n.language === 'ar' ? 'آخر رسالة' : 'Dernière maj.'}</th>
                  <th className="py-4 px-6 font-medium text-right">{i18n.language === 'ar' ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {consultations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-stone-500">{i18n.language === 'ar' ? 'لا توجد محادثات حالياً' : 'Aucune conversation pour le moment'}</td>
                  </tr>
                ) : (
                  consultations.map(c => (
                    <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-6 font-medium text-stone-900">{c.client_name}</td>
                      <td className="py-4 px-6 text-stone-600">{i18n.language === 'ar' ? c.category_name_ar : c.category_name_fr}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          c.status === 'closed' ? 'bg-stone-100 text-stone-600' : 
                          c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {c.status === 'in_progress' ? (i18n.language === 'ar' ? 'قيد المعالجة' : 'En cours') : 
                           c.status === 'pending' ? (i18n.language === 'ar' ? 'في الانتظار' : 'En attente') : 
                           (i18n.language === 'ar' ? 'منتهية' : 'Terminée')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-stone-500">{new Date(c.updated_at).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-right">
                        <Link 
                          to={`/expert-chat/${c.id}`} 
                          className="inline-flex items-center gap-1 text-primary hover:text-primary-700 font-bold"
                        >
                          {i18n.language === 'ar' ? 'فتح الدردشة' : 'Ouvrir le chat'}
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ExpertDashboard;
