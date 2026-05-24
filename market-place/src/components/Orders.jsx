import React, { useState, useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Footer from './Footer';

const Orders = () => {
  const { t, i18n } = useTranslation();
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    if (location.state?.orderSuccess) {
      setShowSuccessBanner(true);
      // Optional: Auto-hide the banner after 5 seconds
      const timer = setTimeout(() => setShowSuccessBanner(false), 5000);
      
      // Clean up the state so it doesn't reappear on reload
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, user?.id, location.state]);

  const fetchOrders = () => {
    setIsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/orders/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setIsLoading(false);
      });
  };

  const handleOrderClick = async (orderNum) => {
    setIsDetailLoading(true);
    scrollTo(0, 0);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/details/${encodeURIComponent(orderNum)}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setSelectedOrder(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'En attente': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Préparation': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Expédié': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'En Transit': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Livré': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'En attente': return i18n.language === 'ar' ? 'قيد الانتظار' : 'En attente';
      case 'Préparation': return t('prepared');
      case 'Expédié': return t('shipped');
      case 'En Transit': return i18n.language === 'ar' ? 'في الطريق' : 'En Transit';
      case 'Livré': return t('delivered');
      default: return status;
    }
  };

  if (selectedOrder) {
    return (
      <div className="bg-[#fafaf5] dark:bg-stone-950 min-h-screen text-on-surface pb-32">
        <main className="pt-32 pb-20 px-6 md:px-12 max-w-screen-xl mx-auto mt-16 font-body">
          {/* Header Section */}
          <header className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <nav className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 mb-4">
                  <span className="cursor-pointer hover:text-primary transition-colors" onClick={handleBackToList}>{t('order_history')}</span>
                  <span className={`material-symbols-outlined text-xs ${i18n.language === 'ar' ? 'rotate-180' : ''}`}>chevron_right</span>
                  <span className="font-semibold text-on-surface">{selectedOrder.order_num}</span>
                </nav>
                <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-on-surface">{t('order_details')} {selectedOrder.order_num}</h1>
              </div>
              <div className="flex flex-col items-start md:items-end">
                <p className="text-stone-500 dark:text-stone-400 text-sm font-medium uppercase tracking-widest">{t('purchase_date')}</p>
                <p className="text-xl font-bold">{selectedOrder.date}</p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {/* Tracking Timeline */}
              <section className="bg-white dark:bg-stone-900 rounded-2xl p-8 md:p-12 border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
                <h2 className="text-xl font-headline font-bold mb-10 text-primary">{t('delivery_status')}</h2>
                <div className="relative">
                  <div className="absolute top-5 left-6 md:left-6 md:top-6 w-0.5 md:w-[calc(100%-48px)] h-[calc(100%-40px)] md:h-0.5 bg-stone-100 dark:bg-stone-800"></div>
                  <div className="flex flex-col md:flex-row justify-between relative gap-10 md:gap-4">
                    {/* Progress indicators based on status */}
                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-6 z-10 bg-white dark:bg-stone-900 pr-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${selectedOrder.delivery_status === 'En attente' ? 'bg-orange-500 text-white' : 'bg-primary text-white'}`}>
                        <span className="material-symbols-outlined">
                          {selectedOrder.delivery_status === 'En attente' ? 'schedule' : 'check_circle'}
                        </span>
                      </div>
                      <div>
                        <p className={`font-bold ${selectedOrder.delivery_status === 'En attente' ? 'text-orange-600' : ''}`}>
                          {selectedOrder.delivery_status === 'En attente' ? (i18n.language === 'ar' ? 'قيد الانتظار' : 'En attente') : t('validated')}
                        </p>
                        <p className="text-xs text-stone-500">{selectedOrder.date}</p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-6 z-10 bg-white dark:bg-stone-900 pr-4 text-center md:text-left">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 ${
                        ['Préparation', 'Expédié', 'En Transit', 'Livré'].includes(selectedOrder.delivery_status) 
                        ? (selectedOrder.delivery_status !== 'Préparation' ? 'bg-primary border-primary text-white' : 'bg-primary-container text-on-primary-container border-primary')
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700'
                      }`}>
                        <span className="material-symbols-outlined">inventory_2</span>
                      </div>
                      <div>
                        <p className={`font-bold ${
                          selectedOrder.delivery_status === 'Préparation' ? 'text-primary' 
                          : selectedOrder.delivery_status === 'En attente' ? 'text-stone-400' : ''
                        }`}>{t('prepared')}</p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-6 z-10 bg-white dark:bg-stone-900 pr-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${['Expédié', 'En Transit', 'Livré'].includes(selectedOrder.delivery_status) ? 'bg-primary text-white border-primary shadow-lg' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700'}`}>
                        <span className="material-symbols-outlined">package_2</span>
                      </div>
                      <div>
                        <p className={`font-bold ${selectedOrder.delivery_status === 'Expédié' ? 'text-primary' : ['En Transit', 'Livré'].includes(selectedOrder.delivery_status) ? '' : 'text-stone-400'}`}>{t('shipped')}</p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-6 z-10 bg-white dark:bg-stone-900 pr-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${['En Transit', 'Livré'].includes(selectedOrder.delivery_status) ? 'bg-primary text-white border-primary shadow-lg' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700'}`}>
                        <span className="material-symbols-outlined">local_shipping</span>
                      </div>
                      <div>
                        <p className={`font-bold ${selectedOrder.delivery_status === 'En Transit' ? 'text-primary' : selectedOrder.delivery_status === 'Livré' ? '' : 'text-stone-400'}`}>{i18n.language === 'ar' ? 'في الطريق' : 'En Transit'}</p>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-6 z-10 bg-white dark:bg-stone-900 pr-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${selectedOrder.delivery_status === 'Livré' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-stone-50 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700'}`}>
                        <span className="material-symbols-outlined">home_pin</span>
                      </div>
                      <div>
                        <p className={`font-bold ${selectedOrder.delivery_status === 'Livré' ? 'text-primary' : 'text-stone-400'}`}>{t('delivered')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrder.estimated_delivery && (
                    <div className="mt-10 p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-4 animate-pulse">
                        <span className="material-symbols-outlined text-primary">event_available</span>
                        <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                           {i18n.language === 'ar' ? 'موعد التسليم المتوقع:' : 'Livraison estimée :'} <span className="text-primary">{selectedOrder.estimated_delivery}</span>
                        </p>
                    </div>
                )}
              </section>

              {/* Order Items */}
              <section className="bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
                <h2 className="text-xl font-headline font-bold mb-8 text-primary">{t('ordered_items')}</h2>
                <div className="space-y-4">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-100 dark:border-stone-800 transition-all hover:bg-stone-100 dark:hover:bg-stone-900 group">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-white dark:bg-stone-900 flex-shrink-0 border border-stone-200/50 shadow-sm group-hover:scale-105 transition-transform">
                            <img 
                              className="w-full h-full object-cover" 
                              src={item.product_image?.startsWith('data:') || item.product_image?.startsWith('http') 
                                ? item.product_image 
                                : `${import.meta.env.VITE_API_URL}${item.product_image}`} 
                              alt={item.product_name} 
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-stone-900 dark:text-stone-50 text-lg">{item.product_name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-stone-500 text-[10px] uppercase font-black tracking-widest bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">{item.product_category}</span>
                              <span className="text-primary font-black text-sm">{t('settings')}: {item.quantity}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-xl text-stone-900 dark:text-stone-50">{item.unit_price}</p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{t('investment_price')}</p>
                        </div>
                      </div>
                    ))
                  ) : null}
                </div>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-8">
              {/* Delivery Address */}
              <section className="bg-primary text-on-primary rounded-2xl p-8 shadow-xl shadow-primary/10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-3xl">location_on</span>
                  <h2 className="text-xl font-headline font-bold">{t('shipping_address')}</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase font-black tracking-widest opacity-70 mb-1">{t('farm_name')}</p>
                    <p className="text-xl font-bold">{selectedOrder.farm_name || '—'}</p>
                  </div>
                  {(selectedOrder.parcel_num || selectedOrder.street || selectedOrder.city) && (
                    <div className="pt-4 border-t border-white/20">
                      <p className="text-sm opacity-90">{selectedOrder.street}</p>
                      <p className="text-sm opacity-90">{selectedOrder.parcel_num && `${t('parcel_num')} ${selectedOrder.parcel_num}`}</p>
                      <p className="text-sm opacity-90">{selectedOrder.city}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Order Total Summary */}
              <section className="bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
                <h3 className="font-headline font-bold text-lg mb-6">{t('financial_summary')}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-stone-500">
                    <span>{t('total')}</span>
                    <span>{selectedOrder.amount}</span>
                  </div>
                  <div className="pt-4 border-t-2 border-primary/10 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{t('cash_on_delivery')}</p>
                      <span className="font-headline text-lg font-black tracking-tighter uppercase">{t('total_payment')}</span>
                    </div>
                    <span className="text-3xl font-black text-primary font-headline">{selectedOrder.amount}</span>
                  </div>
                </div>
              </section>
              
              <button 
                onClick={handleBackToList}
                className="w-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span className={`material-symbols-outlined ${i18n.language === 'ar' ? 'rotate-180' : ''}`}>arrow_back</span>
                {t('back_to_list')}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#fafaf5] dark:bg-stone-950 min-h-screen text-on-surface pb-32">
      <main className="pt-32 pb-20 px-6 md:px-12 max-w-screen-xl mx-auto mt-16 font-body">
        {/* Success Banner */}
        {showSuccessBanner && (
          <div className="mb-8 p-6 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-2xl flex items-center justify-between shadow-lg shadow-green-500/10 animate-in fade-in slide-in-from-top-10 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300">
                  {i18n.language === 'ar' ? 'تم تأكيد الطلب بنجاح!' : 'Commande Confirmée avec Succès !'}
                </h3>
                <p className="text-green-700 dark:text-green-400 font-medium">
                  {i18n.language === 'ar' ? 'طلبك الآن قيد التحضير.' : 'Votre commande est maintenant en cours de préparation.'}
                </p>
              </div>
            </div>
            <button onClick={() => setShowSuccessBanner(false)} className="text-green-600 hover:bg-green-200 dark:hover:bg-green-800 p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* Header Section */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight text-on-surface">{t('order_history')}</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2 font-medium">{i18n.language === 'ar' ? 'تتبع سجل وحالة مقتنياتك من ARDCENTER.' : 'Suivez l\'historique et l\'état de vos acquisitions ARDCENTER.'}</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-16 text-center border border-stone-200/50 dark:border-stone-800/50 shadow-sm">
            <span className="material-symbols-outlined text-6xl text-stone-300 mb-6">package_2</span>
            <h2 className="text-2xl font-bold mb-4">{t('no_orders_found')}</h2>
            <p className="text-stone-500 mb-8 max-w-md mx-auto">{i18n.language === 'ar' ? 'تصفح دليلنا للعثور على أفضل المعدات.' : 'Explorez notre catalogue pour trouver le meilleur équipement.'}</p>
            <Link to="/products" className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20">
              {t('explore_catalog')}
              <span className={`material-symbols-outlined ${i18n.language === 'ar' ? 'rotate-180' : ''}`}>arrow_forward</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map((order) => (
              <div key={order.order_num} className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 overflow-hidden hover:shadow-xl hover:shadow-stone-200/20 dark:hover:shadow-black/20 transition-all duration-300">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                        <span className="material-symbols-outlined text-3xl">shopping_bag</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold tracking-tight">{t('account') === 'الحساب' ? 'طلب' : 'Commande'} {order.order_num}</h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.delivery_status)}`}>
                            {getStatusLabel(order.delivery_status)}
                          </span>
                        </div>
                        <p className="text-stone-500 text-sm font-medium">{order.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-none pt-6 md:pt-0">
                      <div className="flex-1 md:text-right">
                        <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">{t('total')}</p>
                        <p className="text-2xl font-black text-primary font-headline">{order.amount}</p>
                      </div>
                      <button 
                        onClick={() => handleOrderClick(order.order_num)}
                        className={`w-12 h-12 rounded-full border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-400 hover:text-primary hover:border-primary transition-all active:scale-90 ${i18n.language === 'ar' ? 'rotate-180' : ''}`}
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="h-1 w-full bg-stone-100 dark:bg-stone-800">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: order.delivery_status === 'Livré' ? '100%' : order.delivery_status === 'En Transit' ? '75%' : order.delivery_status === 'Expédié' ? '50%' : order.delivery_status === 'Préparation' ? '25%' : '0%' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
