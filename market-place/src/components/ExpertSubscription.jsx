import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ExpertSubscription = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userPoints = user.points || 0;

    const getPriceDetails = (basePrice) => {
        const numericPrice = Number(basePrice);
        const maxDiscount = numericPrice * 0.3;
        const pointsUsed = Math.min(userPoints, maxDiscount);
        const finalPrice = numericPrice - pointsUsed;
        return { basePrice: numericPrice, maxDiscount, pointsUsed, finalPrice };
    };

    const handleSubscribe = async () => {
        if (!selectedPlan) return alert(isAr ? 'الرجاء اختيار باقة' : 'Veuillez sélectionner un forfait');
        
        const details = getPriceDetails(selectedPlan.price);

        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/experts/${user.expert_id || user.id}/subscribe`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    plan: selectedPlan.name,
                    points_used: details.pointsUsed,
                    final_price: details.finalPrice
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                // Update local storage status
                const updatedUser = { 
                    ...user, 
                    approval_status: 'active',
                    points: userPoints - details.pointsUsed 
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                alert(isAr ? 'تم تفعيل حسابك بنجاح!' : 'Votre compte a été activé avec succès !');
                navigate('/expert-dashboard'); // Or wherever experts go
                window.location.reload();
            } else {
                alert(data.error || 'Erreur lors de l\'activation');
            }
        } catch (err) {
            console.error('Error subscribing:', err);
            alert('Erreur réseau');
        }
        setLoading(false);
    };

    const plans = [
        {
            name: 'Basic',
            price: '199',
            period: isAr ? 'شهرياً' : '/ mois',
            features_ar: ['ظهور في البحث', 'تلقي طلبات الاستشارة', 'دعم فني عادي'],
            features_fr: ['Visibilité dans la recherche', 'Recevoir des demandes', 'Support standard'],
            recommended: false
        },
        {
            name: 'Pro',
            price: '399',
            period: isAr ? 'شهرياً' : '/ mois',
            features_ar: ['كل ميزات Basic', 'شارة خبير معتمد', 'أولوية في الظهور', 'إحصائيات متقدمة'],
            features_fr: ['Toutes les fonctionnalités Basic', 'Badge Expert Vérifié', 'Priorité d\'affichage', 'Statistiques avancées'],
            recommended: true
        },
        {
            name: 'Premium',
            price: '799',
            period: isAr ? 'شهرياً' : '/ mois',
            features_ar: ['كل ميزات Pro', 'تسويق مخصص', 'لا يوجد عمولة على الاستشارات', 'مدير حساب شخصي'],
            features_fr: ['Toutes les fonctionnalités Pro', 'Marketing dédié', 'Aucune commission sur les consultations', 'Gestionnaire de compte'],
            recommended: false
        }
    ];

    if (!user || !user.id || user.role !== 'expert') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-900">
                <p className="text-xl text-stone-500">Accès non autorisé.</p>
            </div>
        );
    }

    return (
        <div className="bg-stone-50 dark:bg-stone-900 min-h-screen py-20 px-4" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    {user.approval_status === 'expired' ? (
                        <>
                            <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
                            <h1 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-6">
                                {isAr ? 'انتهت صلاحية اشتراكك' : 'Votre abonnement a expiré'}
                            </h1>
                            <p className="text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
                                {isAr 
                                    ? 'يرجى تجديد اشتراكك لاستعادة الوصول إلى المنصة والرسائل والاستشارات.' 
                                    : 'Veuillez renouveler votre abonnement pour retrouver l\'accès à la plateforme, aux messages et aux consultations.'}
                            </p>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-6xl text-primary mb-4">verified_user</span>
                            <h1 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-white mb-6">
                                {isAr ? 'تمت الموافقة على طلبك!' : 'Votre demande a été approuvée !'}
                            </h1>
                            <p className="text-xl text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
                                {isAr 
                                    ? 'خطوة واحدة فقط تفصلك عن الانضمام لشبكتنا. اختر باقة الاشتراك المناسبة لك لتفعيل حسابك.' 
                                    : 'Plus qu\'une seule étape avant de rejoindre notre réseau. Choisissez votre forfait pour activer votre compte.'}
                            </p>
                        </>
                    )}
                    
                    {userPoints > 0 && (
                        <div className="mt-8 inline-block bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-orange-800 dark:text-orange-200">
                            <div className="flex items-center gap-2 font-bold text-lg mb-1 justify-center">
                                <span className="material-symbols-outlined">stars</span>
                                {isAr ? 'رصيد النقاط متاح' : 'Solde de points disponible'}
                            </div>
                            <p>
                                {isAr 
                                    ? `لديك ${userPoints} نقطة سيتم استخدامها تلقائيًا لخصم يصل إلى 30% من قيمة الاشتراك.` 
                                    : `Vous avez ${userPoints} points qui seront automatiquement utilisés pour une réduction allant jusqu'à 30% du prix.`}
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {plans.map((plan) => {
                        const details = getPriceDetails(plan.price);
                        
                        return (
                            <div 
                                key={plan.name}
                                onClick={() => setSelectedPlan(plan)}
                                className={`relative bg-white dark:bg-stone-950 rounded-3xl p-8 cursor-pointer transition-all ${
                                    selectedPlan?.name === plan.name 
                                        ? 'border-2 border-primary shadow-2xl scale-105' 
                                        : 'border border-stone-200 dark:border-stone-800 hover:border-primary/50 hover:shadow-xl'
                                }`}
                            >
                                {plan.recommended && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                                        {isAr ? 'الأكثر طلباً' : 'Recommandé'}
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">{plan.name}</h3>
                                <div className="mb-6">
                                    {details.pointsUsed > 0 ? (
                                        <>
                                            <div className="flex items-end gap-2">
                                                <span className="text-4xl font-black text-stone-900 dark:text-white">{details.finalPrice} DH</span>
                                                <span className="text-stone-400 line-through text-lg">{details.basePrice} DH</span>
                                            </div>
                                            <p className="text-green-500 text-sm font-bold mt-1">
                                                {isAr ? `تم خصم ${details.pointsUsed} نقطة (-${details.pointsUsed} DH)` : `${details.pointsUsed} points utilisés (-${details.pointsUsed} DH)`}
                                            </p>
                                        </>
                                    ) : (
                                        <span className="text-4xl font-black text-stone-900 dark:text-white">{plan.price} DH</span>
                                    )}
                                    <span className="text-stone-500 font-medium block mt-1"> {plan.period}</span>
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {(isAr ? plan.features_ar : plan.features_fr).map((feat, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-green-500 text-sm mt-1">check_circle</span>
                                            <span className="text-stone-700 dark:text-stone-300 font-medium">{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className={`w-full py-3 rounded-xl font-bold text-center transition-colors ${
                                    selectedPlan?.name === plan.name 
                                        ? 'bg-primary text-white' 
                                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                                }`}>
                                    {isAr ? 'اختيار' : 'Sélectionner'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="text-center">
                    <button 
                        onClick={handleSubscribe}
                        disabled={!selectedPlan || loading}
                        className="bg-primary hover:bg-primary-600 disabled:bg-stone-300 disabled:cursor-not-allowed text-white px-12 py-4 rounded-full font-bold text-xl shadow-xl transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined">credit_card</span>
                        )}
                        {isAr ? 'تأكيد ودفع' : 'Confirmer et Payer'}
                    </button>
                    <p className="text-stone-500 text-sm mt-4">
                        {isAr ? 'الدفع آمن ومحمي 100%' : 'Paiement 100% sécurisé'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExpertSubscription;
