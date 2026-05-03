import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Footer from './Footer';

const ProductDetails = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { addToCart } = useCart();

  const categoryTranslationKeys = {
    'Plantes': 'cat_plants',
    'Semences': 'cat_seeds',
    'Engrais': 'cat_fertilizers',
    'Matériel': 'cat_equipment',
    'Phytosanitaires': 'cat_phytosanitary',
    'Capteurs IoT': 'cat_iot',
    'Tracteurs': 'cat_tractors',
    'Moissonneuses': 'cat_harvesters',
    'Excavatrices': 'cat_excavators',
    'Matériel de Transport': 'cat_transport',
    'Matériel agricole': 'cat_agri_equipment'
  };
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccessfully, setAddedSuccessfully] = useState(false);
  const { isLoggedIn } = useAuth();

  // Ensure we start at the top of the page when opening details
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
      const data = await response.json();
      if (response.ok) {
        setProduct(data);
        const mainImageUrl = data.image?.startsWith('data:') || data.image?.startsWith('http') 
          ? data.image 
          : `${import.meta.env.VITE_API_URL}${data.image}`;
        setSelectedImage(mainImageUrl);
        // On récupère les produits similaires une fois le produit actuel chargé
        fetchSimilar(data.category, id);
      } else {
        setError(data.error || 'Produit non trouvé');
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSimilar = async (category, currentId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
      const allProducts = await response.json();
      if (response.ok) {
        // Filtrer par catégorie et exclure le produit actuel
        const similar = allProducts
          .filter(p => p.category === category && p.id.toString() !== currentId.toString())
          .slice(0, 4);
        setSimilarProducts(similar);
      }
    } catch (err) {
      console.error('Error fetching similar products:', err);
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      alert(i18n.language.startsWith('ar') ? 'يرجى تسجيل الدخول أولاً لإضافة منتجات إلى السلة' : 'Veuillez vous connecter pour ajouter des produits au panier');
      return;
    }
    
    setIsAdding(true);
    const success = await addToCart(product.id);
    if (success) {
      setAddedSuccessfully(true);
      setTimeout(() => setAddedSuccessfully(false), 3000);
    }
    setIsAdding(false);
  };

  if (isLoading) {
    return (
      <div className="pt-32 pb-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-stone-500 font-bold">{t('loading_details') || "Chargement..."}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pt-32 pb-20 text-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{error || 'Produit introuvable'}</h2>
        <Link to="/products" className="text-primary hover:underline font-bold">{t('back_to_catalog')}</Link>
      </div>
    );
  }

  const gallery = product.images_gallery ? JSON.parse(product.images_gallery) : [];
  const allImages = [
    product.image?.startsWith('data:') || product.image?.startsWith('http') 
      ? product.image 
      : `${import.meta.env.VITE_API_URL}${product.image}`,
    ...gallery.map(img => img.startsWith('data:') || img.startsWith('http') ? img : `${import.meta.env.VITE_API_URL}${img}`)
  ];

  let technicalSpecs = [];
  if (product.technical_specs) {
    try {
      technicalSpecs = JSON.parse(product.technical_specs);
    } catch (e) {
      console.error('Error parsing technical_specs', e);
    }
  }

  let technicalSpecsAr = [];
  if (product.technical_specs_ar) {
    try {
      technicalSpecsAr = JSON.parse(product.technical_specs_ar);
    } catch (e) {
      console.error('Error parsing technical_specs_ar', e);
    }
  }

  return (
    <>
      <main className="pt-24 pb-32 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm font-label text-stone-500 dark:text-stone-400 gap-2 items-center">
          <Link className="hover:text-primary transition-colors font-medium" to="/products">{t('nav_marketplace')}</Link>
          <span className={`material-symbols-outlined text-xs ${i18n.language.startsWith('ar') ? 'rotate-180' : ''}`}>chevron_right</span>
          <span className="hover:text-primary transition-colors font-medium">{product.category}</span>
          <span className={`material-symbols-outlined text-xs ${i18n.language.startsWith('ar') ? 'rotate-180' : ''}`}>chevron_right</span>
          <span className="font-bold text-stone-900 dark:text-stone-50">
            {i18n.language.startsWith('ar') && product.name_ar ? product.name_ar : product.name}
          </span>
        </nav>
        
        {/* Product Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Gallery: Asymmetric Layout */}
          <div className="lg:col-span-7 grid grid-cols-6 gap-4">
            <div className="col-span-6 overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-900 shadow-sm border border-stone-200/50 h-[500px]">
              <img 
                className="w-full h-full object-contain transition-transform duration-700" 
                alt={product.name} 
                src={selectedImage} 
              />
            </div>
            
            {/* Gallery Thumbnails */}
            <div className="col-span-6 grid grid-cols-5 gap-3 mt-2">
              {allImages.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square overflow-hidden rounded-lg cursor-pointer transition-all border-2 ${selectedImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img className="w-full h-full object-contain" src={img} alt={`View ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Purchase Controls */}
          <div className="lg:col-span-5 flex flex-col pt-2">
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                product.availability === 'In Stock' 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}>
                {t('in_stock')} - {t('ready_for_delivery')}
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-stone-900 dark:text-stone-50 mb-4 leading-tight font-headline tracking-tight">
              {i18n.language.startsWith('ar') && product.name_ar ? product.name_ar : product.name}
            </h1>
            <p className="text-stone-600 dark:text-stone-300 text-lg mb-8 leading-relaxed font-medium">
              {i18n.language.startsWith('ar')
                ? (product.short_description_ar || product.short_description || (product.category === 'Phytosanitaires' || product.category === 'Engrais' ? '' : product.description) || t('product_description_fallback', { category: product.category }))
                : (product.short_description || (product.category === 'Phytosanitaires' || product.category === 'Engrais' ? '' : product.description) || t('product_description_fallback', { category: product.category }))}
            </p>
            <div className="mb-10">
              <div className="text-sm font-bold text-stone-500 mb-1 uppercase tracking-widest">{t('investment_price')}</div>
              <div className="text-5xl font-black text-stone-900 dark:text-stone-50 font-headline">
                {product.price}
              </div>
            </div>
            <div className="space-y-4">
              <button 
                onClick={handleAddToCart}
                disabled={isAdding}
                className={`w-full h-14 font-bold text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98] ${
                  addedSuccessfully 
                    ? 'bg-green-100 text-green-800 border-2 border-green-200' 
                    : 'bg-gradient-to-r from-green-800 to-green-700 dark:from-green-700 dark:to-green-600 text-white hover:opacity-90 hover:shadow-green-900/20'
                }`}
              >
                {isAdding ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : addedSuccessfully ? (
                  <>
                    <span className="material-symbols-outlined">done_all</span>
                    {i18n.language.startsWith('ar') ? 'تمت الإضافة !' : 'Ajouté !'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">shopping_cart</span>
                    {t('add_to_cart')}
                  </>
                )}
              </button>
              
              {!isLoggedIn && (
                <p className="text-xs text-center text-stone-500 font-medium animate-pulse">
                  {i18n.language.startsWith('ar') ? 'سجل الدخول للمتابعة' : 'Connectez-vous pour continuer'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs System for Details and Technical Specs */}
        <section className="mt-20">
          <div className="flex border-b border-stone-200 dark:border-stone-800 mb-10 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('details')}
              className={`px-8 py-4 font-bold text-sm uppercase tracking-widest transition-all relative shrink-0 ${activeTab === 'details' ? 'text-primary' : 'text-stone-400 hover:text-stone-600'}`}
            >
              {i18n.language.startsWith('ar') ? 'التفاصيل' : 'Détails'}
              {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
            </button>
            {(technicalSpecs.length > 0 || technicalSpecsAr.length > 0) && (
              <button 
                onClick={() => setActiveTab('specifications')}
                className={`px-8 py-4 font-bold text-sm uppercase tracking-widest transition-all relative shrink-0 ${activeTab === 'specifications' ? 'text-primary' : 'text-stone-400 hover:text-stone-600'}`}
              >
                {i18n.language.startsWith('ar') ? 'المواصفات التقنية' : 'Fiche Technique'}
                {activeTab === 'specifications' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
              </button>
            )}
          </div>

          <div className="min-h-[300px]">
            {activeTab === 'details' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-10">
                    <div>
                      <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-3">
                        <span className="w-8 h-1 bg-primary rounded-full"></span>
                        {i18n.language.startsWith('ar') ? 'وصف تفصيلي' : 'Description Détaillée'}
                      </h3>
                      <div className="text-stone-600 dark:text-stone-400 leading-loose text-lg whitespace-pre-line space-y-4">
                        {i18n.language.startsWith('ar') && product.description_ar 
                          ? product.description_ar 
                          : (product.description || t('product_description_fallback'))}
                      </div>
                    </div>
                    
                    {(product.advantages || product.advantages_ar) && (
                      <div className="pt-8 border-t border-stone-100 dark:border-stone-800">
                        <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-6">
                          {i18n.language.startsWith('ar') ? 'المزايا الرئيسية' : 'Avantages Clés'}
                        </h4>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line">
                          {i18n.language.startsWith('ar') && product.advantages_ar ? product.advantages_ar : product.advantages}
                        </p>
                      </div>
                    )}

                    {(product.usage_tips || product.usage_tips_ar) && (
                      <div className="pt-8 border-t border-stone-100 dark:border-stone-800">
                        <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-6">
                          {i18n.language.startsWith('ar') ? 'إرشادات الاستخدام' : 'Conseils d\'utilisation'}
                        </h4>
                        <p className="text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/40">
                          {i18n.language.startsWith('ar') && product.usage_tips_ar ? product.usage_tips_ar : product.usage_tips}
                        </p>
                      </div>
                    )}

                    {!product.advantages && !product.usage_tips && product.category !== 'Phytosanitaires' && product.category !== 'Engrais' && (
                      <div className="pt-8 border-t border-stone-100 dark:border-stone-800">
                        <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-6">{i18n.language.startsWith('ar') ? 'المزايا الرئيسية' : 'Points Forts & Avantages'}</h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { icon: 'check_circle', text: i18n.language.startsWith('ar') ? 'كفاءة طاقة متطورة' : 'Efficacité énergétique avancée' },
                            { icon: 'verified', text: i18n.language.startsWith('ar') ? 'معايير جودة دولية' : 'Normes de qualité internationales' },
                            { icon: 'eco', text: i18n.language.startsWith('ar') ? 'صديق للبيئة ومستدام' : 'Soutien à l\'agriculture durable' },
                            { icon: 'support_agent', text: i18n.language.startsWith('ar') ? 'دعم فني مخصص' : 'Support technique dédié' }
                          ].map((point, i) => (
                            <li key={i} className="flex items-center gap-3 text-stone-600 dark:text-stone-400">
                              <span className="material-symbols-outlined text-primary text-xl">{point.icon}</span>
                              <span className="font-medium">{point.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="p-8 bg-stone-50 dark:bg-stone-900 rounded-3xl border border-stone-200/50 dark:border-stone-800 sticky top-32">
                      <h4 className="text-sm font-black uppercase tracking-widest text-stone-400 mb-6">{i18n.language.startsWith('ar') ? 'ملخص سريع' : 'Fiche Express'}</h4>
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-xl">category</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{i18n.language.startsWith('ar') ? 'الفئة' : 'Catégorie'}</p>
                            <p className="font-bold text-stone-900 dark:text-stone-50">{t(categoryTranslationKeys[product.category] || product.category)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-xl">inventory_2</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{i18n.language.startsWith('ar') ? 'الحالة' : 'État'}</p>
                            <p className="font-bold text-stone-900 dark:text-stone-50">{i18n.language.startsWith('ar') ? 'جديد / أصلي' : 'Neuf / Original'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{i18n.language.startsWith('ar') ? 'التسليم' : 'Livraison'}</p>
                            <p className="font-bold text-stone-900 dark:text-stone-50">{i18n.language.startsWith('ar') ? 'متاح فورا' : 'Disponible immédiatement'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-900">
                      <th className="px-8 py-5 text-sm font-black uppercase tracking-widest text-stone-400 border-b border-stone-200 dark:border-stone-800">{i18n.language.startsWith('ar') ? 'الميزة' : 'Caractéristique'}</th>
                      <th className="px-8 py-5 text-sm font-black uppercase tracking-widest text-stone-400 border-b border-stone-200 dark:border-stone-800">{i18n.language.startsWith('ar') ? 'القيمة' : 'Valeur'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {i18n.language.startsWith('ar') && technicalSpecsAr.length > 0 ? (
                      technicalSpecsAr.map((spec, index) => (
                        <tr key={index}>
                          <td className="px-8 py-5 font-bold text-stone-500 text-right" dir="rtl">{spec.name}</td>
                          <td className="px-8 py-5 font-medium text-stone-900 dark:text-stone-50 text-right" dir="rtl">{spec.value}</td>
                        </tr>
                      ))
                    ) : technicalSpecs.length > 0 ? (
                      technicalSpecs.map((spec, index) => (
                        <tr key={index}>
                          <td className="px-8 py-5 font-bold text-stone-500">{spec.name}</td>
                          <td className="px-8 py-5 font-medium text-stone-900 dark:text-stone-50">{spec.value}</td>
                        </tr>
                      ))
                    ) : (
                      <>
                        {/* Dynamic Specs based on category (Fallback) */}
                        {product.category === 'Tracteurs' || product.category === 'Matériel' ? (
                          <>
                            <tr><td className="px-8 py-5 font-bold text-stone-500">{i18n.language.startsWith('ar') ? 'القوة' : 'Puissance'}</td><td className="px-8 py-5 font-medium text-stone-900 dark:text-stone-50">75 - 450 HP</td></tr>
                            <tr><td className="px-8 py-5 font-bold text-stone-500">{i18n.language.startsWith('ar') ? 'الضمان' : 'Garantie'}</td><td className="px-8 py-5 font-medium text-stone-900 dark:text-stone-50">24 Mois / 2000 h</td></tr>
                            <tr><td className="px-8 py-5 font-bold text-stone-500">{i18n.language.startsWith('ar') ? 'الصناعة' : 'Origine'}</td><td className="px-8 py-5 font-medium text-stone-900 dark:text-stone-50">Union Européenne</td></tr>
                          </>
                        ) : product.category === 'Semences' ? (
                          <>
                            <tr><td className="px-8 py-5 font-bold text-stone-500">{i18n.language.startsWith('ar') ? 'النقاء' : 'Pureté'}</td><td className="px-8 py-5 font-medium text-stone-900 dark:text-stone-50">99.9%</td></tr>
                            <tr><td className="px-8 py-5 font-bold text-stone-500">{i18n.language.startsWith('ar') ? 'نسبة الإنبات' : 'Taux de germination'}</td><td className="px-8 py-5 font-medium text-stone-900 dark:text-stone-50">&gt; 92%</td></tr>
                            <tr><td className="px-8 py-5 font-bold text-stone-500">{i18n.language.startsWith('ar') ? 'سنة الإنتاج' : 'Année de production'}</td><td className="px-8 py-5 font-medium text-stone-900 dark:text-stone-50">2023 - 2024</td></tr>
                          </>
                        ) : (
                          <>
                            <tr><td className="px-8 py-5 font-bold text-stone-500">{i18n.language.startsWith('ar') ? 'الوزن' : 'Poids'}</td><td className="px-8 py-5 font-medium text-stone-900 dark:text-stone-50">Variable</td></tr>
                            <tr><td className="px-8 py-5 font-bold text-stone-500">{i18n.language.startsWith('ar') ? 'الشهادة' : 'Certification'}</td><td className="px-8 py-5 font-medium text-stone-900 dark:text-stone-50">ISO 9001 / AgriCert</td></tr>
                            <tr><td className="px-8 py-5 font-bold text-stone-500">{i18n.language.startsWith('ar') ? 'المنشأ' : 'Provenance'}</td><td className="px-8 py-5 font-medium text-stone-900 dark:text-stone-50">Certifié Maroc</td></tr>
                          </>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Similar Products with distinct background */}
      <section className="bg-stone-100/80 dark:bg-stone-900/50 py-24 border-t border-stone-200/50 dark:border-stone-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-stone-900 dark:text-stone-50 font-headline mb-12 tracking-tight">{t('other_products')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {similarProducts.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="group block cursor-pointer">
                <div className="aspect-square bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800/50 mb-5 overflow-hidden rounded-2xl group-hover:shadow-2xl group-hover:shadow-primary/10 transition-all duration-300">
                  <img 
                    className="w-full h-full object-contain transition-transform duration-700" 
                    alt={p.name} 
                    src={p.image?.startsWith('data:') || p.image?.startsWith('http') 
                      ? p.image 
                      : `${import.meta.env.VITE_API_URL}${p.image}`} 
                  />
                </div>
                <h5 className="font-bold text-stone-900 dark:text-stone-50 text-lg mb-1 group-hover:text-primary transition-colors">
                  {i18n.language.startsWith('ar') && p.name_ar ? p.name_ar : p.name}
                </h5>
                <p className="text-sm font-black text-primary">{p.price.replace('DH', t('currency'))}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default ProductDetails;
