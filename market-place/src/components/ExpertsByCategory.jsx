import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const ExpertsByCategory = () => {
  const { categoryId } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/experts/category/${categoryId}`)
      .then(res => res.json())
      .then(data => {
        setExperts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching experts:', err);
        setLoading(false);
      });
  }, [categoryId]);

  const handleContactExpert = async (expertId) => {
    if (!user) {
      navigate('/login', { state: { returnUrl: `/experts/category/${categoryId}` } });
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.id,
          expertId: expertId,
          categoryId: parseInt(categoryId)
        })
      });
      const data = await res.json();
      
      if (data.success && data.consultationId) {
        navigate(`/expert-chat/${data.consultationId}`);
      }
    } catch (err) {
      console.error('Error starting consultation:', err);
    }
  };

  return (
    <main className="pt-24 pb-16 min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <Link to="/experts" className="text-primary flex items-center gap-2 hover:underline mb-4 w-fit">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {i18n.language === 'ar' ? 'العودة للخدمات' : 'Retour aux services'}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {i18n.language === 'ar' ? 'الخبراء المتاحون' : 'Experts disponibles'}
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-surface-container h-64 rounded-2xl"></div>
            ))}
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low rounded-2xl">
            <span className="material-symbols-outlined text-6xl text-stone-300 mb-4">search_off</span>
            <p className="text-xl text-on-surface-variant">
              {i18n.language === 'ar' ? 'لا يوجد خبراء متاحون في هذا التخصص حالياً.' : 'Aucun expert disponible dans cette spécialité pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experts.map(expert => (
              <div key={expert.id} className="bg-surface-container-low border border-stone-200 dark:border-stone-800 rounded-2xl p-6 flex flex-col relative shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-20 h-20 rounded-full bg-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center border-4 border-white shadow-sm">
                    {expert.profile_image ? (
                      <img src={expert.profile_image} alt={expert.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-stone-400">person</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">{i18n.language === 'ar' ? expert.full_name_ar : expert.full_name_fr}</h3>
                    <p className="text-primary font-medium text-sm mb-1">{i18n.language === 'ar' ? expert.specialty_ar : expert.specialty_fr}</p>
                    <div className="flex items-center gap-1 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                      <span className="font-bold">{expert.rating.toFixed(1)}</span>
                      <span className="mx-1">•</span>
                      <span>{expert.experience_years} {i18n.language === 'ar' ? 'سنوات خبرة' : 'ans d\'expérience'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface p-3 rounded-lg text-sm text-on-surface-variant mb-6 flex-1">
                  {(i18n.language === 'ar' ? expert.bio_ar : expert.bio_fr) || (i18n.language === 'ar' ? 'مستعد لتقديم الاستشارة والمساعدة في مجاله.' : 'Prêt à fournir des conseils et une assistance dans son domaine.')}
                </div>

                <button 
                  onClick={() => handleContactExpert(expert.id)}
                  className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">chat</span>
                  {i18n.language === 'ar' ? 'تواصل معه' : 'Contacter l\'expert'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default ExpertsByCategory;
