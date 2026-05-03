import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const MachineBooking = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    
    const getTodayISO = () => new Date().toISOString().split('T')[0];
    const getFutureISO = (addDays) => {
        const d = new Date();
        d.setDate(d.getDate() + addDays);
        return d.toISOString().split('T')[0];
    };

    const [machine, setMachine] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deliveryOption, setDeliveryOption] = useState('livraison'); // 'livraison' or 'retrait'
    const [startDate, setStartDate] = useState(getTodayISO());
    const [endDate, setEndDate] = useState(getFutureISO(3));
    const [userLocation, setUserLocation] = useState('');
    
    useEffect(() => {
        // Fetch machine data
        fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`)
            .then(res => res.json())
            .then(data => {
                setMachine(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching machine details:", err);
                setIsLoading(false);
            });
    }, [id]);

    const setDurationPreset = (days) => {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + days);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleConfirmBooking = () => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        alert(i18n.language === 'ar' ? 'تم تأكيد الحجز بنجاح!' : 'Réservation confirmée avec succès !');
        navigate('/orders');
    };

    if (isLoading) {
        return (
            <div className="bg-background text-on-surface min-h-screen pt-24 pb-12 px-6 flex justify-center items-center">
                <p className="text-stone-500 font-bold animate-pulse text-xl">{t('loading_details')}</p>
            </div>
        );
    }

    if (!machine) {
        return (
            <div className="bg-background text-on-surface min-h-screen pt-24 pb-12 px-6 flex flex-col justify-center items-center gap-4">
                <p className="text-stone-500 font-bold text-xl">Machine introuvable.</p>
                <Link to="/machine-rental" className="text-primary font-bold hover:underline">{t('back_to_catalog')}</Link>
            </div>
        );
    }

    const ratePerDay = machine.numericPrice || 450;
    
    const calculateDays = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
    };
    const days = calculateDays();
    const subtotal = ratePerDay * days;
    const insurance = 85;
    const deliveryFee = deliveryOption === 'livraison' ? 120 : 0;
    const total = subtotal + insurance + deliveryFee;

    const getCategoryKey = (cat) => {
        switch (cat) {
          case 'Tracteurs': return 'cat_tractors';
          case 'Moissonneuses': return 'cat_harvesters';
          case 'Excavatrices': return 'cat_excavators';
          case 'Matériel de Transport': return 'cat_transport';
          case 'Matériel agricole': return 'cat_agri_equipment';
          default: return cat;
        }
    };

    return (
        <div className="bg-background text-on-surface min-h-screen pb-24 md:pb-12 pt-24 font-body">
            <main className="max-w-7xl mx-auto px-6 py-8 md:py-12">
                {/* Breadcrumbs */}
                <nav className="mb-8 flex items-center gap-2 text-sm font-label text-on-surface-variant/70">
                    <Link to="/machine-rental" className="hover:text-primary cursor-pointer transition-colors">{t('machine_rental_title')}</Link>
                    <span className={`material-symbols-outlined text-xs ${i18n.language === 'ar' ? 'rotate-180' : ''}`}>chevron_right</span>
                    <span className="hover:text-primary cursor-pointer transition-colors">{t(getCategoryKey(machine.category))}</span>
                    <span className={`material-symbols-outlined text-xs ${i18n.language === 'ar' ? 'rotate-180' : ''}`}>chevron_right</span>
                    <span className="text-on-surface font-semibold">{t('booking_title')}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-7 space-y-12">
                        <section className="relative overflow-hidden bg-surface-container-low rounded-xl p-1">
                            <div className="flex flex-col md:flex-row gap-6 p-6">
                                <div className="w-full md:w-1/2 aspect-[4/3] rounded-lg overflow-hidden">
                                    <img alt={machine.name} className="w-full h-full object-cover" src={machine.image} />
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface mb-2">{machine.name}</h1>
                                        <p className="text-on-surface-variant font-medium leading-relaxed mb-4">
                                            {machine.description || t('product_description_fallback')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">calendar_month</span>
                                {t('booking_period')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-low p-6 rounded-xl">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t('start_date')}</label>
                                    <div className="flex items-center bg-surface-container-highest rounded-lg px-4 py-3 outline-none focus-within:ring-2 ring-primary transition-all">
                                        <span className="material-symbols-outlined mr-3 text-outline">event_upcoming</span>
                                        <input 
                                            className="bg-transparent border-none p-0 w-full focus:ring-0 text-on-surface font-medium cursor-pointer" 
                                            type="date" 
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t('end_date')}</label>
                                    <div className="flex items-center bg-surface-container-highest rounded-lg px-4 py-3 outline-none focus-within:ring-2 ring-primary transition-all">
                                        <span className="material-symbols-outlined mr-3 text-outline">event_available</span>
                                        <input 
                                            className="bg-transparent border-none p-0 w-full focus:ring-0 text-on-surface font-medium cursor-pointer" 
                                            type="date" 
                                            value={endDate}
                                            min={startDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4">
                                <button onClick={() => setDurationPreset(3)} className="px-4 py-2 bg-surface-container-highest rounded-lg text-xs font-bold text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all">3 {t('day')}s</button>
                                <button onClick={() => setDurationPreset(7)} className="px-4 py-2 bg-surface-container-highest rounded-lg text-xs font-bold text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all">1 {t('week')}</button>
                                <button onClick={() => setDurationPreset(30)} className="px-4 py-2 bg-surface-container-highest rounded-lg text-xs font-bold text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all">1 {t('month')}</button>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">local_shipping</span>
                                {t('delivery_logistics')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className={`relative flex cursor-pointer rounded-xl border-2 p-5 hover:bg-surface-container-high transition-all ${deliveryOption === 'livraison' ? 'border-primary bg-primary/5' : 'border-transparent bg-surface-container-low'}`}>
                                    <input type="radio" checked={deliveryOption === 'livraison'} onChange={() => setDeliveryOption('livraison')} className="hidden" />
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined">home_work</span></div>
                                        <div>
                                            <p className="font-bold text-on-surface">{t('delivery_to_farm')}</p>
                                            <p className="text-sm text-on-surface-variant">{i18n.language === 'ar' ? 'نقل متخصص متضمن' : 'Transport spécialisé inclus'}</p>
                                            <p className="mt-2 font-headline font-bold text-primary text-sm">+ 120,00 {t('currency')}</p>
                                        </div>
                                    </div>
                                </label>
                                <label className={`relative flex cursor-pointer rounded-xl border-2 p-5 hover:bg-surface-container-high transition-all ${deliveryOption === 'retrait' ? 'border-primary bg-primary/5' : 'border-transparent bg-surface-container-low'}`}>
                                    <input type="radio" checked={deliveryOption === 'retrait'} onChange={() => setDeliveryOption('retrait')} className="hidden" />
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-outline"><span className="material-symbols-outlined">storefront</span></div>
                                        <div>
                                            <p className="font-bold text-on-surface">{t('pickup_at_agency')}</p>
                                            <p className="text-sm text-on-surface-variant">{i18n.language === 'ar' ? 'بوسائلك الخاصة' : 'Par vos propres moyens'}</p>
                                            <p className="mt-2 font-headline font-bold text-primary text-sm">{i18n.language === 'ar' ? 'مجاني' : 'Gratuit'}</p>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="mt-6 p-6 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
                                    <div>
                                        <p className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">{t('product_location')}</p>
                                        <p className="text-on-surface font-medium">{machine.location || (i18n.language === 'ar' ? 'المستودع المركزي' : 'Dépôt Central')}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-outline-variant/30">
                                    <label className="block text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                                        {deliveryOption === 'livraison' ? t('shipping_address') : t('contact_us')}
                                    </label>
                                    <div className="flex items-center bg-surface-container-highest rounded-lg px-4 py-3 outline-none focus-within:ring-2 ring-primary transition-all">
                                        <span className="material-symbols-outlined mr-3 text-outline">home_pin</span>
                                        <input 
                                            className="bg-transparent border-none p-0 w-full focus:ring-0 text-on-surface font-medium" 
                                            type="text" 
                                            placeholder={i18n.language === 'ar' ? 'أدخل عنوانك...' : 'Saisissez votre adresse...'}
                                            value={userLocation}
                                            onChange={(e) => setUserLocation(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Recap */}
                    <aside className="lg:col-span-5 lg:sticky lg:top-28 space-y-8">
                        <div className="bg-surface-container p-8 rounded-xl shadow-sm border border-outline-variant/15">
                            <h3 className="text-2xl font-extrabold tracking-tight mb-8">{t('payment_details')}</h3>
                            <div className="space-y-5 pb-8 border-b border-outline-variant/30">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-on-surface font-semibold">{t('machine_rental_title')} ({days} {t('day')}s)</p>
                                        <p className="text-xs text-on-surface-variant text-right">{i18n.language === 'ar' ? 'السعر اليومي' : 'Tarif journalier'} : {ratePerDay.toLocaleString()} {t('currency')}</p>
                                    </div>
                                    <p className="font-bold text-on-surface">{subtotal.toLocaleString()} {t('currency')}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-on-surface font-semibold">{t('insurance_serenity')}</p>
                                    <p className="font-bold text-on-surface">{insurance.toLocaleString()} {t('currency')}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-on-surface font-semibold">{t('logistics_fees')}</p>
                                    <p className="font-bold text-on-surface">{deliveryFee.toLocaleString()} {t('currency')}</p>
                                </div>
                            </div>

                            <div className="pt-8 mb-8">
                                <div className="flex justify-between items-baseline mb-2">
                                    <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">{t('total_to_pay')}</p>
                                    <p className="text-4xl font-extrabold tracking-tighter text-primary">
                                        {total.toLocaleString()} {t('currency')}
                                    </p>
                                </div>
                                <p className={`text-xs italic text-on-surface-variant ${i18n.language === 'ar' ? 'text-left' : 'text-right'}`}>{i18n.language === 'ar' ? 'متضمن الضريبة (20%)' : 'TVA incluse (20%)'}</p>
                            </div>

                            <div className="space-y-6">
                                <label className="flex gap-3 group cursor-pointer items-start">
                                    <div className="mt-1"><input required className="w-5 h-5 rounded border-outline text-primary focus:ring-primary" type="checkbox" /></div>
                                    <span className="text-sm leading-relaxed text-on-surface-variant">{t('accept_tos_rental')}</span>
                                </label>
                                <button onClick={handleConfirmBooking} className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-xl font-headline font-extrabold text-lg shadow-[0px_12px_32px_rgba(26,28,25,0.15)] active:scale-95 duration-200 transition-all uppercase">
                                    {t('confirm_booking')}
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default MachineBooking;
