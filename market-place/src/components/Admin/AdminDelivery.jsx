import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdminDelivery = () => {
    const { t, i18n } = useTranslation();
    const [drivers, setDrivers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [zoneFilter, setZoneFilter] = useState('All');
    
    // Modal & Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        vehicle: 'Moto',
        delivery_zone: '',
        gps_position: '33.5731, -7.5898',
        availability: 'disponible',
        status: 'libre'
    });

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = () => {
        setIsLoading(true);
        fetch(`${import.meta.env.VITE_API_URL}/api/delivery-persons`)
            .then(res => res.json())
            .then(data => {
                setDrivers(data || []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching delivery persons:", err);
                setIsLoading(false);
            });
    };

    const handleOpenAdd = () => {
        setEditingDriver(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            vehicle: 'Moto',
            delivery_zone: '',
            gps_position: '33.5731, -7.5898',
            availability: 'disponible',
            status: 'libre'
        });
        setIsFormOpen(true);
    };

    const handleOpenEdit = (driver) => {
        setEditingDriver(driver);
        setFormData({
            name: driver.name,
            phone: driver.phone || '',
            vehicle: driver.vehicle || 'Moto',
            delivery_zone: driver.delivery_zone || '',
            gps_position: driver.gps_position || '33.5731, -7.5898',
            availability: driver.availability || 'disponible',
            status: driver.status || 'libre'
        });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingDriver 
            ? `${import.meta.env.VITE_API_URL}/api/delivery-persons/${editingDriver.id}`
            : `${import.meta.env.VITE_API_URL}/api/delivery-persons`;
        const method = editingDriver ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                setIsFormOpen(false);
                fetchDrivers();
            }
        } catch (err) {
            console.error("Error saving delivery person:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(i18n.language === 'ar' ? 'هل أنت متأكد من حذف هذا الموزع؟' : 'Êtes-vous sûr de vouloir supprimer ce livreur ?')) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-persons/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchDrivers();
            }
        } catch (err) {
            console.error("Error deleting driver:", err);
        }
    };

    const toggleAvailability = async (driver) => {
        const newAvailability = driver.availability === 'disponible' ? 'non disponible' : 'disponible';
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-persons/${driver.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availability: newAvailability })
            });
            if (response.ok) {
                fetchDrivers();
            }
        } catch (err) {
            console.error("Error updating availability:", err);
        }
    };

    const toggleStatus = async (driver) => {
        const newStatus = driver.status === 'libre' ? 'occupé' : 'libre';
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-persons/${driver.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                fetchDrivers();
            }
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    // Live simulation of GPS movements to WOW the user
    const simulateGpsMovement = async (driver) => {
        let lat = 33.5731;
        let lng = -7.5898;
        if (driver.gps_position) {
            const parts = driver.gps_position.split(',');
            if (parts.length === 2) {
                lat = parseFloat(parts[0]);
                lng = parseFloat(parts[1]);
            }
        }
        // Slightly modify latitude and longitude
        const newLat = (lat + (Math.random() - 0.5) * 0.008).toFixed(4);
        const newLng = (lng + (Math.random() - 0.5) * 0.008).toFixed(4);
        const newGps = `${newLat}, ${newLng}`;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-persons/${driver.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gps_position: newGps })
            });
            if (response.ok) {
                // Instantly update local state for a smooth UI animation
                setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, gps_position: newGps } : d));
            }
        } catch (err) {
            console.error("Error simulating GPS movement:", err);
        }
    };

    const filteredDrivers = drivers.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (d.delivery_zone && d.delivery_zone.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesZone = zoneFilter === 'All' || d.delivery_zone === zoneFilter;
        return matchesSearch && matchesZone;
    });

    const uniqueZones = [...new Set(drivers.map(d => d.delivery_zone).filter(Boolean))];

    // Compute stats
    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter(d => d.availability === 'disponible').length;
    const busyDrivers = drivers.filter(d => d.status === 'occupé').length;
    const offlineDrivers = drivers.filter(d => d.availability === 'non disponible').length;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-headline font-black text-stone-900 dark:text-stone-50">
                        {i18n.language === 'ar' ? 'إدارة الموزعين' : 'Logistique & Livreurs'}
                    </h1>
                    <p className="text-stone-500 dark:text-stone-400 mt-2">
                        {i18n.language === 'ar' ? 'تتبع حالة الموزعين والموقع الجغرافي الحي لتنظيم التسليم.' : 'Suivi en temps réel de la flotte de livraison, des zones et du statut.'}
                    </p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    <span>{i18n.language === 'ar' ? 'إضافة موزع جديد' : 'Ajouter un Livreur'}</span>
                </button>
            </header>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total */}
                <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">{i18n.language === 'ar' ? 'مجموع الموزعين' : 'Flotte Totale'}</p>
                        <h3 className="text-3xl font-black text-stone-900 dark:text-stone-50">{totalDrivers}</h3>
                    </div>
                    <div className="p-3 bg-stone-100 dark:bg-stone-850 rounded-xl text-stone-600 dark:text-stone-300">
                        <span className="material-symbols-outlined text-2xl">group</span>
                    </div>
                </div>

                {/* Available */}
                <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">{i18n.language === 'ar' ? 'المتفرغون حاليا' : 'Livreurs Libres'}</p>
                        <h3 className="text-3xl font-black text-green-600 dark:text-green-400">{availableDrivers - busyDrivers}</h3>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl text-green-600">
                        <span className="material-symbols-outlined text-2xl">task_alt</span>
                    </div>
                </div>

                {/* Busy */}
                <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">{i18n.language === 'ar' ? 'في خدمة تسليم' : 'En Livraison (Occupés)'}</p>
                        <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400">{busyDrivers}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600">
                        <span className="material-symbols-outlined text-2xl">local_shipping</span>
                    </div>
                </div>

                {/* Offline */}
                <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">{i18n.language === 'ar' ? 'خارج الخدمة' : 'Hors Service'}</p>
                        <h3 className="text-3xl font-black text-stone-400 dark:text-stone-600">{offlineDrivers}</h3>
                    </div>
                    <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl text-stone-400">
                        <span className="material-symbols-outlined text-2xl">power_off</span>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">search</span>
                    <input 
                        type="text" 
                        placeholder={i18n.language === 'ar' ? 'بحث عن موزع أو منطقة...' : 'Rechercher un livreur, zone...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                </div>
                
                <select 
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    className="w-full md:w-64 px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                >
                    <option value="All">{i18n.language === 'ar' ? 'كل مناطق التوصيل' : 'Toutes les Zones'}</option>
                    {uniqueZones.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                </select>
            </div>

            {/* Logistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrivers.map((driver) => (
                    <div key={driver.id} className="bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                        {/* Status bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${driver.availability === 'non disponible' ? 'bg-stone-300 dark:bg-stone-800' : driver.status === 'occupé' ? 'bg-amber-500' : 'bg-green-500'}`} />

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold font-headline text-stone-900 dark:text-stone-50">{driver.name}</h3>
                                <p className="text-xs text-stone-400 mt-0.5">{driver.vehicle || 'Véhicule N/A'}</p>
                            </div>
                            
                            {/* Badges */}
                            <div className="flex flex-col gap-1.5 items-end">
                                <button 
                                    onClick={() => toggleAvailability(driver)}
                                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${driver.availability === 'disponible' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-stone-100 text-stone-500 border-stone-200'}`}
                                >
                                    {driver.availability === 'disponible' ? (i18n.language === 'ar' ? 'متاح' : 'Disponible') : (i18n.language === 'ar' ? 'غير متاح' : 'Offline')}
                                </button>
                                {driver.availability === 'disponible' && (
                                    <button 
                                        onClick={() => toggleStatus(driver)}
                                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${driver.status === 'libre' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}
                                    >
                                        {driver.status === 'libre' ? (i18n.language === 'ar' ? 'حر' : 'Libre') : (i18n.language === 'ar' ? 'مستغل' : 'Occupé')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800/80">
                            {/* Zone */}
                            <div className="flex items-center gap-2.5 text-sm font-medium text-stone-600 dark:text-stone-400">
                                <span className="material-symbols-outlined text-stone-400 text-[18px]">explore</span>
                                <span>{driver.delivery_zone || 'Aucune zone spécifiée'}</span>
                            </div>
                            {/* Phone */}
                            <div className="flex items-center gap-2.5 text-sm font-medium text-stone-600 dark:text-stone-400">
                                <span className="material-symbols-outlined text-stone-400 text-[18px]">call</span>
                                <a href={`tel:${driver.phone}`} className="hover:text-primary transition-colors">{driver.phone || 'Non renseigné'}</a>
                            </div>
                            {/* GPS Position */}
                            <div className="flex items-center justify-between gap-2.5 text-sm font-medium text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-950 p-2.5 rounded-xl border border-stone-100 dark:border-stone-850">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[18px] animate-pulse">location_on</span>
                                    <span className="font-mono text-xs text-stone-700 dark:text-stone-300">{driver.gps_position || '33.5731, -7.5898'}</span>
                                </div>
                                {driver.availability === 'disponible' && (
                                    <button 
                                        onClick={() => simulateGpsMovement(driver)}
                                        title={i18n.language === 'ar' ? 'حركة GPS وهمية' : 'Simuler mouvement GPS'}
                                        className="p-1 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-sm">autorenew</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-stone-100 dark:border-stone-800/85">
                            <button 
                                onClick={() => handleOpenEdit(driver)}
                                className="px-3.5 py-1.5 bg-stone-100 hover:bg-primary hover:text-white rounded-lg text-xs font-bold text-stone-600 transition-all flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                {i18n.language === 'ar' ? 'تعديل' : 'Modifier'}
                            </button>
                            <button 
                                onClick={() => handleDelete(driver.id)}
                                className="px-3.5 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                {i18n.language === 'ar' ? 'حذف' : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredDrivers.length === 0 && (
                <div className="p-16 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/50 shadow-sm">
                    <span className="material-symbols-outlined text-6xl text-stone-200 mb-4 font-thin">local_shipping</span>
                    <p className="text-stone-500 font-bold">
                        {i18n.language === 'ar' ? 'لم يتم العثور على أي موزع.' : 'Aucun livreur trouvé.'}
                    </p>
                </div>
            )}

            {/* Slide-over Form Panel */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsFormOpen(false)}></div>
                    
                    <div className="relative w-full max-w-md bg-white dark:bg-stone-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Form Header */}
                        <div className="px-8 py-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
                            <div>
                                <h2 className="text-2xl font-bold font-headline text-stone-900 dark:text-stone-50">
                                    {editingDriver 
                                        ? (i18n.language === 'ar' ? 'تعديل بيانات الموزع' : 'Modifier le Livreur')
                                        : (i18n.language === 'ar' ? 'إضافة موزع جديد' : 'Ajouter un Livreur')}
                                </h2>
                                <p className="text-xs text-stone-400 mt-1">{i18n.language === 'ar' ? 'املأ الحقول لتحديث الأسطول اللوجستي.' : 'Veuillez renseigner les informations du livreur.'}</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                            {/* Nom */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-stone-400 tracking-wider">{i18n.language === 'ar' ? 'الاسم الكامل' : 'Nom Complet'}</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Rachid El..."
                                    className="w-full bg-[#f4f4ef] dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent font-medium"
                                />
                            </div>

                            {!editingDriver && (
                                <>
                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-stone-400 tracking-wider">Email (Connexion)</label>
                                        <input 
                                            required 
                                            type="email" 
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="livreur@ardcenter.com"
                                            className="w-full bg-[#f4f4ef] dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent font-medium"
                                        />
                                    </div>
                                    
                                    {/* Password */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase text-stone-400 tracking-wider">Mot de passe</label>
                                        <input 
                                            required 
                                            type="password" 
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Mot de passe sécurisé"
                                            className="w-full bg-[#f4f4ef] dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent font-medium"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-stone-400 tracking-wider">{i18n.language === 'ar' ? 'رقم الهاتف' : 'Numéro de Téléphone'}</label>
                                <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+212 6..."
                                    className="w-full bg-[#f4f4ef] dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent font-medium"
                                />
                            </div>

                            {/* Vehicle */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-stone-400 tracking-wider">{i18n.language === 'ar' ? 'نوع المركبة' : 'Type de Véhicule'}</label>
                                <select 
                                    value={formData.vehicle}
                                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                                    className="w-full bg-[#f4f4ef] dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent font-bold"
                                >
                                    <option value="Moto">Moto</option>
                                    <option value="Triporteur">Triporteur</option>
                                    <option value="Camionnette">Camionnette (Renault Kangoo)</option>
                                    <option value="Fourgon">Fourgon (Peugeot Boxer)</option>
                                </select>
                            </div>

                            {/* Delivery Zone */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-stone-400 tracking-wider">{i18n.language === 'ar' ? 'منطقة التغطية والتوصيل' : 'Zone de Livraison'}</label>
                                <input 
                                    type="text" 
                                    value={formData.delivery_zone}
                                    onChange={(e) => setFormData({ ...formData, delivery_zone: e.target.value })}
                                    placeholder="Casablanca Maarif..."
                                    className="w-full bg-[#f4f4ef] dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent font-medium"
                                />
                            </div>

                            {/* GPS Position */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase text-stone-400 tracking-wider">{i18n.language === 'ar' ? 'إحداثيات الموقع GPS' : 'Coordonnées GPS'}</label>
                                <input 
                                    type="text" 
                                    value={formData.gps_position}
                                    onChange={(e) => setFormData({ ...formData, gps_position: e.target.value })}
                                    placeholder="33.5731, -7.5898"
                                    className="w-full bg-[#f4f4ef] dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent font-medium font-mono"
                                />
                            </div>

                            {/* Statuses for Edition */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-stone-400 tracking-wider">{i18n.language === 'ar' ? 'الحالة العامة' : 'Disponibilité'}</label>
                                    <select 
                                        value={formData.availability}
                                        onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                        className="w-full bg-[#f4f4ef] dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent font-bold text-sm"
                                    >
                                        <option value="disponible">{i18n.language === 'ar' ? 'متاح' : 'Disponible'}</option>
                                        <option value="non disponible">{i18n.language === 'ar' ? 'غير متاح' : 'Offline'}</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase text-stone-400 tracking-wider">{i18n.language === 'ar' ? 'النشاط' : 'Statut'}</label>
                                    <select 
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-[#f4f4ef] dark:bg-stone-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent font-bold text-sm"
                                    >
                                        <option value="libre">{i18n.language === 'ar' ? 'حر' : 'Libre'}</option>
                                        <option value="occupé">{i18n.language === 'ar' ? 'مستغل' : 'Occupé'}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Submit button */}
                            <button 
                                type="submit"
                                className="w-full py-4 mt-8 bg-primary hover:bg-[#32602c] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                            >
                                <span className="material-symbols-outlined">save</span>
                                <span>{i18n.language === 'ar' ? 'حفظ البيانات' : 'Enregistrer'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDelivery;
