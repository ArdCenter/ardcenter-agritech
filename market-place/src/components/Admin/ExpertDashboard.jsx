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
  const [stats, setStats] = useState({ points: 0, rating: 0, reviews_count: 0 });
  const [pointsHistory, setPointsHistory] = useState([]);

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

          // Re-fetch current points/rating from admin list
          fetch(`${import.meta.env.VITE_API_URL}/api/admin/experts`)
              .then(res => res.json())
              .then(data => {
                  const currentExpert = data.find(e => e.id == user.expert_id || e.user_id == user.id);
                  if (currentExpert) {
                      setStats({
                          points: currentExpert.points || 0,
                          rating: currentExpert.rating || 0,
                          reviews_count: currentExpert.reviews_count || 0
                      });
                      
                      // Fetch points history using the found expert ID
                      fetch(`${import.meta.env.VITE_API_URL}/api/experts/${currentExpert.id}/points-history`)
                          .then(res => res.json())
                          .then(history => setPointsHistory(history))
                          .catch(err => console.error(err));
                  } else {
                      setStats({ points: 0, rating: 0, reviews_count: 0 });
                  }
              })
              .catch(err => console.error(err));
    }
  }, [user]);

  if (loading) return <div className="p-8">{i18n.language === 'ar' ? 'جار التحميل...' : 'Chargement...'}</div>;

  const pending = consultations.filter(c => c.status === 'pending').length;
  const inProgress = consultations.filter(c => c.status === 'in_progress').length;
  const closed = consultations.filter(c => c.status === 'closed').length;

  // Calculate Level
  const getLevel = (pts) => {
      if (pts >= 700) return { name: 'Master', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'workspace_premium', max: 1000 };
      if (pts >= 300) return { name: 'Elite', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'military_tech', max: 700 };
      if (pts >= 100) return { name: 'Pro', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: 'verified', max: 300 };
      return { name: 'Novice', color: 'bg-stone-100 text-stone-700 border-stone-200', icon: 'star', max: 100 };
  };

  const level = getLevel(stats.points);
  const progressPercent = Math.min(100, Math.max(0, (stats.points / level.max) * 100));

  return (
    <main className="pt-24 pb-16 min-h-screen bg-surface">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">{i18n.language === 'ar' ? 'لوحة الخبير' : 'Tableau de bord expert'}</h1>
        </div>

        {/* Gamification & Points Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between ${level.color} bg-opacity-50`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-sm font-bold uppercase tracking-wider opacity-80">Niveau Actuel</span>
                        <h2 className="text-3xl font-black mt-1 flex items-center gap-2">
                            <span className="material-symbols-outlined filled">{level.icon}</span>
                            {level.name}
                        </h2>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-bold opacity-80">Points</span>
                        <h2 className="text-3xl font-black">{stats.points}</h2>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs font-bold mb-1 opacity-80">
                        <span>Progression</span>
                        <span>{stats.points} / {level.max} pts</span>
                    </div>
                    <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                        <div className="h-full bg-current rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-3xl border border-stone-200 bg-white shadow-sm flex flex-col justify-center items-center text-center">
                <span className="text-stone-500 font-bold uppercase tracking-wider text-sm mb-2">Note des clients</span>
                <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-4xl text-yellow-500 filled">star</span>
                    <span className="text-4xl font-black text-stone-900">{stats.rating.toFixed(1)}<span className="text-xl text-stone-400">/5</span></span>
                </div>
                <span className="text-stone-500 font-medium text-sm">{stats.reviews_count} avis clients</span>
            </div>

            <div className="p-6 rounded-3xl border border-stone-200 bg-white shadow-sm flex flex-col justify-center">
                <span className="text-stone-500 font-bold uppercase tracking-wider text-sm mb-4">Réduction Abonnement</span>
                <div className="flex items-end gap-3 mb-2">
                    <span className="text-4xl font-black text-green-600">-{stats.points} DH</span>
                </div>
                <p className="text-sm text-stone-500">1 point = 1 DH de réduction sur votre prochain renouvellement (limité à 30% du prix de l'abonnement).</p>
            </div>
        </div>

        {/* Existing stats... */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        {/* Points History */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <h2 className="text-xl font-bold">Historique des points</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 text-stone-500 text-sm text-left">
                <tr>
                  <th className="py-4 px-6 font-medium">Date</th>
                  <th className="py-4 px-6 font-medium">Raison</th>
                  <th className="py-4 px-6 font-medium text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {pointsHistory.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-stone-500">Aucun historique disponible</td>
                  </tr>
                ) : (
                  pointsHistory.map(ph => (
                    <tr key={ph.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-6 text-stone-500">{new Date(ph.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-6 font-medium text-stone-900">{ph.reason}</td>
                      <td className="py-4 px-6 text-right font-black text-green-600">+{ph.points}</td>
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
