import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const ExpertProfile = () => {
  const { expertId } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/experts/${expertId}`)
      .then(res => res.json())
      .then(data => {
        setExpert(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching expert:', err);
        setLoading(false);
      });
  }, [expertId]);

  const handleContact = async () => {
    if (!user) {
      navigate('/login', { state: { returnUrl: `/experts/profile/${expertId}` } });
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-consultations/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user.id,
          expertId: expert.id,
          categoryId: expert.category_id
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

  if (loading) return <div className="pt-24 min-h-screen flex justify-center items-center">Loading...</div>;
  if (!expert) return <div className="pt-24 min-h-screen flex justify-center items-center">Expert not found.</div>;

  return (
    <main className="pt-24 pb-16 min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-6">
        <Link to={`/experts/category/${expert.category_id}`} className="text-primary flex items-center gap-2 hover:underline mb-8 w-fit">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          {i18n.language === 'ar' ? 'العودة للخبراء' : 'Retour aux experts'}
        </Link>
        
        <div className="bg-surface-container-low rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center border-4 border-white shadow-md">
              {expert.profile_image ? (
                <img src={expert.profile_image} alt={expert.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-6xl text-stone-400">person</span>
              )}
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface">{i18n.language === 'ar' ? expert.full_name_ar : expert.full_name_fr}</h1>
                  <p className="text-xl text-primary font-medium">{i18n.language === 'ar' ? expert.specialty_ar : expert.specialty_fr}</p>
                </div>
                <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-4 py-2 rounded-xl">
                  <span className="material-symbols-outlined">star</span>
                  <span className="font-bold text-lg">{expert.rating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined">work</span>
                  <span>{expert.experience_years} {i18n.language === 'ar' ? 'سنوات خبرة' : 'ans d\'expérience'}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined">language</span>
                  <span>{expert.languages || (i18n.language === 'ar' ? 'العربية' : 'Arabe, Français')}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="text-green-500 font-medium">{i18n.language === 'ar' ? 'متاح' : 'Disponible'}</span>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2">{i18n.language === 'ar' ? 'نبذة عن الخبير' : 'À propos de l\'expert'}</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  {(i18n.language === 'ar' ? expert.bio_ar : expert.bio_fr) || (i18n.language === 'ar' ? 'مستعد لتقديم الاستشارة والمساعدة في مجاله بناءً على خبرته الطويلة.' : 'Prêt à fournir des conseils et une assistance dans son domaine grâce à sa longue expérience.')}
                </p>
              </div>

              <button 
                onClick={handleContact}
                className="w-full md:w-auto px-8 py-4 bg-primary text-on-primary font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 text-lg shadow-lg"
              >
                <span className="material-symbols-outlined">chat</span>
                {i18n.language === 'ar' ? 'بدء المحادثة الآن' : 'Démarrer la conversation'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ExpertProfile;
