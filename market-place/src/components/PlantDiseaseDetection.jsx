import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Footer from './Footer';

const diseaseToProduct = {
  'Olive_Peacock_Spot': { id: 33, whyKey: 'reco_olive_peacock_spot_why' },
  'Olive_Aculus_Olearius': { id: 21, whyKey: 'reco_olive_aculus_olearius_why' },
  'Tomato_Late_Blight': { id: 31, whyKey: 'reco_tomato_late_blight_why' },
  'Tomato_Spider_Mite': { id: 21, whyKey: 'reco_tomato_spider_mite_why' }
};

const PlantDiseaseDetection = () => {
  const { t, i18n } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recommendedProduct, setRecommendedProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [confidence, setConfidence] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setConfidence(null);
    }
  };

  const handlePredict = async () => {
    if (!selectedImage) return;

    setLoading(true);
    setError(null);
    setRecommendedProduct(null);
    
    const formData = new FormData();
    formData.append("file", selectedImage);

    try {
      // URL par défaut de l'API locale (à remplacer en prod via variables d'environnement)
      const apiUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la communication avec le serveur IA.');
      }

      const data = await response.json();
      setResult(data.prediction);
      setConfidence(data.confidence);

      // Fetch recommended product if disease detected
      const diseaseKey = Object.keys(diseaseToProduct).find(k => data.prediction?.includes(k));
      if (diseaseKey) {
        fetchProduct(diseaseToProduct[diseaseKey].id);
      }
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProduct = async (productId) => {
    setLoadingProduct(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendedProduct(data);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoadingProduct(false);
    }
  };

  const formatDiseaseName = (rawName) => {
    if (!rawName) return "";
    if (rawName.includes('_Healthy')) {
      return t('healthy_plant');
    }
    
    // Mapping des maladies spécifiques
    if (rawName.includes('Olive_Peacock_Spot')) return t('disease_olive_peacock_spot');
    if (rawName.includes('Olive_Aculus_Olearius')) return t('disease_olive_aculus_olearius');
    if (rawName.includes('Tomato_Late_Blight')) return t('disease_tomato_late_blight');
    if (rawName.includes('Tomato_Spider_Mite')) return t('disease_tomato_spider_mite');

    return rawName.replace(/_/g, ' ');
  };

  const getDiseaseDescription = (rawName) => {
    if (!rawName) return "";
    if (rawName.includes('_Healthy')) return t('desc_healthy');
    
    if (rawName.includes('Olive_Peacock_Spot')) return t('desc_olive_peacock_spot');
    if (rawName.includes('Olive_Aculus_Olearius')) return t('desc_olive_aculus_olearius');
    if (rawName.includes('Tomato_Late_Blight')) return t('desc_tomato_late_blight');
    if (rawName.includes('Tomato_Spider_Mite')) return t('desc_tomato_spider_mite');

    return t('disease_detected');
  };

  const getRecommendations = (rawName) => {
    if (!rawName || rawName.includes('_Healthy')) return null;
    
    if (rawName.includes('Olive_Peacock_Spot')) return t('reco_olive_peacock_spot');
    if (rawName.includes('Olive_Aculus_Olearius')) return t('reco_olive_aculus_olearius');
    if (rawName.includes('Tomato_Late_Blight')) return t('reco_tomato_late_blight');
    if (rawName.includes('Tomato_Spider_Mite')) return t('reco_tomato_spider_mite');

    return null;
  };

  const isHealthy = result?.includes('_Healthy');

  return (
    <main className="pt-24 pb-12 min-h-screen bg-stone-50/50">
      <div className="max-w-6xl mx-auto px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-primary transition-colors mb-6 font-medium">
          <span className="material-symbols-outlined">arrow_back</span>
          {t('back_to_catalog') || "Retour"}
        </Link>

        <div className="bg-white rounded-[40px] shadow-2xl shadow-stone-200/50 overflow-hidden border border-stone-200/60">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-8 md:p-10 text-center border-b border-stone-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 text-primary mb-4 shadow-inner">
              <span className="material-symbols-outlined text-3xl">psychiatry</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-on-surface mb-3 tracking-tight">{t('plant_disease_title')}</h1>
            <p className="text-stone-500 max-w-2xl mx-auto text-sm font-medium">{t('plant_disease_desc')}</p>
          </div>

          <div className="p-6 md:p-10">
            {!result ? (
              <div className="flex flex-col md:flex-row gap-8 items-stretch">
                {/* Upload Section */}
                <div className="flex-1 space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px]">01</span>
                    {t('upload_image')}
                  </h3>
                  
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`border-2 border-dashed rounded-[32px] p-10 text-center transition-all duration-500 flex flex-col items-center justify-center min-h-[350px] shadow-sm
                      ${previewUrl ? 'border-primary bg-primary/5 shadow-primary/5' : 'border-stone-200 bg-stone-50/50 group-hover:bg-white group-hover:border-primary/40 group-hover:shadow-xl'}`}>
                      
                      {previewUrl ? (
                        <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden shadow-2xl ring-8 ring-white/50">
                          <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                            <span className="text-white font-bold bg-black/50 px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm">
                              <span className="material-symbols-outlined text-base">edit</span>
                              {t('change_image')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                            <span className="material-symbols-outlined text-4xl text-primary/40">add_a_photo</span>
                          </div>
                          <p className="font-bold text-stone-800 mb-2">{t('click_drag_photo')}</p>
                          <p className="text-xs text-stone-400 font-medium">{t('supported_formats')}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Analysis Trigger Section */}
                <div className="flex-1 flex flex-col space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center text-[10px]">02</span>
                    {t('analysis_result')}
                  </h3>

                  <div className="flex-1 bg-stone-50/30 rounded-[32px] p-10 flex flex-col items-center justify-center border border-stone-100 text-center min-h-[350px]">
                    {loading ? (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                        <p className="font-black text-primary animate-pulse tracking-widest text-xs uppercase">{t('analysis_in_progress')}</p>
                      </div>
                    ) : error ? (
                      <div className="text-red-500 flex flex-col items-center animate-in fade-in zoom-in">
                        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">error</span>
                        <p className="font-bold mb-4">{error}</p>
                        <button onClick={() => setError(null)} className="px-6 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-all">{t('retry')}</button>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center animate-in fade-in duration-700">
                        <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center mb-6">
                          <span className="material-symbols-outlined text-4xl text-stone-300">analytics</span>
                        </div>
                        <p className="text-stone-500 mb-8 font-medium text-sm leading-relaxed max-w-[250px]">
                          {previewUrl ? t('ready_for_analysis') : t('waiting_image')}
                        </p>
                        {previewUrl && (
                          <button 
                            onClick={handlePredict} 
                            className="w-full max-w-[280px] bg-primary text-on-primary font-black py-4 rounded-2xl shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                          >
                            {t('start_diagnosis')}
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Results View - Expanded Horizontal Layout */
              <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="flex flex-col lg:flex-row gap-10 items-stretch">
                  
                  {/* Column 1: Image Preview */}
                  <div className="lg:w-1/4">
                    <div className="h-full rounded-[32px] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-stone-200">
                      <img src={previewUrl} alt="Analysis" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Column 2: Diagnosis */}
                  <div className={`lg:w-1/3 p-8 rounded-[32px] border flex flex-col justify-center
                    ${isHealthy ? 'bg-green-50/50 border-green-100' : 'bg-orange-50/50 border-orange-100'}`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg 
                      ${isHealthy ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-orange-500 text-white shadow-orange-500/20'}`}>
                       <span className="material-symbols-outlined text-3xl">
                         {isHealthy ? 'verified' : 'warning_amber'}
                       </span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2
                      ${isHealthy ? 'text-green-600' : 'text-orange-600'}`}>
                      {t('ai_diagnostic')}
                      {confidence !== null && (
                        <span className={`px-2 py-0.5 rounded-full border font-black ${confidence < 0.4 ? 'bg-red-100 border-red-200 text-red-600' : 'bg-white/50 border-current/20'}`}>
                          {(confidence * 100).toFixed(1)}%
                        </span>
                      )}
                    </span>

                    {confidence < 0.4 ? (
                      <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center lg:items-start">
                        <h2 className="text-2xl font-black text-red-600 mb-4 leading-tight">{t('uncertain_result') || "Résultat incertain"}</h2>
                        <p className="text-stone-500 text-xs leading-relaxed font-medium">
                          {t('low_confidence_msg') || "L'IA n'est pas assez sûre de son diagnostic. Veuillez reprendre une photo plus claire, bien centrée sur la zone touchée."}
                        </p>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-3xl font-black text-stone-900 mb-4 leading-tight">{formatDiseaseName(result)}</h2>
                        <div className="h-px w-12 bg-stone-200 mb-4"></div>
                        <p className="text-stone-600 text-sm leading-relaxed font-medium">
                          {getDiseaseDescription(result)}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Column 3: Recommendation (Hidden if low confidence) */}
                  <div className="lg:w-5/12">
                    {recommendedProduct && confidence >= 0.4 ? (
                      <div className="h-full flex flex-col">
                        <div className="flex items-center gap-3 text-primary mb-4 font-black uppercase tracking-widest text-[10px]">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                          </div>
                          {t('primary_reco')}
                        </div>
                        
                        <div className="flex-1 bg-white dark:bg-stone-900 rounded-[32px] overflow-hidden border border-stone-200 dark:border-stone-800 shadow-2xl shadow-stone-200/50 group/card flex flex-col">
                          <div className="h-48 bg-stone-50 dark:bg-stone-950 p-6 flex items-center justify-center border-b border-stone-100 dark:border-stone-800 relative">
                            <img 
                              src={recommendedProduct.image?.startsWith('data:') || recommendedProduct.image?.startsWith('http') 
                                ? recommendedProduct.image 
                                : `${import.meta.env.VITE_API_URL}${recommendedProduct.image}`}
                              alt={recommendedProduct.name}
                              className="h-full object-contain group-hover/card:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter text-stone-400 border border-stone-100">
                              {t('top_choice')}
                            </div>
                          </div>
                          <div className="p-8 flex-1 flex flex-col">
                            <h4 className="font-headline font-black text-xl text-stone-900 mb-4 group-hover/card:text-primary transition-colors leading-tight">
                              {i18n.language.startsWith('ar') && recommendedProduct.name_ar ? recommendedProduct.name_ar : recommendedProduct.name}
                            </h4>
                            
                            <div className="mb-6 space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">lightbulb</span>
                                {t('why_this_product')}
                              </p>
                              <p className="text-stone-600 text-xs leading-relaxed font-medium">
                                {t(Object.values(diseaseToProduct).find(v => v.id === recommendedProduct.id)?.whyKey)}
                              </p>
                            </div>
                            <Link 
                              to={`/product/${recommendedProduct.id}`}
                              className="mt-auto inline-flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-2xl text-xs font-black hover:bg-primary transition-all shadow-xl shadow-stone-900/10 hover:shadow-primary/30 uppercase tracking-widest"
                            >
                              {t('view_details')}
                              <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full bg-stone-50 rounded-[32px] border border-stone-100 p-8 flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-5xl text-stone-200 mb-4">eco</span>
                        <p className="text-stone-400 text-sm font-medium">{t('healthy_news')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-12 p-6 rounded-3xl bg-stone-50 border border-stone-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                  <div className="flex items-center gap-4 text-stone-500">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-primary">
                      <span className="material-symbols-outlined">info</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed italic">
                      {t('ai_disclaimer')}
                    </p>
                  </div>
                  <button 
                    onClick={() => {setResult(null); setSelectedImage(null); setPreviewUrl(null); setRecommendedProduct(null); setConfidence(null);}} 
                    className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-stone-100 text-stone-600 font-black text-xs hover:bg-stone-200 hover:text-stone-900 transition-all uppercase tracking-widest shadow-sm"
                  >
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    {t('new_analysis')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default PlantDiseaseDetection;
