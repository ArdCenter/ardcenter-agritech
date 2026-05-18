import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ExpertService = () => {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/expert-categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching categories:', err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="pt-24 pb-16 min-h-screen bg-surface">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-on-surface mb-6 tracking-tight">
          {i18n.language === 'ar' ? 'خدمة الخبراء الزراعيين' : 'Consultation avec des experts agricoles'}
        </h1>
        <p className="text-lg md:text-xl text-on-surface-variant font-medium leading-relaxed">
          {i18n.language === 'ar' 
            ? 'استشر نخبة من الخبراء الزراعيين المعتمدين. احصل على نصائح متخصصة وحلول دقيقة لتطوير مشروعك الزراعي.' 
            : 'Consultez une sélection d\'experts agricoles certifiés. Obtenez des conseils spécialisés et des solutions précises pour développer votre projet agricole.'}
        </p>
        <div className="flex justify-center mt-8">
          <Link to="/my-expert-consultations" className="bg-primary/10 text-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined">forum</span>
            {i18n.language === 'ar' ? 'محادثاتي مع الخبراء' : 'Mes conversations avec les experts'}
          </Link>
        </div>
        
        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-12">
          {[
            { icon: 'verified', title: i18n.language === 'ar' ? 'خبراء معتمدون' : 'Experts certifiés' },
            { icon: 'lock', title: i18n.language === 'ar' ? 'دردشة آمنة' : 'Chat sécurisé' },
            { icon: 'support_agent', title: i18n.language === 'ar' ? 'نصائح مخصصة' : 'Conseils personnalisés' },
            { icon: 'recommend', title: i18n.language === 'ar' ? 'توصيات ملائمة' : 'Recommandations adaptées' }
          ].map((benefit, idx) => (
            <div key={idx} className="bg-surface-container p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
              <span className="material-symbols-outlined text-4xl text-primary mb-3">{benefit.icon}</span>
              <span className="font-bold text-on-surface">{benefit.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            {i18n.language === 'ar' ? 'اختر التخصص' : 'Choisissez la spécialité'}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-surface-container h-48 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/experts/category/${cat.id}`}
                className="group relative bg-surface-container-low rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all border border-stone-100 dark:border-stone-800 flex flex-col"
              >
                <div className="h-36 w-full bg-primary/10 overflow-hidden relative">
                  {cat.image ? (
                    <img 
                      src={cat.image} 
                      alt={cat.name_fr === 'Agriculture intelligente' ? 'Agriculture intelligente' : (i18n.language === 'ar' ? cat.name_ar : cat.name_fr)} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=800&auto=format&fit=crop'; // fallback
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-primary">{cat.icon || 'psychology'}</span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col items-center text-center flex-1 w-full">
                  <h3 className="font-bold text-lg mb-2 text-on-surface">
                    {i18n.language === 'ar' ? cat.name_ar : cat.name_fr}
                  </h3>
                  <p className="text-sm text-on-surface-variant mb-6 flex-1">
                    {i18n.language === 'ar' ? cat.description_ar : cat.description_fr}
                  </p>
                  <div className="mt-auto w-full flex items-center justify-between border-t border-stone-200 dark:border-stone-700 pt-4">
                    <span className="text-xs font-medium text-tertiary">
                      {cat.experts_count} {i18n.language === 'ar' ? 'خبراء' : 'experts'}
                    </span>
                    <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">
                      {i18n.language === 'ar' ? 'arrow_back' : 'arrow_forward'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default ExpertService;
