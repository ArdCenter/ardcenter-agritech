import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import Footer from './Footer';

const Checkout = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [showStripeSim, setShowStripeSim] = useState(false);
  const [stripeForm, setStripeForm] = useState({ number: '', expiry: '', cvc: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [address, setAddress] = useState({
    farmName: '',
    parcelNum: '',
    street: '',
    city: '',
    instructions: ''
  });

  const handleInputChange = (e, field) => {
    setAddress(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getShippingFee = (city, total) => {
    if (cartItems.length === 0) return 0;
    switch(city) {
      case 'Safi': return 50;
      case 'Essaouira': 
      case 'Youssoufia': return 90;
      case 'Marrakech':
      case 'Chichaoua':
      case 'Benguerir':
      case 'El Kelaa des Sraghna': return 150;
      default: return 0; // No city selected yet
    }
  };

  const shippingFee = getShippingFee(address.city, cartTotal);
  const tva = Math.round(cartTotal * 0.2);
  const totalWithTva = cartTotal + tva + shippingFee;

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (!user) return;

    const newErrors = {};
    if (!address.farmName) newErrors.farmName = true;
    if (!address.street) newErrors.street = true;
    if (!address.city) newErrors.city = true;

    if (paymentMethod === 'Stripe') {
      if (!stripeForm.number) newErrors.cardNumber = true;
      if (!stripeForm.expiry) newErrors.expiry = true;
      if (!stripeForm.cvc) newErrors.cvc = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    
    const orderData = {
      userId: user.id,
      orderNum: `#CL-${Math.floor(Math.random() * 90000) + 10000}`,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      amount: `${totalWithTva.toLocaleString()} DH`,
      status: paymentMethod === 'Stripe' ? "EN PRÉPARATION" : "EN ATTENTE",
      delivery_status: paymentMethod === 'Stripe' ? "Préparation" : "En attente",
      payment_status: paymentMethod === 'Stripe' ? 'Paid' : 'Unpaid',
      payment_method: paymentMethod,
      items: cartItems.map(item => ({
        product_id: item.id || item.product_id,
        quantity: item.quantity,
        price: item.price
      })),
      address: address
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        await clearCart();
        navigate('/orders', { state: { orderSuccess: true, orderNum: orderData.orderNum } });
      } else {
        const errorData = await response.json();
        console.error("Order server error:", errorData);
      }
    } catch (err) {
      console.error('Error placing order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface pb-32">
      <main className="pt-24 pb-20 px-6 md:px-12 max-w-[1440px] mx-auto mt-16 px-6">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface font-headline">{t('checkout_header')}</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2 font-medium">ARDCENTER Marketplace — {t('legal')}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Checkout Forms */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Shipping Address Section */}
            <section className="bg-stone-100 dark:bg-stone-900/50 rounded-xl p-8 border border-stone-200/50 dark:border-stone-800/50">
              <div className="flex items-center gap-4 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">agriculture</span>
                <h2 className="text-2xl font-bold tracking-tight font-headline text-stone-900 dark:text-stone-50">{t('shipping_address')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 px-1">{t('farm_name')}</label>
                  <input 
                    className={`w-full bg-white dark:bg-stone-800 border-2 rounded-md px-4 py-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-stone-50 placeholder:text-stone-400 dark:placeholder:text-stone-600 shadow-sm transition-all ${errors.farmName ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent'}`} 
                    placeholder={i18n.language === 'ar' ? 'نموذج: ضيعة الأمل' : 'ex: Ferme des Horizons'} 
                    type="text" 
                    value={address.farmName}
                    onChange={(e) => handleInputChange(e, 'farmName')}
                    required
                  />
                  {errors.farmName && <p className="text-[10px] text-red-500 font-bold px-1">{i18n.language === 'ar' ? 'هذا الحقل مطلوب' : 'Ce champ est obligatoire'}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 px-1">{t('parcel_num')}</label>
                  <input 
                    className="w-full bg-white dark:bg-stone-800 border-2 border-transparent rounded-md px-4 py-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-stone-50 placeholder:text-stone-400 dark:placeholder:text-stone-600 shadow-sm" 
                    placeholder={i18n.language === 'ar' ? 'نموذج: منطقة ب-42' : 'ex: Zone B-42'} 
                    type="text" 
                    value={address.parcelNum}
                    onChange={(e) => handleInputChange(e, 'parcelNum')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 px-1">{t('street')}</label>
                  <input 
                    className={`w-full bg-white dark:bg-stone-800 border-2 rounded-md px-4 py-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-stone-50 placeholder:text-stone-400 dark:placeholder:text-stone-600 shadow-sm transition-all ${errors.street ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent'}`} 
                    placeholder={i18n.language === 'ar' ? 'نموذج: 12 طريق السهول' : 'ex: 12 Chemin de la Plaine'} 
                    type="text" 
                    value={address.street}
                    onChange={(e) => handleInputChange(e, 'street')}
                    required
                  />
                  {errors.street && <p className="text-[10px] text-red-500 font-bold px-1">{i18n.language === 'ar' ? 'هذا الحقل مطلوب' : 'Ce champ est obligatoire'}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 px-1">{t('city')}</label>
                  <select 
                    className={`w-full bg-white dark:bg-stone-800 border-2 rounded-md px-4 py-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-stone-50 shadow-sm cursor-pointer appearance-none transition-all ${errors.city ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent'}`} 
                    value={address.city}
                    onChange={(e) => handleInputChange(e, 'city')}
                    required
                  >
                    <option value="" disabled>{i18n.language === 'ar' ? 'اختر المدينة' : 'Choisir une ville'}</option>
                    {[
                      'Safi', 'Marrakech', 'Essaouira', 'Youssoufia', 'Chichaoua', 'Benguerir', 'El Kelaa des Sraghna'
                    ].map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.city && <p className="text-[10px] text-red-500 font-bold px-1">{i18n.language === 'ar' ? 'هذا الحقل مطلوب' : 'Ce champ est obligatoire'}</p>}
                </div>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-sm font-semibold text-stone-600 dark:text-stone-400 px-1">{t('instructions')}</label>
                  <textarea 
                    className="w-full bg-white dark:bg-stone-800 border-none rounded-md px-4 py-4 focus:ring-2 focus:ring-primary text-stone-900 dark:text-stone-50 placeholder:text-stone-400 dark:placeholder:text-stone-600 resize-none shadow-sm" 
                    placeholder={i18n.language === 'ar' ? 'نموذج: خلف المستودع الرئيسي، الدخول عبر البوابة الجنوبية...' : 'ex: Derrière le silo à grain principal, accès par le portail sud...'} 
                    rows="3"
                    value={address.instructions}
                    onChange={(e) => handleInputChange(e, 'instructions')}
                  ></textarea>
                </div>
              </div>
            </section>

            {/* Payment Method Section */}
            <section className="bg-stone-100 dark:bg-stone-900/50 rounded-xl p-8 border border-stone-200/50 dark:border-stone-800/50">
              <div className="flex items-center gap-4 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">payments</span>
                <h2 className="text-2xl font-bold tracking-tight font-headline text-stone-900 dark:text-stone-50">{t('payment_method')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* COD Option */}
                <div 
                  onClick={() => { setPaymentMethod('COD'); setShowStripeSim(false); }}
                  className={`relative group cursor-pointer border-2 rounded-xl p-6 transition-all active:scale-95 duration-150 shadow-sm ${paymentMethod === 'COD' ? 'border-primary bg-white dark:bg-stone-950' : 'border-stone-200 dark:border-stone-800 bg-stone-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-lg ${paymentMethod === 'COD' ? 'bg-primary/10' : 'bg-stone-200'}`}>
                        <span className={`material-symbols-outlined ${paymentMethod === 'COD' ? 'text-primary' : 'text-stone-500'}`} style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                      </div>
                      <div>
                        <h3 className={`font-bold ${paymentMethod === 'COD' ? 'text-stone-900 dark:text-stone-50' : 'text-stone-400'}`}>{t('cash_on_delivery')}</h3>
                        <p className="text-sm text-stone-500 opacity-80">{t('footer_rights')}</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-primary' : 'border-stone-300'}`}>
                      {paymentMethod === 'COD' && <div className="w-3 h-3 bg-primary rounded-full"></div>}
                    </div>
                  </div>
                </div>

                {/* Online Payment Option */}
                <div 
                  onClick={() => setPaymentMethod('Stripe')}
                  className={`relative group cursor-pointer border px-4 py-3 rounded-xl p-6 transition-all hover:bg-stone-50 dark:hover:bg-stone-800/80 active:scale-95 duration-150 ${paymentMethod === 'Stripe' ? 'border-primary bg-white dark:bg-stone-950 ring-2 ring-primary/20' : 'border-stone-200 dark:border-stone-800 bg-stone-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-lg ${paymentMethod === 'Stripe' ? 'bg-primary/10' : 'bg-stone-200'}`}>
                        <span className={`material-symbols-outlined ${paymentMethod === 'Stripe' ? 'text-primary' : 'text-stone-500'}`}>credit_card</span>
                      </div>
                      <div>
                        <h3 className={`font-bold ${paymentMethod === 'Stripe' ? 'text-stone-900 dark:text-stone-50' : 'text-stone-400'}`}>{t('online_payment')}</h3>
                        <p className="text-sm text-stone-500 opacity-60">Visa, Mastercard, Apple Pay.</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'Stripe' ? 'border-primary' : 'border-stone-300'}`}>
                      {paymentMethod === 'Stripe' && <div className="w-3 h-3 bg-primary rounded-full"></div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Online Payment Integrated Form */}
              {paymentMethod === 'Stripe' && (
                <div className="mt-8 p-8 bg-white dark:bg-stone-950 rounded-xl border-2 border-primary/30 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">security</span>
                      <h3 className="text-xl font-bold font-headline">{i18n.language === 'ar' ? 'معلومات الدفع الآمن' : 'Paiement Sécurisé'}</h3>
                    </div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5 opacity-80" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-stone-500">{i18n.language === 'ar' ? 'رقم البطاقة' : 'Numéro de Carte'}</label>
                      <div className="relative">
                        <input 
                          value={stripeForm.number} 
                          onChange={e => {
                            let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                            let groups = val.match(/.{1,4}/g);
                            let formatted = groups ? groups.join(' ') : val;
                            setStripeForm({...stripeForm, number: formatted.substring(0, 19)});
                            if (errors.cardNumber) setErrors(prev => ({...prev, cardNumber: null}));
                          }} 
                          placeholder="4242 4242 4242 4242" 
                          className={`w-full bg-stone-50 dark:bg-stone-800 border-2 rounded-lg px-4 py-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none ${errors.cardNumber ? 'border-red-500 bg-red-50' : 'border-stone-200 dark:border-stone-700'}`} 
                          type="text" 
                        />
                        <span className="material-symbols-outlined absolute right-4 top-4 text-stone-400">credit_card</span>
                      </div>
                      {errors.cardNumber && <p className="text-[10px] text-red-500 font-bold px-1">{i18n.language === 'ar' ? 'رقم البطاقة مطلوب' : 'Le numéro est obligatoire'}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-stone-500">{i18n.language === 'ar' ? 'تاريخ الانتهاء' : 'Date d\'expiration'}</label>
                      <input 
                        value={stripeForm.expiry} 
                        onChange={e => {
                          let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                          if (val.length > 2) {
                            val = val.substring(0, 2) + ' / ' + val.substring(2, 4);
                          }
                          setStripeForm({...stripeForm, expiry: val.substring(0, 7)});
                          if (errors.expiry) setErrors(prev => ({...prev, expiry: null}));
                        }} 
                        placeholder="MM / YY" 
                        className={`w-full bg-stone-50 dark:bg-stone-800 border-2 rounded-lg px-4 py-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none ${errors.expiry ? 'border-red-500 bg-red-50' : 'border-stone-200 dark:border-stone-700'}`} 
                        type="text" 
                      />
                      {errors.expiry && <p className="text-[10px] text-red-500 font-bold px-1">{i18n.language === 'ar' ? 'التاريخ مطلوب' : 'La date est obligatoire'}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-stone-500">CVC</label>
                      <input 
                        value={stripeForm.cvc} 
                        onChange={e => {
                          setStripeForm({...stripeForm, cvc: e.target.value});
                          if (errors.cvc) setErrors(prev => ({...prev, cvc: null}));
                        }} 
                        placeholder="123" 
                        className={`w-full bg-stone-50 dark:bg-stone-800 border-2 rounded-lg px-4 py-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none ${errors.cvc ? 'border-red-500 bg-red-50' : 'border-stone-200 dark:border-stone-700'}`} 
                        type="text" 
                      />
                      {errors.cvc && <p className="text-[10px] text-red-500 font-bold px-1">CVC obligatoire</p>}
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] text-stone-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">lock</span>
                    {i18n.language === 'ar' ? 'بياناتك مشفرة ومحمية بالكامل' : 'Vos données bancaires sont cryptées et 100% sécurisées.'}
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="bg-stone-50 dark:bg-stone-900/80 rounded-xl p-8 border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
                <h2 className="text-xl font-bold tracking-tight mb-8 text-stone-900 dark:text-stone-50 font-headline">{t('order_summary')}</h2>
                <div className="space-y-6 mb-8">
                  {cartItems.map((item) => (
                    <div key={item.cart_item_id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg bg-stone-200 dark:bg-stone-800 overflow-hidden flex-shrink-0">
                        <img 
                          className="w-full h-full object-cover" 
                          src={item.image?.startsWith('data:') || item.image?.startsWith('http') 
                            ? item.image 
                            : `${import.meta.env.VITE_API_URL}${item.image}`} 
                          alt={item.name} 
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-sm font-bold text-stone-900 dark:text-stone-50">{item.name}</span>
                        <span className="text-xs text-stone-500 font-medium">{t('settings')}: {item.quantity}</span>
                        <span className="text-sm font-bold mt-1 text-primary">{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-4 pt-6 border-t border-stone-200 dark:border-stone-800">
                  <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400 font-medium">
                    <span>{t('subtotal')}</span>
                    <span className="font-bold text-stone-900 dark:text-stone-50">{cartTotal.toLocaleString()} {t('currency')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400 font-medium">
                    <span>{t('shipping')}</span>
                    <span className="font-bold text-stone-900 dark:text-stone-50">
                      {address.city ? `${shippingFee} ${t('currency')}` : (i18n.language === 'ar' ? 'اختر مدينة' : 'Choisissez une ville')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400 font-medium">
                    <span>{i18n.language === 'ar' ? 'الضريبة (20%)' : 'TVA (20%)'}</span>
                    <span className="font-bold text-stone-900 dark:text-stone-50">{tva.toLocaleString()} {t('currency')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-stone-200 dark:border-stone-800 mt-2">
                    <span className="text-lg font-bold text-stone-900 dark:text-stone-50">{t('total_price')}</span>
                    <span className="text-2xl font-black text-primary font-headline">{totalWithTva.toLocaleString()} {t('currency')}</span>
                  </div>
                </div>

                {/* Confirmation Button */}
                <button 
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting}
                  className={`w-full mt-8 bg-gradient-to-r from-green-800 to-green-700 dark:from-green-700 dark:to-green-600 text-white py-4 rounded-lg font-bold text-lg hover:opacity-90 shadow-lg shadow-green-900/20 transition-all active:scale-[0.98] duration-150 flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? t('processing') : t('confirm_order')}
                  <span className={`material-symbols-outlined ${i18n.language === 'ar' ? 'rotate-180' : ''}`}>arrow_forward</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Order Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-950/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-3xl p-10 text-center shadow-2xl border border-stone-100 dark:border-stone-800 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-5xl">check_circle</span>
            </div>
            
            <h2 className="text-3xl font-black mb-4 font-headline text-stone-900 dark:text-white">
              {i18n.language === 'ar' ? 'تمت العملية بنجاح !' : 'Commande Confirmée !'}
            </h2>
            
            <p className="text-stone-500 dark:text-stone-400 mb-10 leading-relaxed font-medium">
              {i18n.language === 'ar' 
                ? 'شكراً لثقتكم. تم تسجيل طلبكم بنجاح وسنقوم بمعالجته في أقرب وقت ممكن.' 
                : 'Merci pour votre confiance. Votre commande a été enregistrée avec succès et est en cours de préparation.'}
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/orders')}
                className="w-full bg-green-800 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-3"
              >
                {i18n.language === 'ar' ? 'عرض طلباتي' : 'Voir mes commandes'}
                <span className="material-symbols-outlined">history</span>
              </button>
              
              <button 
                onClick={() => navigate('/')}
                className="w-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold py-4 rounded-xl hover:bg-stone-200 transition-all"
              >
                {i18n.language === 'ar' ? 'العودة للاستقبال' : 'Retour à l\'accueil'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Checkout;
