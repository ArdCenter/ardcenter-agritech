import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ExpertLanding = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const navigate = useNavigate();

    return (
        <div className="bg-stone-50 dark:bg-stone-900 min-h-screen font-sans" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-primary/5 pt-20 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <span className="text-primary font-bold tracking-wider uppercase text-sm mb-4 block">
                            {isAr ? 'انضم إلى شبكة خبرائنا' : 'Rejoignez notre réseau d\'experts'}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black text-stone-900 dark:text-white mb-6 leading-tight">
                            {isAr ? 'شارك خبرتك الزراعية واربح المزيد' : 'Partagez votre expertise agricole et développez vos revenus'}
                        </h1>
                        <p className="text-xl text-stone-600 dark:text-stone-400 mb-10">
                            {isAr 
                                ? 'المنصة الأولى التي تجمع أفضل المهندسين والخبراء الزراعيين مع المزارعين في جميع أنحاء المغرب.' 
                                : 'La première plateforme qui connecte les meilleurs ingénieurs et experts agricoles aux agriculteurs partout au Maroc.'}
                        </p>
                        <button 
                            onClick={() => navigate('/expert-register')}
                            className="bg-primary hover:bg-primary-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/30 transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                            {isAr ? 'سجل كخبير الآن' : 'Devenir Expert Maintenant'}
                            <span className="material-symbols-outlined">{isAr ? 'arrow_back' : 'arrow_forward'}</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-24 bg-white dark:bg-stone-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-white">
                            {isAr ? 'لماذا تنضم إلى ARDCENTER؟' : 'Pourquoi rejoindre ARDCENTER ?'}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: 'visibility',
                                title_ar: 'ظهور أكبر',
                                title_fr: 'Visibilité accrue',
                                desc_ar: 'الوصول إلى آلاف المزارعين الذين يبحثون عن استشارات متخصصة كل يوم.',
                                desc_fr: 'Atteignez des milliers d\'agriculteurs à la recherche de conseils spécialisés chaque jour.'
                            },
                            {
                                icon: 'payments',
                                title_ar: 'زيادة الدخل',
                                title_fr: 'Revenus supplémentaires',
                                desc_ar: 'حدد تسعيرتك الخاصة لكل استشارة واحصل على مدفوعاتك بأمان.',
                                desc_fr: 'Fixez vos propres tarifs pour chaque consultation et recevez vos paiements en toute sécurité.'
                            },
                            {
                                icon: 'schedule',
                                title_ar: 'مرونة كاملة',
                                title_fr: 'Flexibilité totale',
                                desc_ar: 'قم بإدارة جدولك الزمني وتقديم الاستشارات في الأوقات التي تناسبك.',
                                desc_fr: 'Gérez votre emploi du temps et proposez des consultations aux horaires qui vous conviennent.'
                            }
                        ].map((benefit, i) => (
                            <div key={i} className="bg-stone-50 dark:bg-stone-900 p-8 rounded-3xl border border-stone-200 dark:border-stone-800 text-center hover:shadow-xl transition-shadow">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                                    <span className="material-symbols-outlined text-3xl">{benefit.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-4">
                                    {isAr ? benefit.title_ar : benefit.title_fr}
                                </h3>
                                <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                                    {isAr ? benefit.desc_ar : benefit.desc_fr}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 bg-stone-50 dark:bg-stone-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-white">
                            {isAr ? 'كيف تعمل المنصة؟' : 'Comment ça marche ?'}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { num: '1', title_ar: 'التسجيل', title_fr: 'Inscription', desc_ar: 'أكمل ملفك الشخصي بالشهادات والخبرات.', desc_fr: 'Complétez votre profil avec vos diplômes et expériences.' },
                            { num: '2', title_ar: 'التحقق', title_fr: 'Validation', desc_ar: 'نقوم بمراجعة طلبك للتأكد من جودة الخبراء.', desc_fr: 'Nous examinons votre demande pour garantir la qualité.' },
                            { num: '3', title_ar: 'الاشتراك', title_fr: 'Abonnement', desc_ar: 'اختر الباقة التي تناسب طموحاتك.', desc_fr: 'Choisissez le forfait qui correspond à vos ambitions.' },
                            { num: '4', title_ar: 'البدء', title_fr: 'Démarrage', desc_ar: 'ابدأ في تلقي طلبات الاستشارة وتوسيع شبكتك.', desc_fr: 'Commencez à recevoir des demandes et élargissez votre réseau.' }
                        ].map((step, i) => (
                            <div key={i} className="text-center relative">
                                <div className="w-16 h-16 bg-white dark:bg-stone-950 border-2 border-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-primary shadow-lg relative z-10">
                                    {step.num}
                                </div>
                                <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">{isAr ? step.title_ar : step.title_fr}</h3>
                                <p className="text-stone-600 dark:text-stone-400 text-sm">{isAr ? step.desc_ar : step.desc_fr}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* CTA */}
            <section className="py-24 bg-primary text-white text-center">
                <div className="max-w-3xl mx-auto px-4">
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        {isAr ? 'هل أنت مستعد لمشاركة معرفتك؟' : 'Prêt à partager vos connaissances ?'}
                    </h2>
                    <p className="text-xl opacity-90 mb-10">
                        {isAr ? 'انضم إلينا اليوم وكن جزءاً من ثورة الزراعة الرقمية.' : 'Rejoignez-nous aujourd\'hui et faites partie de la révolution de l\'agriculture numérique.'}
                    </p>
                    <button 
                        onClick={() => navigate('/expert-register')}
                        className="bg-white text-primary hover:bg-stone-100 px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all hover:scale-105"
                    >
                        {isAr ? 'ابدأ التسجيل الآن' : 'Commencer l\'inscription'}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default ExpertLanding;
