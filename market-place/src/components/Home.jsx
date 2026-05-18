import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Footer from './Footer';
import WeatherWidget from './WeatherWidget';
import './home.css';

const Home = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const categoryTranslationKeys = {
    'Plantes': 'cat_plants',
    'Semences': 'cat_seeds',
    'Engrais': 'cat_fertilizers',
    'Matériel': 'cat_equipment',
    'Phytosanitaires': 'cat_phytosanitary',
    'Capteurs IoT': 'cat_iot',
    'Tracteurs': 'cat_tractors',
    'Excavatrices': 'cat_excavators',
    'Moissonneuses': 'cat_harvesters',
    'Matériel de Transport': 'cat_transport',
    'Matériel agricole': 'cat_agri_equipment'
  };

  const [searchQuery, setSearchQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [allProducts, setAllProducts] = React.useState([]);
  const navigate = useNavigate();
  const searchRef = React.useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(res => res.json())
      .then(data => setAllProducts(data))
      .catch(err => console.error('Error fetching products for search:', err));

    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/products', { state: { searchTerm: searchQuery } });
      setShowSuggestions(false);
    } else {
      navigate('/products');
    }
  };

  const onSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length > 1) {
      const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(val.toLowerCase()) ||
        p.category.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    if (location.hash === '#services') {
      const element = document.getElementById('services');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <>
      <main className="pt-20">
        {/* Hero Section with Search */}
        <section className="relative h-[600px] flex items-center justify-center z-20">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img className="w-full h-full object-cover" data-alt="vast rolling hills of a wheat field at sunrise with golden morning light and mist in the distance" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjku8HWOkw4IiywAKkX8RHuZTAcp7lrkb8U7Q16KafsYcrUPiSoQ6VuA-JC7xpslJYCJlbHoOgPR8E0wLV9u7vbkfdJRVaRwfHihNwdsyJnAsYOeQOTbBJj2viCds7LSnoRATRcMZJNMFEqRGIPLIPaN3H8kv_pvk63arm6ImiSNyh5H2_6VxM5V90W2CzhBA6xb1DbbUJyXxh15bDBLn3NpWOFbrh16YRaZqQ5cJf_s4-53T8uUgGWsL51-8LLfnS-lrPi1pHyEg" />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
          <div className="relative z-10 w-full max-w-4xl px-6 text-center">
            <h1 className="text-4xl md:text-7xl font-extrabold text-white mb-4 md:mb-6 tracking-tight leading-tight">{t('hero_title')}</h1>
            <p className="text-base md:text-xl text-white/90 mb-8 md:mb-10 max-w-2xl mx-auto px-2">{t('hero_subtitle')}</p>
            <div ref={searchRef} className={`bg-white/10 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border transition-all duration-500 mx-auto max-w-lg md:max-w-none ${showSuggestions ? 'border-primary/50' : 'border-white/20'}`}>
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-2 p-1 md:p-0 relative">
                <div className="flex-1 w-full relative">
                  <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchQuery ? 'text-primary' : 'text-stone-400'}`}>
                    {searchQuery ? 'search_check' : 'search'}
                  </span>
                  <input 
                    className="w-full pl-12 pr-4 py-3 md:py-4 bg-white rounded-xl border-none focus:ring-2 focus:ring-primary text-on-surface text-sm md:text-base outline-none transition-all placeholder:text-stone-400" 
                    placeholder={t('search_placeholder')} 
                    type="text" 
                    value={searchQuery}
                    onChange={onSearchChange}
                    onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                  />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">cancel</span>
                    </button>
                  )}
                </div>
                <button type="submit" className="group w-full md:w-auto px-8 md:px-10 py-3 md:py-4 bg-primary text-on-primary rounded-xl font-bold text-base md:text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                  {t('find_button')}
                  <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200/50 dark:border-stone-800/50 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 px-4 py-2">Suggestions</p>
                      {suggestions.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            setSearchQuery(product.name);
                            setShowSuggestions(false);
                            navigate(`/product/${product.id}`);
                          }}
                          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors rounded-xl text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-stone-900 dark:text-stone-50 truncate">{product.name}</p>
                            <p className="text-xs text-stone-500 truncate">{product.category}</p>
                          </div>
                          <span className="material-symbols-outlined text-stone-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">north_west</span>
                        </button>
                      ))}
                      <button 
                        onClick={handleSearch}
                        className="w-full p-3 text-center text-primary font-bold text-xs hover:bg-primary/5 transition-colors rounded-xl border-t border-stone-100 dark:border-stone-800 mt-1"
                      >
                        Voir tous les résultats pour "{searchQuery}"
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Categories Bento Grid */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex items-end justify-between mb-12">
            <div className="max-w-xl">
              <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-2 block">{t('departments')}</span>
              <h2 className="text-4xl font-bold text-on-surface tracking-tight">{t('ecosystem_essentials')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <Link to="/products" state={{ category: 'Plantes' }} className="group relative aspect-square lg:aspect-auto lg:h-64 bg-surface-container-low rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-primary mb-3">eco</span>
                <span className="font-bold text-on-surface-variant">{t('cat_plants')}</span>
              </div>
            </Link>
            <Link to="/products" state={{ category: 'Semences' }} className="group relative aspect-square lg:aspect-auto lg:h-64 bg-primary-container/10 rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-primary mb-3">grass</span>
                <span className="font-bold text-on-surface-variant">{t('cat_seeds')}</span>
              </div>
            </Link>
            <Link to="/products" state={{ category: 'Engrais' }} className="group relative aspect-square lg:aspect-auto lg:h-64 bg-surface-container-low rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-primary mb-3">science</span>
                <span className="font-bold text-on-surface-variant">{t('cat_fertilizers')}</span>
              </div>
            </Link>
            <Link to="/products" state={{ category: 'Matériel' }} className="group relative aspect-square lg:aspect-auto lg:h-64 bg-surface-container-low rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-primary mb-3">handyman</span>
                <span className="font-bold text-on-surface-variant">{t('cat_equipment')}</span>
              </div>
            </Link>
            <Link to="/products" state={{ category: 'Phytosanitaires' }} className="group relative aspect-square lg:aspect-auto lg:h-64 bg-surface-container-low rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-primary mb-3">pest_control</span>
                <span className="font-bold text-on-surface-variant">{t('cat_phytosanitary')}</span>
              </div>
            </Link>
            <Link to="/products" state={{ category: 'Capteurs IoT' }} className="group relative aspect-square lg:aspect-auto lg:h-64 bg-tertiary-container/10 rounded-xl overflow-hidden hover:translate-y-[-4px] transition-all">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-tertiary mb-3">sensors</span>
                <span className="font-bold text-on-surface-variant">{t('cat_iot')}</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Weather Widget & Recommendations Asymmetric Section */}
        <section id="services" className="bg-surface-container-low py-24">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Weather Widget */}
            <div className="lg:col-span-4 space-y-6">
              <WeatherWidget />
            </div>

            {/* Recommendations */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold tracking-tight">{t('other_services')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="relative h-48">
                    <Link to="/plant-disease-detection" className="block w-full h-full">
                      <img className="w-full h-full object-cover transition-transform duration-500" alt="Plant disease detection AI service" src="https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=800&auto=format&fit=crop" />
                    </Link>
                    <div className="absolute top-4 left-4 bg-tertiary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">{t('new_service')}</div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h4 className="font-bold text-lg mb-1">{t('plant_disease_title')}</h4>
                    <p className="text-sm text-on-surface-variant mb-4 flex-1">{t('plant_disease_desc')}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-primary font-bold uppercase text-xs tracking-widest">{t('free_try')}</span>
                      <Link to="/plant-disease-detection" className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-full inline-block hover:scale-105 transition-transform">arrow_forward</Link>
                    </div>
                  </div>
                </div>

                <div className="group bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="relative h-48">
                    <Link to="/machine-rental" className="block w-full h-full">
                      <img className="w-full h-full object-contain transition-transform duration-500" alt="Machine Rental Service - tracteur et machines industrielles disponibles à la location" src="/machine_rental_service.png" />
                    </Link>
                    <div className="absolute top-4 left-4 bg-tertiary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">{t('location_label')}</div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h4 className="font-bold text-lg mb-1">{t('rental_machine')}</h4>
                    <p className="text-sm text-on-surface-variant mb-4 flex-1">{i18n.language === 'ar' ? 'كراء مرن للآلات الزراعية والصناعية.' : 'Flexible rental of agricultural and industrial machines.'}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-primary font-bold uppercase text-xs tracking-widest"></span>
                      <Link to="/machine-rental" className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-full inline-block hover:scale-105 transition-transform">add_shopping_cart</Link>
                    </div>
                  </div>
                </div>

                <div className="group bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="relative h-48">
                    <Link to="/experts" className="block w-full h-full">
                      <img className="w-full h-full object-cover transition-transform duration-500" alt="Expert consultation service" src="/experts/expert_service_home_1777854506061.png" />
                    </Link>
                    <div className="absolute top-4 left-4 bg-tertiary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">{i18n.language === 'ar' ? 'خدمة جديدة' : 'Nouveau'}</div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h4 className="font-bold text-lg mb-1">{i18n.language === 'ar' ? 'خدمة الخبراء الزراعيين' : 'Service des Experts'}</h4>
                    <p className="text-sm text-on-surface-variant mb-4 flex-1">{i18n.language === 'ar' ? 'استشر خبراء زراعيين معتمدين واحصل على نصائح متخصصة.' : 'Consultez des experts certifiés et obtenez des conseils spécialisés.'}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-primary font-bold uppercase text-xs tracking-widest">{i18n.language === 'ar' ? 'تواصل الآن' : 'Contacter'}</span>
                      <Link to="/experts" className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-full inline-block hover:scale-105 transition-transform">chat</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Products Grid */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="mb-12">
            <h2 className="text-4xl font-bold tracking-tight mb-2">{t('marketplace_leaders')}</h2>
            <p className="text-on-surface-variant font-medium">{t('trending_subtitle')}</p>
          </div>
          
          {allProducts.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-stone-200 dark:bg-stone-800 rounded-xl mb-4"></div>
                  <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/3 mb-2"></div>
                  <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {allProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="flex flex-col group">
                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-surface-container mb-4 relative">
                    <img 
                      className="w-full h-full object-contain transition-transform duration-700" 
                      alt={product.name} 
                      src={product.image?.startsWith('data:') || product.image?.startsWith('http') 
                        ? product.image 
                        : `${import.meta.env.VITE_API_URL}${product.image}`} 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500"></div>
                    <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <Link to={`/product/${product.id}`} className="bg-white/90 backdrop-blur p-3 rounded-full shadow-lg text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-110">
                        <span className="material-symbols-outlined text-xl font-bold">visibility</span>
                      </Link>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-tertiary uppercase mb-1 tracking-widest">
                    {t(categoryTranslationKeys[product.category]) || product.category}
                  </span>
                  <Link to={`/product/${product.id}`} className="font-bold text-lg hover:text-primary transition-colors line-clamp-1">
                    {i18n.language.startsWith('ar') && product.name_ar ? product.name_ar : product.name}
                  </Link>
                  <p className="text-primary font-black mt-2 text-xl">{product.price.replace('DH', t('currency'))}</p>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <Footer />

    </>
  );
};

export default Home;
