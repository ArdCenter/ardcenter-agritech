import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdminExperts = () => {
    const { i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedExpertId, setSelectedExpertId] = useState(null);
    const [credentials, setCredentials] = useState(null);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        full_name_fr: '',
        full_name_ar: '',
        email: '',
        password: '',
        category_id: '',
        specialty_fr: '',
        specialty_ar: '',
        bio_fr: '',
        bio_ar: '',
        experience_years: '',
        languages: ''
    });

    const fetchExperts = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/experts`);
            const data = await res.json();
            setExperts(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching experts:', err);
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-categories`);
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    useEffect(() => {
        fetchExperts();
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editMode 
                ? `${import.meta.env.VITE_API_URL}/api/admin/experts/${selectedExpertId}` 
                : `${import.meta.env.VITE_API_URL}/api/admin/experts`;
            
            const res = await fetch(url, {
                method: editMode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (res.ok) {
                if (!editMode) setCredentials(data.credentials);
                else {
                    setShowAddModal(false);
                    alert(isAr ? 'تم تعديل الخبير بنجاح' : 'Expert modifié avec succès');
                }
                fetchExperts();
                resetForm();
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error('Error saving expert:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            full_name_fr: '', full_name_ar: '', email: '', password: '', category_id: '',
            specialty_fr: '', specialty_ar: '', bio_fr: '', bio_ar: '', experience_years: '', languages: ''
        });
        setEditMode(false);
        setSelectedExpertId(null);
    };

    const handleEdit = (expert) => {
        setFormData({
            full_name_fr: expert.full_name_fr || '',
            full_name_ar: expert.full_name_ar || '',
            email: expert.user_email || '',
            password: '', // Leave empty to not update password in edit
            category_id: expert.category_id || '',
            specialty_fr: expert.specialty_fr || '',
            specialty_ar: expert.specialty_ar || '',
            bio_fr: expert.bio_fr || '',
            bio_ar: expert.bio_ar || '',
            experience_years: expert.experience_years || '',
            languages: expert.languages || '',
            is_active: expert.is_active
        });
        setEditMode(true);
        setSelectedExpertId(expert.id);
        setShowAddModal(true);
        setCredentials(null);
    };

    const handleResetPassword = async (expert) => {
        if (!window.confirm(isAr ? 'هل أنت متأكد من إعادة تعيين كلمة المرور؟' : 'Confirmer la réinitialisation du mot de passe ?')) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/experts/${expert.id}/reset-password`, {
                method: 'PUT'
            });
            const data = await res.json();
            if (res.ok) {
                setCredentials(data.credentials);
                setShowAddModal(true);
                setEditMode(false);
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error('Error resetting password:', err);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/admin/experts/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentStatus })
            });
            fetchExperts();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const copyCredentials = () => {
        if (!credentials) return;
        const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
        navigator.clipboard.writeText(text);
        alert(isAr ? 'تم النسخ!' : 'Copié !');
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-stone-900 dark:text-white">
                    {isAr ? 'إدارة الخبراء' : 'Gestion des experts'}
                </h1>
                <button 
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary-600 transition-colors"
                >
                    <span className="material-symbols-outlined">add</span>
                    {isAr ? 'إضافة خبير' : 'Ajouter un expert'}
                </button>
            </div>
            
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
                            <tr className={isAr ? 'text-right' : 'text-left'}>
                                <th className="p-4 font-bold text-sm text-stone-500">{isAr ? 'الخبير' : 'Expert'}</th>
                                <th className="p-4 font-bold text-sm text-stone-500">{isAr ? 'التخصص' : 'Spécialité'}</th>
                                <th className="p-4 font-bold text-sm text-stone-500">{isAr ? 'التقييم' : 'Note'}</th>
                                <th className="p-4 font-bold text-sm text-stone-500">{isAr ? 'استشارات' : 'Consultations'}</th>
                                <th className="p-4 font-bold text-sm text-stone-500">{isAr ? 'الحالة' : 'Statut'}</th>
                                <th className={`p-4 font-bold text-sm text-stone-500 ${isAr ? 'text-left' : 'text-right'}`}>{isAr ? 'إجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                            {experts.map(expert => (
                                <tr key={expert.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                                    <td className="p-4">
                                        <div className="font-bold text-sm">{isAr ? expert.full_name_ar : expert.full_name_fr}</div>
                                        <div className="text-xs text-stone-500">{expert.user_email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm">{isAr ? expert.category_name_ar : expert.category_name_fr}</div>
                                        <div className="text-xs text-stone-500">{isAr ? expert.specialty_ar : expert.specialty_fr}</div>
                                    </td>
                                    <td className="p-4 text-sm font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px] text-yellow-500 filled">star</span>
                                        {expert.rating || '0.0'}
                                    </td>
                                    <td className="p-4 text-sm font-bold">{expert.consultations_count || 0}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${expert.is_active ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-600'}`}>
                                            {expert.is_active 
                                                ? (isAr ? 'نشط' : 'Actif') 
                                                : (isAr ? 'غير نشط' : 'Inactif')}
                                        </span>
                                    </td>
                                    <td className={`p-4 ${isAr ? 'text-left' : 'text-right'} flex flex-wrap items-center justify-end gap-2`}>
                                        <button 
                                            onClick={() => handleEdit(expert)}
                                            className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            {isAr ? 'تعديل' : 'Modifier'}
                                        </button>
                                        <button 
                                            onClick={() => handleResetPassword(expert)}
                                            className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            {isAr ? 'إعادة تعيين كلمة المرور' : 'Réinitialiser le mot de passe'}
                                        </button>
                                        <button 
                                            onClick={() => toggleStatus(expert.id, expert.is_active)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                expert.is_active 
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                            }`}
                                        >
                                            {expert.is_active 
                                                ? (isAr ? 'تعطيل' : 'Désactiver') 
                                                : (isAr ? 'تفعيل' : 'Activer')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center">
                            <h3 className="font-bold text-xl">
                                {editMode 
                                    ? (isAr ? 'تعديل الخبير' : 'Modifier l\'expert') 
                                    : (credentials && !editMode ? (isAr ? 'بيانات دخول الخبير' : 'Identifiants de l\'expert') : (isAr ? 'إضافة خبير' : 'Ajouter un expert'))}
                            </h3>
                            <button onClick={() => {setShowAddModal(false); setCredentials(null); resetForm();}} className="text-stone-400 hover:text-stone-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {credentials ? (
                                <div className="text-center py-8">
                                    <span className="material-symbols-outlined text-5xl text-green-500 mb-4">check_circle</span>
                                    <h3 className="font-bold text-xl mb-6">{isAr ? 'العملية ناجحة' : 'Opération réussie'}</h3>
                                    
                                    <div className="bg-stone-50 dark:bg-stone-800 p-6 rounded-2xl inline-block text-left border border-stone-200 dark:border-stone-700">
                                        <div className="mb-4">
                                            <label className="text-xs text-stone-500 uppercase font-bold">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                                            <div className="font-mono text-sm mt-1">{credentials.email}</div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="text-xs text-stone-500 uppercase font-bold">{isAr ? 'كلمة المرور' : 'Mot de passe'}</label>
                                            <div className="font-mono text-sm mt-1">{credentials.password}</div>
                                        </div>
                                        <button 
                                            onClick={copyCredentials}
                                            className="w-full mt-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">content_copy</span>
                                            {isAr ? 'نسخ بيانات الدخول' : 'Copier les identifiants'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Nom (FR) *</label>
                                            <input type="text" name="full_name_fr" required value={formData.full_name_fr} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Nom (AR) *</label>
                                            <input type="text" name="full_name_ar" required value={formData.full_name_ar} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50" dir="rtl" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Email *</label>
                                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50" dir="ltr" />
                                        </div>
                                        {!editMode && (
                                            <div>
                                                <label className="block text-sm font-bold mb-2">{isAr ? 'كلمة المرور (اختياري)' : 'Mot de passe (optionnel)'}</label>
                                                <input type="text" name="password" value={formData.password} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50" dir="ltr" placeholder="Auto-généré si vide" />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-bold mb-2">{isAr ? 'الفئة' : 'Catégorie'} *</label>
                                            <select name="category_id" required value={formData.category_id} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50">
                                                <option value="">Sélectionner...</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{isAr ? c.name_ar : c.name_fr}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2">{isAr ? 'سنوات الخبرة' : 'Années d\'expérience'}</label>
                                            <input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Spécialité (FR)</label>
                                            <input type="text" name="specialty_fr" value={formData.specialty_fr} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Spécialité (AR)</label>
                                            <input type="text" name="specialty_ar" value={formData.specialty_ar} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50" dir="rtl" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold mb-2">Bio (FR)</label>
                                            <textarea name="bio_fr" value={formData.bio_fr} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 h-20"></textarea>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold mb-2">Bio (AR)</label>
                                            <textarea name="bio_ar" value={formData.bio_ar} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 h-20" dir="rtl"></textarea>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold mb-2">Langues</label>
                                            <input type="text" name="languages" value={formData.languages} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50" placeholder="Ex: Français, Arabe" />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end gap-3">
                                        <button type="button" onClick={() => {setShowAddModal(false); resetForm();}} className="px-4 py-2 font-bold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors">
                                            {isAr ? 'إلغاء' : 'Annuler'}
                                        </button>
                                        <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-600 transition-colors">
                                            {editMode 
                                                ? (isAr ? 'حفظ التعديلات' : 'Enregistrer les modifications') 
                                                : (isAr ? 'إضافة الخبير' : 'Ajouter l\'expert')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExperts;
