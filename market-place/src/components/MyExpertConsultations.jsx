import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const MyExpertConsultations = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/user/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setConsultations(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching consultations:', err);
          setLoading(false);
        });
  }, [user, navigate]);

  if (loading) return <div className="pt-24 min-h-screen flex justify-center items-center">Loading...</div>;

  return (
    <main className="pt-24 pb-16 min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          {i18n.language === 'ar' ? 'استشاراتي الزراعية' : 'Mes consultations agricoles'}
        </h1>

        {consultations.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-2xl">
            <span className="material-symbols-outlined text-6xl text-stone-300 mb-4">forum</span>
            <p className="text-xl text-on-surface-variant mb-6">
              {i18n.language === 'ar' ? 'ليس لديك أي استشارات حالياً.' : 'Vous n\'avez aucune consultation pour le moment.'}
            </p>
            <Link to="/experts" className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors">
              {i18n.language === 'ar' ? 'تصفح الخبراء' : 'Parcourir les experts'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map(c => (
              <ConsultationCard key={c.id} c={c} user={user} i18n={i18n} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

const ConsultationCard = ({ c, user, i18n }) => {
    const [review, setReview] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (c.status === 'closed') {
            fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/${c.id}/review`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.id) setReview(data);
                });
        }
    }, [c.id, c.status]);

    const submitReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    consultationId: c.id,
                    expertId: c.expert_id,
                    clientId: user.id,
                    rating,
                    comment
                })
            });
            if (res.ok) {
                setReview({ rating, comment });
                setShowReviewForm(false);
                alert('Merci pour votre avis !');
            }
        } catch (err) {
            console.error(err);
        }
        setSubmitting(false);
    };

    return (
        <div className="bg-surface-container-low border border-stone-200 dark:border-stone-800 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {c.expert_image ? (
                        <img src={c.expert_image} alt={c.expert_name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="material-symbols-outlined text-3xl text-stone-400">person</span>
                    )}
                    </div>
                    <div>
                    <h3 className="font-bold text-lg">{i18n.language === 'ar' ? c.expert_name_ar : c.expert_name_fr}</h3>
                    <p className="text-sm text-primary font-medium">{i18n.language === 'ar' ? c.category_name_ar : c.category_name_fr}</p>
                    <p className="text-sm text-on-surface-variant mt-1 line-clamp-1">
                        {c.last_message || (i18n.language === 'ar' ? 'لا توجد رسائل بعد' : 'Pas encore de messages')}
                    </p>
                    </div>
                </div>
                
                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-400">{new Date(c.updated_at).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded-full font-bold ${c.status === 'closed' ? 'bg-stone-200 text-stone-600 dark:bg-stone-800' : 'bg-green-100 text-green-700'}`}>
                        {c.status === 'closed' 
                        ? (i18n.language === 'ar' ? 'مغلقة' : 'Fermée') 
                        : (i18n.language === 'ar' ? 'نشطة' : 'Active')}
                    </span>
                    </div>
                    <Link 
                    to={`/expert-chat/${c.id}`}
                    className="w-full md:w-auto px-6 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold rounded-xl transition-colors text-center"
                    >
                    {i18n.language === 'ar' ? 'عرض المحادثة' : 'Voir la conversation'}
                    </Link>
                </div>
            </div>

            {/* Review Section */}
            {c.status === 'closed' && (
                <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                    {review ? (
                        <div className="bg-stone-50 rounded-xl p-4">
                            <div className="flex items-center gap-1 mb-2">
                                {[1,2,3,4,5].map(star => (
                                    <span key={star} className={`material-symbols-outlined text-lg ${star <= review.rating ? 'text-yellow-500 filled' : 'text-stone-300'}`}>star</span>
                                ))}
                                <span className="ml-2 text-sm font-bold text-stone-600">Votre avis</span>
                            </div>
                            {review.comment && <p className="text-sm text-stone-600 italic">"{review.comment}"</p>}
                        </div>
                    ) : showReviewForm ? (
                        <form onSubmit={submitReview} className="bg-stone-50 rounded-xl p-4 space-y-4">
                            <h4 className="font-bold">Noter cette consultation</h4>
                            <div className="flex items-center gap-2">
                                {[1,2,3,4,5].map(star => (
                                    <button 
                                        key={star} type="button" 
                                        onClick={() => setRating(star)}
                                        className={`material-symbols-outlined text-3xl transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-500 filled' : 'text-stone-300'}`}
                                    >
                                        star
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                value={comment} onChange={(e) => setComment(e.target.value)}
                                placeholder="Laissez un commentaire pour cet expert (optionnel)"
                                className="w-full p-3 rounded-lg border border-stone-200 text-sm outline-none focus:border-primary"
                                rows="3"
                            ></textarea>
                            <div className="flex gap-2">
                                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm">
                                    {submitting ? 'Envoi...' : 'Envoyer mon avis'}
                                </button>
                                <button type="button" onClick={() => setShowReviewForm(false)} className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg font-bold text-sm">
                                    Annuler
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setShowReviewForm(true)} className="flex items-center gap-2 text-primary font-bold text-sm hover:underline">
                            <span className="material-symbols-outlined text-[18px]">rate_review</span>
                            Évaluer cette consultation
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyExpertConsultations;
