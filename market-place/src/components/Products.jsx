import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import Footer from './Footer';

const categoriesData = [
  { id: 'All Products', name: 'nav_marketplace', icon: 'agriculture' },
  { id: 'Plantes', name: 'cat_plants', icon: 'eco' },
  { id: 'Semences', name: 'cat_seeds', icon: 'grass' },
  { id: 'Engrais', name: 'cat_fertilizers', icon: 'science' },
  { id: 'Matériel', name: 'cat_equipment', icon: 'handyman' },
  { id: 'Phytosanitaires', name: 'cat_phytosanitary', icon: 'pest_control' },
  { id: 'Capteurs IoT', name: 'cat_iot', icon: 'sensors' },
];

const Products = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const { addToCart } = useCart();

  const [productsData, setProductsData] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(location.state?.category || 'All Products');
  const [visibleProducts, setVisibleProducts] = useState(8);
  const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || '');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedMin, setAppliedMin] = useState('');
  const [appliedMax, setAppliedMax] = useState('');
  const [sortBy, setSortBy] = useState('Popularity');

  const handleLoadMore = () => {
    setVisibleProducts(prev => prev + 4);
  };

  useEffect(() => {
    setVisibleProducts(8);
  }, [activeCategory]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        setProductsData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setIsLoading(false);
      });

    if (isLoggedIn && user?.id) {
      fetch(`${import.meta.env.VITE_API_URL}/api/wishlist/${user.id}`)
        .then(res => res.json())
        .then(data => setWishlist(data.map(p => p.id)))
        .catch(err => console.error('Error fetching wishlist:', err));
    }
  }, [isLoggedIn, user?.id]);

  const toggleWishlist = async (productId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const isFav = wishlist.includes(productId);
    const method = isFav ? 'DELETE' : 'POST';
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId })
      });
      if (response.ok) {
        if (isFav) {
          setWishlist(wishlist.filter(id => id !== productId));
        } else {
          setWishlist([...wishlist, productId]);
        }
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const success = await addToCart(productId, 1);
  };

  useEffect(() => {
    if (location.state?.category) {
      setActiveCategory(location.state.category);
    }
    if (location.state?.searchTerm) {
      setSearchTerm(location.state.searchTerm);
    }
  }, [location.state]);

  let filteredProducts = activeCategory === 'All Products'
    ? [...productsData]
    : productsData.filter(product => product.category === activeCategory);

  if (appliedMin !== '') {
    filteredProducts = filteredProducts.filter(p => p.numericPrice >= Number(appliedMin));
  }
  if (appliedMax !== '') {
    filteredProducts = filteredProducts.filter(p => p.numericPrice <= Number(appliedMax));
  }
  if (searchTerm.trim() !== '') {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  filteredProducts.sort((a, b) => {
    if (sortBy === t('price_low_high') || sortBy === 'Price: Low to High') return a.numericPrice - b.numericPrice;
    if (sortBy === t('price_high_low') || sortBy === 'Price: High to Low') return b.numericPrice - a.numericPrice;
    if (sortBy === t('newest_arrivals') || sortBy === 'Newest Arrivals') return b.id - a.id;
    return a.id - b.id;
  });

  return (
    <>
      <div className="flex flex-col md:flex-row pt-16 min-h-screen relative bg-stone-100 dark:bg-stone-950">
        {/* Toggle Filters Button for Mobile */}
        <button 
          onClick={() => setShowFilters(true)}
          className="md:hidden fixed bottom-24 right-6 z-[60] bg-primary text-on-primary w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all outline-none"
        >
          <span className="material-symbols-outlined text-2xl">filter_list</span>
        </button>

        {/* SideNavBar / Filter Sidebar - Mobile Drawer Style */}
        <div className={`fixed inset-0 z-[70] md:hidden transition-opacity duration-300 ${showFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)}></div>
        </div>

        <aside className={`
          flex flex-col gap-4 py-8 px-5 shrink-0 z-[110] md:z-10 transition-transform duration-300 ease-in-out
          fixed md:sticky left-0 top-0 md:top-16 lg:top-20 h-full md:h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] 
          bg-stone-100 dark:bg-stone-950 w-4/5 max-w-xs md:w-64 border-r border-stone-200/80 dark:border-stone-800/80 
          overflow-y-auto no-scrollbar
          ${showFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex items-center justify-between md:hidden mb-4 border-b border-stone-200 dark:border-stone-800 pb-4">
            <span className="font-bold text-lg text-primary">{t('filters')}</span>
            <button onClick={() => setShowFilters(false)} className="material-symbols-outlined p-2 text-stone-500">close</button>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-2 px-2">{t('departments')}</p>
            {categoriesData.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); if(window.innerWidth < 768) setShowFilters(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeCategory === cat.id
                    ? 'bg-primary text-on-primary font-bold shadow-md'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                <span className="text-sm font-medium">{t(cat.name)}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">{t('price_range')}</p>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{t('currency')}</span>
            </div>
            <div className="px-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min" className="w-full px-3 py-2.5 bg-white dark:bg-stone-900 shadow-sm border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              <span className="text-stone-300 font-bold">-</span>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max" className="w-full px-3 py-2.5 bg-white dark:bg-stone-900 shadow-sm border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
            </div>
          </div>
          <div className="mt-auto pt-6 border-t border-stone-200/50">
            <button onClick={() => { setAppliedMin(minPrice); setAppliedMax(maxPrice); setShowFilters(false); }} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all">{t('apply_all_filters')}</button>
          </div>
        </aside>

        <main className="flex-1 bg-surface-container-low p-4 md:p-10 pb-32 md:pb-10 overflow-x-hidden">
          {isLoading ? (<div className="flex justify-center items-center h-64"><p className="text-stone-500 font-bold animate-pulse text-lg">{t('loading_market')}</p></div>) : (<>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
              <div className="flex-1 w-full">
                <h1 className="text-2xl md:text-4xl font-headline font-black text-on-surface tracking-tighter mb-1">{t('stock_portfolio')}</h1>
                <p className="text-on-surface-variant font-medium text-xs md:text-sm mb-6 uppercase tracking-wider">{t('inventory_availability')}: {filteredProducts.length} {t('units_found')}</p>
                <div className="relative w-full max-w-xl">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">search</span>
                  <input
                    type="text"
                    placeholder={t('search_ledger')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-stone-900/50 backdrop-blur-sm border-2 border-stone-200 dark:border-stone-800 rounded-2xl pl-12 pr-4 py-4 text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm placeholder:text-stone-400 text-sm md:text-base font-medium"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto bg-stone-100/50 dark:bg-stone-900/50 p-3 px-4 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                <span className="material-symbols-outlined text-stone-400 text-sm">sort</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer flex-1 md:pr-10 text-on-surface truncate">
                  <option>{t('popularity')}</option>
                  <option>{t('price_low_high')}</option>
                  <option>{t('price_high_low')}</option>
                  <option>{t('newest_arrivals')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.slice(0, visibleProducts).map(product => (
                <div key={product.id} className="group flex flex-col h-full bg-surface-container-lowest rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                  <div className="relative aspect-square overflow-hidden bg-surface-dim">
                    <img 
                      className="w-full h-full object-contain transition-transform duration-500" 
                      alt={product.name} 
                      src={product.image?.startsWith('data:') || product.image?.startsWith('http') 
                        ? product.image 
                        : `${import.meta.env.VITE_API_URL}${product.image}`} 
                    />
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-primary">
                      {t(categoriesData.find(c => c.id.toLowerCase() === product.category.toLowerCase())?.name) || product.category}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-headline font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                        {i18n.language.startsWith('ar') && product.name_ar ? product.name_ar : product.name}
                      </h3>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className={`material-symbols-outlined transition-colors ${wishlist.includes(product.id) ? 'text-[#923357]' : 'text-outline hover:text-primary'}`}
                        style={wishlist.includes(product.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        favorite
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${product.availabilityBg || 'bg-secondary-container'} ${product.availabilityText || 'text-on-secondary-container'}`}>{i18n.language.startsWith('ar') && product.availability === 'EN STOCK' ? 'في المخزن' : i18n.language.startsWith('ar') && product.availability === 'INDISPONIBLE' ? 'غير متوفر' : product.availability}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{t('price_label')}</span>
                        <span className="text-xl font-headline font-extrabold text-on-surface">{product.price.replace('DH', t('currency'))}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/product/${product.id}`} title={t('view_details_title')} className="w-10 h-10 flex items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/60 transition-colors active:scale-95 group-hover:shadow-sm">
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </Link>
                        <Link
                          to={`/product/${product.id}`}
                          title={t('add_to_cart_title')}
                          className="w-12 h-12 rounded-lg bg-primary text-on-primary flex items-center justify-center transition-all active:scale-90 group-hover:shadow-lg group-hover:shadow-primary/20"
                        >
                          <span className="material-symbols-outlined">shopping_cart</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length > visibleProducts && (
              <div className="mt-16 flex flex-col items-center gap-6">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-4 bg-primary text-on-primary rounded-md font-bold transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-primary/10"
                >
                  {t('show_more_products')}
                </button>
              </div>
            )}
          </>)}
        </main>
      </div>

      <Footer />
    </>
  );
};

export default Products;
