import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ExpertRegister = () => {
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        category_id: '',
        specialty: '',
        city: '',
        experience_years: '',
        bio: '',
        languages: '',
        degrees: '',
        documents: ''
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-categories`);
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expert-register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (res.ok) {
                setSuccess(true);
            } else {
                alert(data.error || 'Erreur lors de l\'inscription');
            }
        } catch (err) {
            console.error('Error registering:', err);
            alert('Erreur réseau');
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className="bg-stone-50 dark:bg-stone-900 min-h-screen py-20 px-4" dir={isAr ? 'rtl' : 'ltr'}>
                <div className="max-w-2xl mx-auto bg-white dark:bg-stone-950 p-10 rounded-3xl shadow-xl text-center">
                    <span className="material-symbols-outlined text-6xl text-green-500 mb-6">check_circle</span>
                    <h2 className="text-3xl font-black text-stone-900 dark:text-white mb-4">
                        {isAr ? 'تم إرسال طلبك بنجاح' : 'Votre demande a été envoyée avec succès'}
                    </h2>
                    <p className="text-stone-600 dark:text-stone-400 mb-8 text-lg leading-relaxed">
                        {isAr 
                            ? 'شكراً لتسجيلك كخبير في ARDCENTER. سيقوم فريقنا بمراجعة طلبك في أقرب وقت ممكن. ستتلقى رسالة بريد إلكتروني عند تفعيل حسابك.' 
                            : 'Merci de vous être inscrit comme expert sur ARDCENTER. Notre équipe va examiner votre demande dans les plus brefs délais. Vous recevrez un e-mail dès l\'activation de votre compte.'}
                    </p>
                    <button 
                        onClick={() => navigate('/')}
                        className="bg-primary hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-bold transition-colors"
                    >
                        {isAr ? 'العودة للصفحة الرئيسية' : 'Retour à l\'accueil'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-stone-50 dark:bg-stone-900 min-h-screen py-16 px-4" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="max-w-3xl mx-auto bg-white dark:bg-stone-950 rounded-3xl shadow-xl overflow-hidden border border-stone-200 dark:border-stone-800">
                <div className="bg-primary p-8 text-white text-center">
                    <h1 className="text-3xl font-black mb-2">
                        {isAr ? 'إنشاء حساب خبير' : 'Créer un compte Expert'}
                    </h1>
                    <p className="opacity-90">
                        {isAr ? 'الرجاء ملء جميع المعلومات بدقة لتسريع عملية التحقق' : 'Veuillez remplir toutes les informations avec précision pour accélérer la validation'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Section 1: Informations Personnelles */}
                    <div>
                        <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4 border-b pb-2">
                            {isAr ? 'المعلومات الشخصية' : 'Informations Personnelles'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'الاسم الكامل' : 'Nom Complet'} *
                                </label>
                                <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} 
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'البريد الإلكتروني' : 'Email'} *
                                </label>
                                <input type="email" name="email" required value={formData.email} onChange={handleChange} dir="ltr"
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'كلمة المرور' : 'Mot de passe'} *
                                </label>
                                <input type="password" name="password" required value={formData.password} onChange={handleChange} dir="ltr"
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'رقم الهاتف' : 'Téléphone'} *
                                </label>
                                <input type="text" name="phone" required value={formData.phone} onChange={handleChange} dir="ltr"
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'المدينة' : 'Ville'} *
                                </label>
                                <input type="text" name="city" required value={formData.city} onChange={handleChange} 
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Profil Professionnel */}
                    <div>
                        <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4 border-b pb-2">
                            {isAr ? 'الملف المهني' : 'Profil Professionnel'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'فئة الخبرة' : 'Catégorie d\'expertise'} *
                                </label>
                                <select name="category_id" required value={formData.category_id} onChange={handleChange} 
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors"
                                >
                                    <option value="">{isAr ? 'اختر فئة...' : 'Sélectionner...'}</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{isAr ? c.name_ar : c.name_fr}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'التخصص الدقيق' : 'Spécialité exacte'} *
                                </label>
                                <input type="text" name="specialty" required value={formData.specialty} onChange={handleChange} 
                                    placeholder={isAr ? 'مثال: أمراض الطماطم' : 'Ex: Maladies de la tomate'}
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'سنوات الخبرة' : 'Années d\'expérience'} *
                                </label>
                                <input type="number" name="experience_years" required min="0" value={formData.experience_years} onChange={handleChange} 
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'اللغات المنطوقة' : 'Langues parlées'} *
                                </label>
                                <input type="text" name="languages" required value={formData.languages} onChange={handleChange} 
                                    placeholder="Ex: Français, Arabe, Anglais"
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors" 
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'نبذة عنك (Bio)' : 'À propos de vous (Bio)'} *
                                </label>
                                <textarea name="bio" required value={formData.bio} onChange={handleChange} rows="4"
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors" 
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Pièces & Tarification */}
                    <div>
                        <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4 border-b pb-2">
                            {isAr ? 'المؤهلات' : 'Qualifications'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'الشهادات الأكاديمية' : 'Diplômes académiques'} *
                                </label>
                                <input type="text" name="degrees" required value={formData.degrees} onChange={handleChange} 
                                    placeholder={isAr ? 'مثال: مهندس زراعي - معهد الحسن الثاني' : 'Ex: Ingénieur Agronome - IAV'}
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors" 
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold mb-2 text-stone-700 dark:text-stone-300">
                                    {isAr ? 'رابط السيرة الذاتية أو الشهادات (Google Drive, LinkedIn...)' : 'Lien CV ou Certificats (Google Drive, LinkedIn...)'}
                                </label>
                                <input type="url" name="documents" value={formData.documents} onChange={handleChange} dir="ltr"
                                    placeholder="https://"
                                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors" 
                                />
                                <p className="text-xs text-stone-500 mt-2">
                                    {isAr ? 'سيتم استخدام هذه الروابط للتحقق من هويتك ومؤهلاتك.' : 'Ces liens seront utilisés pour vérifier votre identité et vos qualifications.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined">send</span>
                            )}
                            {isAr ? 'إرسال طلب التسجيل' : 'Soumettre la demande'}
                        </button>
                        <p className="text-center text-sm text-stone-500 mt-4">
                            {isAr 
                                ? 'بالنقر على إرسال، فإنك توافق على شروط وأحكام ARDCENTER.' 
                                : 'En soumettant, vous acceptez les conditions générales de ARDCENTER.'}
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpertRegister;
