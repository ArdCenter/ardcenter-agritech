import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdminProducts = () => {
    const { t, i18n } = useTranslation();
    const [allProducts, setAllProducts] = useState([]);
    const [allRentals, setAllRentals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [adminFeedback, setAdminFeedback] = useState({ message: '', type: '' });
    const [newProduct, setNewProduct] = useState({ 
        name: "", 
        name_ar: "",
        category: "Semences", 
        price: "", 
        description: "", 
        description_ar: "",
        short_description: "",
        short_description_ar: "",
        advantages: "",
        advantages_ar: "",
        usage_tips: "",
        usage_tips_ar: "",
        technical_specs: [],
        technical_specs_ar: [],
        images: [], 
        is_rental: false, 
        rental_period: [], 
        rental_prices: { Jour: "", Semaine: "", Mois: "" } 
    });
    const [previews, setPreviews] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [adminSearchTerm, setAdminSearchTerm] = useState('');
    const [adminCategoryFilter, setAdminCategoryFilter] = useState('All');

    useEffect(() => {
        fetchAllProducts();
    }, []);

    const filteredAdminList = [...allProducts, ...allRentals].filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) || 
                             product.category.toLowerCase().includes(adminSearchTerm.toLowerCase());
        const matchesCategory = adminCategoryFilter === 'All' || product.category === adminCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    const fetchAllProducts = async () => {
        setIsLoading(true);
        try {
            const [productsRes, rentalsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/products`),
                fetch(`${import.meta.env.VITE_API_URL}/api/rentals`)
            ]);
            const productsData = await productsRes.json();
            const rentalsData = await rentalsRes.json();
            if (productsRes.ok) setAllProducts(productsData);
            if (rentalsRes.ok) setAllRentals(rentalsData);
        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditProduct = (product) => {
        setIsEditing(true);
        setEditingId(product.id);
        
        let parsedSpecs = [];
        try {
            parsedSpecs = typeof product.technical_specs === 'string' 
                ? JSON.parse(product.technical_specs) 
                : (product.technical_specs || []);
        } catch (e) {
            parsedSpecs = [];
        }

        let parsedSpecsAr = [];
        try {
            parsedSpecsAr = typeof product.technical_specs_ar === 'string' 
                ? JSON.parse(product.technical_specs_ar) 
                : (product.technical_specs_ar || []);
        } catch (e) {
            parsedSpecsAr = [];
        }

        let parsedPrices = { Jour: "", Semaine: "", Mois: "" };
        try {
            parsedPrices = typeof product.rental_prices === 'string' 
                ? JSON.parse(product.rental_prices) 
                : (product.rental_prices || { Jour: "", Semaine: "", Mois: "" });
        } catch (e) {
            parsedPrices = { Jour: "", Semaine: "", Mois: "" };
        }

        let parsedGallery = [];
        try {
            parsedGallery = typeof product.images_gallery === 'string' 
                ? JSON.parse(product.images_gallery) 
                : (product.images_gallery || []);
        } catch (e) {
            parsedGallery = [];
        }

        setNewProduct({
            name: product.name || "",
            name_ar: product.name_ar || "",
            category: product.category || "Semences",
            price: product.price || "",
            description: product.description || "",
            description_ar: product.description_ar || "",
            short_description: product.short_description || "",
            short_description_ar: product.short_description_ar || "",
            advantages: product.advantages || "",
            advantages_ar: product.advantages_ar || "",
            usage_tips: product.usage_tips || "",
            usage_tips_ar: product.usage_tips_ar || "",
            technical_specs: parsedSpecs,
            technical_specs_ar: parsedSpecsAr,
            images: product.image ? [product.image, ...parsedGallery] : [...parsedGallery],
            is_rental: !!product.is_rental,
            rental_period: product.rental_period ? product.rental_period.split(', ') : [],
            rental_prices: parsedPrices
        });

        if (product.image) {
            setPreviews([product.image, ...parsedGallery]);
        } else {
            setPreviews([...parsedGallery]);
        }

        const formElement = document.querySelector('form');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsAddingProduct(true);
        setAdminFeedback({ message: '', type: '' });

        const fileToBase64 = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        };

        try {
            let imageBase64 = "";
            let galleryBase64 = [];

            if (newProduct.images && newProduct.images.length > 0) {
                const mainFile = newProduct.images[0];
                imageBase64 = typeof mainFile === 'string' ? mainFile : await fileToBase64(mainFile);

                if (newProduct.images.length > 1) {
                    galleryBase64 = await Promise.all(
                        newProduct.images.slice(1).map(file => typeof file === 'string' ? file : fileToBase64(file))
                    );
                }
            }

            const payload = {
                ...newProduct,
                image: imageBase64,
                images_gallery: galleryBase64
            };
            
            if (newProduct.is_rental) {
                const periods = [];
                if (newProduct.rental_prices.Jour) periods.push('Jour');
                if (newProduct.rental_prices.Semaine) periods.push('Semaine');
                if (newProduct.rental_prices.Mois) periods.push('Mois');
                
                payload.rental_period = periods.join(', ');
                
                if (periods.length > 0) {
                    const firstPeriod = periods[0];
                    payload.price = `${newProduct.rental_prices[firstPeriod]} DH / ${firstPeriod}`;
                } else {
                    payload.price = 'Sur demande';
                }
                
                payload.rental_prices = newProduct.rental_prices;
            }

            const url = isEditing 
                ? `${import.meta.env.VITE_API_URL}/api/products/${editingId}`
                : `${import.meta.env.VITE_API_URL}/api/products`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                if (isEditing) {
                    if (newProduct.is_rental) {
                        setAllRentals(allRentals.map(r => r.id === editingId ? { ...r, ...payload, id: editingId } : r));
                    } else {
                        setAllProducts(allProducts.map(p => p.id === editingId ? { ...p, ...payload, id: editingId } : p));
                    }
                    setIsEditing(false);
                    setEditingId(null);
                } else {
                    if (newProduct.is_rental) {
                        setAllRentals([data, ...allRentals]);
                    } else {
                        setAllProducts([data, ...allProducts]);
                    }
                }
                setNewProduct({ 
                    name: "", 
                    name_ar: "", 
                    category: newProduct.is_rental ? "Tracteurs" : "Semences", 
                    price: "", 
                    description: "", 
                    description_ar: "", 
                    short_description: "",
                    short_description_ar: "",
                    advantages: "",
                    advantages_ar: "",
                    usage_tips: "",
                    usage_tips_ar: "",
                    technical_specs: [], 
                    technical_specs_ar: [], 
                    images: [], 
                    is_rental: newProduct.is_rental, 
                    rental_period: [], 
                    rental_prices: { Jour: "", Semaine: "", Mois: "" } 
                });
                setAdminFeedback({ 
                    message: isEditing 
                        ? (i18n.language.startsWith('ar') ? 'تم تعديل المنتج بنجاح!' : 'Produit mis à jour avec succès !')
                        : (i18n.language.startsWith('ar') ? 'تم إضافة المنتج بنجاح!' : 'Produit ajouté avec succès !'), 
                    type: 'success' 
                });
                setTimeout(() => setAdminFeedback({ message: '', type: '' }), 3000);
            } else {
                setAdminFeedback({ message: `Erreur: ${data.error}`, type: 'error' });
            }
        } catch (err) {
            console.error('Error adding product:', err);
            setAdminFeedback({ message: 'Erreur réseau.', type: 'error' });
        } finally {
            setIsAddingProduct(false);
            setPreviews([]);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setNewProduct({ ...newProduct, images: [...newProduct.images, ...files] });
        
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeSelectedImage = (index) => {
        const updatedImages = newProduct.images.filter((_, i) => i !== index);
        const updatedPreviews = previews.filter((_, i) => i !== index);
        setNewProduct({ ...newProduct, images: updatedImages });
        setPreviews(updatedPreviews);
    };

    const handleDeleteProduct = async (id, isRental) => {
        if (window.confirm('Voulez-vous supprimer ce produit ?')) {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    if (isRental) {
                        setAllRentals(allRentals.filter(p => p.id !== id));
                    } else {
                        setAllProducts(allProducts.filter(p => p.id !== id));
                    }
                }
            } catch (err) {
                console.error('Error deleting product:', err);
            }
        }
    };

    if (isLoading) {
        return <div className="animate-pulse text-stone-500 font-bold">Chargement du catalogue...</div>;
    }

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-end border-b border-stone-200 dark:border-stone-800 pb-4">
                <div>
                    <h1 className="text-4xl font-headline font-black text-stone-900 dark:text-stone-50">Gestion Catalogue</h1>
                    <p className="text-stone-500 dark:text-stone-400 mt-2">Ajoutez ou modifiez vos produits et machines.</p>
                </div>
            </header>

            {/* Form to Add Product */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-200 dark:border-stone-800 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined">add_circle</span>
                    Nouveau Produit / Machine
                </h2>
                
                {adminFeedback.message && (
                    <div className={`mb-6 p-4 rounded-xl font-bold text-sm ${adminFeedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {adminFeedback.message}
                    </div>
                )}

                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 flex items-center gap-4 bg-stone-50 dark:bg-stone-800 p-4 rounded-xl">
                         <span className="text-sm font-bold">Type :</span>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={!newProduct.is_rental} onChange={() => setNewProduct({...newProduct, is_rental: false, category: 'Semences'})} className="accent-primary" />
                            <span className="text-sm font-medium">Vente (Produit)</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={newProduct.is_rental} onChange={() => setNewProduct({...newProduct, is_rental: true, category: 'Tracteurs'})} className="accent-primary" />
                            <span className="text-sm font-medium">Location (Machine)</span>
                         </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-stone-500">Nom du produit (FR)</label>
                        <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary" type="text" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-stone-500 text-right block">اسم المنتج (AR)</label>
                        <input required value={newProduct.name_ar} onChange={e => setNewProduct({...newProduct, name_ar: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-right" dir="rtl" type="text" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-stone-500">Catégorie</label>
                        <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary">
                            {newProduct.is_rental ? (
                                <>
                                    <option value="Tracteurs">Tracteurs</option>
                                    <option value="Excavatrices">Excavatrices</option>
                                    <option value="Moissonneuses">Moissonneuses</option>
                                    <option value="Matériel de Transport">Matériel de Transport</option>
                                    <option value="Matériel agricole">Matériel agricole</option>
                                </>
                            ) : (
                                <>
                                    <option value="Semences">Semences</option>
                                    <option value="Matériel">Matériel</option>
                                    <option value="Capteurs IoT">Capteurs IoT</option>
                                    <option value="Plantes">Plantes</option>
                                    <option value="Engrais">Engrais</option>
                                    <option value="Phytosanitaires">Phytosanitaires</option>
                                </>
                            )}
                        </select>
                    </div>

                    {!newProduct.is_rental && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-stone-500">Prix (ex: 450 DH)</label>
                            <input required={!newProduct.is_rental} value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary" type="text" />
                        </div>
                    )}

                    {(newProduct.category === 'Phytosanitaires' || newProduct.category === 'Engrais') && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-stone-500">Accroche / Texte court (FR)</label>
                                <input value={newProduct.short_description} onChange={e => setNewProduct({...newProduct, short_description: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary" type="text" placeholder="Ex: Désherbant sélectif puissant..." />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-stone-500 text-right block">نص قصير جذاب (AR)</label>
                                <input value={newProduct.short_description_ar} onChange={e => setNewProduct({...newProduct, short_description_ar: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-right" dir="rtl" type="text" placeholder="مثال: مبيد أعشاب انتقائي قوي..." />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase text-stone-500">Avantages (FR)</label>
                                <textarea rows="2" value={newProduct.advantages} onChange={e => setNewProduct({...newProduct, advantages: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Listez les points forts..."></textarea>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase text-stone-500 text-right block">المزايا (AR)</label>
                                <textarea rows="2" value={newProduct.advantages_ar} onChange={e => setNewProduct({...newProduct, advantages_ar: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none text-right" dir="rtl" placeholder="اذكر نقاط القوة..."></textarea>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase text-stone-500">Conseils d'utilisation (FR)</label>
                                <textarea rows="2" value={newProduct.usage_tips} onChange={e => setNewProduct({...newProduct, usage_tips: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Dosage, précautions..."></textarea>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase text-stone-500 text-right block">إرشادات الاستخدام (AR)</label>
                                <textarea rows="2" value={newProduct.usage_tips_ar} onChange={e => setNewProduct({...newProduct, usage_tips_ar: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none text-right" dir="rtl" placeholder="الجرعة، الاحتياطات..."></textarea>
                            </div>
                        </>
                    )}

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase text-stone-500">Description Détaillée (FR)</label>
                        <textarea rows="3" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Entrez la description détaillée du produit..."></textarea>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase text-stone-500 text-right block">الوصف التفصيلي (AR)</label>
                        <textarea rows="3" value={newProduct.description_ar} onChange={e => setNewProduct({...newProduct, description_ar: e.target.value})} className="w-full bg-stone-50 dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary resize-none text-right" dir="rtl" placeholder="أدخل الوصف التفصيلي للمنتج..."></textarea>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <label className="text-xs font-bold uppercase text-stone-500">Fiche Technique (Caractéristiques)</label>
                        <div className="space-y-3">
                            {newProduct.technical_specs.map((spec, index) => (
                                <div key={index} className="flex gap-4 items-center flex-wrap md:flex-nowrap bg-stone-50/50 dark:bg-stone-800/30 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
                                    <div className="flex-1 min-w-[200px] space-y-1">
                                        <input 
                                            value={spec.name} 
                                            onChange={e => {
                                                const specs = [...newProduct.technical_specs];
                                                specs[index].name = e.target.value;
                                                setNewProduct({...newProduct, technical_specs: specs});
                                            }} 
                                            placeholder="Caractéristique (FR: ex: Puissance)" 
                                            className="w-full bg-white dark:bg-stone-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" 
                                            type="text" 
                                        />
                                        <input 
                                            value={newProduct.technical_specs_ar[index]?.name || ''} 
                                            onChange={e => {
                                                const specsAr = [...newProduct.technical_specs_ar];
                                                if (!specsAr[index]) specsAr[index] = { name: '', value: '' };
                                                specsAr[index].name = e.target.value;
                                                setNewProduct({...newProduct, technical_specs_ar: specsAr});
                                            }} 
                                            placeholder="الميزة (AR: ex: القوة)" 
                                            className="w-full bg-white dark:bg-stone-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm text-right" 
                                            dir="rtl"
                                            type="text" 
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[200px] space-y-1">
                                        <input 
                                            value={spec.value} 
                                            onChange={e => {
                                                const specs = [...newProduct.technical_specs];
                                                specs[index].value = e.target.value;
                                                setNewProduct({...newProduct, technical_specs: specs});
                                            }} 
                                            placeholder="Valeur (FR: ex: 75 HP)" 
                                            className="w-full bg-white dark:bg-stone-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" 
                                            type="text" 
                                        />
                                        <input 
                                            value={newProduct.technical_specs_ar[index]?.value || ''} 
                                            onChange={e => {
                                                const specsAr = [...newProduct.technical_specs_ar];
                                                if (!specsAr[index]) specsAr[index] = { name: '', value: '' };
                                                specsAr[index].value = e.target.value;
                                                setNewProduct({...newProduct, technical_specs_ar: specsAr});
                                            }} 
                                            placeholder="القيمة (AR: ex: 75 حصان)" 
                                            className="w-full bg-white dark:bg-stone-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm text-right" 
                                            dir="rtl"
                                            type="text" 
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const specs = newProduct.technical_specs.filter((_, i) => i !== index);
                                            const specsAr = newProduct.technical_specs_ar.filter((_, i) => i !== index);
                                            setNewProduct({...newProduct, technical_specs: specs, technical_specs_ar: specsAr});
                                        }} 
                                        className="material-symbols-outlined text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors self-center"
                                    >
                                        delete
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setNewProduct({
                                ...newProduct, 
                                technical_specs: [...newProduct.technical_specs, {name: '', value: ''}],
                                technical_specs_ar: [...newProduct.technical_specs_ar, {name: '', value: ''}]
                            })} 
                            className="text-primary font-bold text-sm flex items-center gap-1 hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors w-fit"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Ajouter une caractéristique
                        </button>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <label className="text-xs font-bold uppercase text-stone-500">Images (Principale + Galerie)</label>
                        <div className="flex flex-wrap gap-4 mb-4">
                            {previews.map((src, index) => (
                                <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-primary/20 bg-stone-100 group">
                                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => removeSelectedImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    >
                                        close
                                    </button>
                                    {index === 0 && (
                                        <div className="absolute bottom-0 left-0 w-full bg-primary text-on-primary text-[8px] font-bold text-center py-0.5 uppercase">
                                            Principale
                                        </div>
                                    )}
                                </div>
                            ))}
                            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-stone-400 hover:text-primary">
                                <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                                <span className="text-[10px] font-bold uppercase">Ajouter</span>
                                <input multiple accept="image/*" onChange={handleFileChange} className="hidden" type="file" />
                            </label>
                        </div>
                        <p className="text-[10px] text-stone-400 italic">La première image sera utilisée comme image principale du produit.</p>
                    </div>

                    {newProduct.is_rental && (
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-primary">Prix / Jour (DH)</label>
                                <input value={newProduct.rental_prices.Jour} onChange={e => setNewProduct({...newProduct, rental_prices: {...newProduct.rental_prices, Jour: e.target.value}})} className="w-full bg-white dark:bg-stone-800 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary" type="text" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-primary">Prix / Semaine (DH)</label>
                                <input value={newProduct.rental_prices.Semaine} onChange={e => setNewProduct({...newProduct, rental_prices: {...newProduct.rental_prices, Semaine: e.target.value}})} className="w-full bg-white dark:bg-stone-800 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary" type="text" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-primary">Prix / Mois (DH)</label>
                                <input value={newProduct.rental_prices.Mois} onChange={e => setNewProduct({...newProduct, rental_prices: {...newProduct.rental_prices, Mois: e.target.value}})} className="w-full bg-white dark:bg-stone-800 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary" type="text" />
                            </div>
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <button disabled={isAddingProduct} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50">
                            {isAddingProduct 
                                ? (isEditing ? 'Modification en cours...' : 'Ajout en cours...') 
                                : (isEditing ? 'Enregistrer les modifications' : 'Ajouter au catalogue')}
                        </button>
                        {isEditing && (
                            <button 
                                type="button" 
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditingId(null);
                                    setNewProduct({ 
                                        name: "", name_ar: "", category: "Semences", price: "", 
                                        description: "", description_ar: "", short_description: "", 
                                        short_description_ar: "", advantages: "", advantages_ar: "", 
                                        usage_tips: "", usage_tips_ar: "", technical_specs: [], 
                                        technical_specs_ar: [], images: [], is_rental: false, 
                                        rental_period: [], rental_prices: { Jour: "", Semaine: "", Mois: "" } 
                                    });
                                    setPreviews([]);
                                }} 
                                className="w-full mt-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 py-3 rounded-xl font-bold transition-all active:scale-95"
                            >
                                Annuler la modification
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List current products */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-2xl font-bold font-headline">Catalogue Actuel</h2>
                    
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">search</span>
                            <input 
                                type="text" 
                                placeholder="Rechercher..." 
                                value={adminSearchTerm}
                                onChange={(e) => setAdminSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <select 
                            value={adminCategoryFilter}
                            onChange={(e) => setAdminCategoryFilter(e.target.value)}
                            className="w-full md:w-40 px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="All">Toutes catégories</option>
                            <optgroup label="Produits">
                                <option value="Semences">Semences</option>
                                <option value="Matériel">Matériel</option>
                                <option value="Engrais">Engrais</option>
                            </optgroup>
                            <optgroup label="Location">
                                <option value="Tracteurs">Tracteurs</option>
                                <option value="Moissonneuses">Moissonneuses</option>
                                <option value="Matériel agricole">Matériel agricole</option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                {filteredAdminList.length === 0 ? (
                    <div className="p-12 text-center bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                        <span className="material-symbols-outlined text-stone-300 text-5xl mb-2">search_off</span>
                        <p className="text-stone-500">Aucun produit trouvé pour votre recherche.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAdminList.map((product) => (
                            <div key={product.id} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden group shadow-sm transition-all hover:shadow-md">
                            <div className="aspect-video relative overflow-hidden">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute top-2 right-2 bg-white/90 dark:bg-stone-900/90 p-2 rounded-lg shadow-md flex gap-2">
                                    <button onClick={() => handleEditProduct(product)} className="material-symbols-outlined text-primary hover:text-primary-container transition-colors">edit</button>
                                    <button onClick={() => handleDeleteProduct(product.id, !!product.is_rental)} className="material-symbols-outlined text-red-500 hover:text-red-700 transition-colors">delete</button>
                                </div>
                                {product.is_rental ? (
                                    <span className="absolute bottom-2 left-2 bg-primary text-on-primary text-[10px] font-black uppercase px-2 py-1 rounded">Machine</span>
                                ) : (
                                    <span className="absolute bottom-2 left-2 bg-stone-800 text-white text-[10px] font-black uppercase px-2 py-1 rounded">Produit</span>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-stone-900 dark:text-stone-50">{product.name}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-stone-500 uppercase font-bold tracking-widest">{product.category}</span>
                                    <span className="text-primary font-black">{product.price}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);
};

export default AdminProducts;
