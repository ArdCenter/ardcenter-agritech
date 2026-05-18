import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import Footer from './Footer';

const MachineRental = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const { addToCart } = useCart();
  
  const [rentals, setRentals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // We initialize all categories to be selected
  const availableCategories = ['Tracteurs', 'Moissonneuses', 'Excavatrices', 'Matériel de Transport', 'Matériel agricole'];
  const [selectedCats, setSelectedCats] = useState(new Set(availableCategories));
  const [duration, setDuration] = useState('jour'); // 'jour', 'semaine', 'mois'

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

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/rentals`)
      .then(res => res.json())
      .then(data => {
        setRentals(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching rentals:', err);
        setIsLoading(false);
      });
  }, []);

  const toggleCat = (cat) => {
    setSelectedCats(prev => {
        const next = new Set(prev);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        return next;
    });
  };

  const handleBookMachine = (productId) => {
    navigate(`/machine-rental/${productId}/booking`);
  };

  const filteredRentals = rentals.filter(r => selectedCats.has(r.category));

  return (
    <div className="bg-background text-on-surface min-h-screen">
      <main className="pt-24 pb-32 px-6 max-w-screen-2xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar Filter */}
        <aside className="w-full md:w-80 flex-shrink-0">
          <div className="sticky top-24 z-10 space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold text-primary mb-2 leading-tight">{t('machine_rental_title')}</h1>
              <p className="text-on-surface-variant text-sm font-body">ARDCENTER — Precision Earth Fleet</p>
            </div>
            <div className="bg-surface-container-low p-6 rounded-xl space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">{t('departments')}</h3>
                <div className="space-y-3">
                  {availableCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        checked={selectedCats.has(cat)} 
                        onChange={() => toggleCat(cat)} 
                        className="rounded border-outline-variant text-primary focus:ring-primary h-5 w-5" 
                        type="checkbox"
                      />
                      <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">{t(getCategoryKey(cat))}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="h-px bg-outline-variant/15"></div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">{t('rental_duration')}</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={() => setDuration('jour')}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all ${duration === 'jour' ? 'bg-surface-container-highest font-bold text-primary' : 'bg-white/50 font-medium text-on-surface-variant hover:bg-surface-container-highest'}`}
                  >
                    {t('day')} {duration === 'jour' && <span className="material-symbols-outlined text-sm">check_circle</span>}
                  </button>
                  <button 
                    onClick={() => setDuration('semaine')}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all ${duration === 'semaine' ? 'bg-surface-container-highest font-bold text-primary' : 'bg-white/50 font-medium text-on-surface-variant hover:bg-surface-container-highest'}`}
                  >
                    {t('week')} {duration === 'semaine' && <span className="material-symbols-outlined text-sm">check_circle</span>}
                  </button>
                  <button 
                    onClick={() => setDuration('mois')}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all ${duration === 'mois' ? 'bg-surface-container-highest font-bold text-primary' : 'bg-white/50 font-medium text-on-surface-variant hover:bg-surface-container-highest'}`}
                  >
                    {t('month')} {duration === 'mois' && <span className="material-symbols-outlined text-sm">check_circle</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-stone-500 font-bold animate-pulse text-lg">{t('loading_details')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredRentals.length === 0 && (
                <div className="col-span-1 lg:col-span-2 text-center py-10">
                  <p className="text-on-surface-variant">{t('no_machines_found')}</p>
                </div>
              )}
              {filteredRentals.map((product) => {
                const isUnavailable = product.availability === 'RESERVÉ' || product.availability === 'INDISPONIBLE';
                
                return (
                <div key={product.id} className="group flex flex-col bg-surface-container-low rounded-xl overflow-hidden hover:shadow-[0px_12px_32px_rgba(26,28,25,0.06)] transition-all duration-300">
                  <div className="relative h-72 overflow-hidden">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={product.name} src={product.image} />
                    <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-sm text-[10px] font-extrabold tracking-widest uppercase">
                      {t(getCategoryKey(product.category))}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg">
                      {(() => {
                        let parsedPrices = {};
                        try {
                            if (product.rental_prices) parsedPrices = typeof product.rental_prices === 'string' ? JSON.parse(product.rental_prices) : product.rental_prices;
                        } catch(e) {}
                        
                        if (product.numericPrice === 0 || product.price === 'Sur demande') {
                          return <span className="text-xl font-extrabold text-on-surface">Sur demande</span>;
                        }
                        
                        const periodKey = duration === 'jour' ? 'Jour' : duration === 'semaine' ? 'Semaine' : 'Mois';
                        if (parsedPrices[periodKey] && parsedPrices[periodKey] !== "") {
                           return (
                             <>
                               <span className="text-xl font-extrabold text-on-surface">
                                 {Number(parsedPrices[periodKey]).toLocaleString()} {t('currency')}
                               </span>
                               <span className="text-xs font-medium text-on-surface-variant">
                                 {` / ${t(duration)}`}
                               </span>
                             </>
                           );
                        }
                        
                        return (
                          <>
                            <span className="text-xl font-extrabold text-on-surface">
                              {duration === 'semaine' ? (product.numericPrice * 7).toLocaleString() : duration === 'mois' ? (product.numericPrice * 30).toLocaleString() : product.numericPrice.toLocaleString()} {t('currency')}
                            </span>
                            <span className="text-xs font-medium text-on-surface-variant">
                              {duration === 'semaine' ? ` / ${t('week')}` : duration === 'mois' ? ` / ${t('month')}` : ` / ${t('day')}`}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-on-surface leading-tight">
                          {i18n.language === 'ar' && product.name_ar ? product.name_ar : product.name}
                        </h3>
                        <p className="text-secondary font-medium text-sm mb-1">{t(getCategoryKey(product.category))}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${product.availabilityBg || 'bg-secondary-fixed-dim'} ${product.availabilityText || 'text-on-secondary-fixed-variant'}`}>
                        {product.availability === 'DISPONIBLE' ? t('in_stock') : (i18n.language === 'ar' ? 'غير متوفر' : product.availability)}
                      </span>
                    </div>
                    
                    <div className="mt-auto">
                      {isUnavailable ? (
                        <button disabled className="w-full h-[56px] bg-outline-variant/30 text-on-surface-variant cursor-not-allowed rounded-md font-bold tracking-tight uppercase">{i18n.language === 'ar' ? 'غير متوفر' : 'INDISPONIBLE'}</button>
                      ) : (
                        <button onClick={() => handleBookMachine(product.id)} className="w-full h-[56px] bg-gradient-to-r from-primary to-primary-container text-white rounded-md font-bold tracking-tight active:scale-95 transition-all uppercase">
                          {t('rent_machine')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MachineRental;
