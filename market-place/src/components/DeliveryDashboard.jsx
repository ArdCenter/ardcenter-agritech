import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

const DeliveryDashboard = () => {
    const { t, i18n } = useTranslation();
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    
    const [orders, setOrders] = useState([]);
    const [driverInfo, setDriverInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!isLoggedIn || !user || user.role !== 'driver') {
            navigate('/login');
            return;
        }
        fetchDashboardData();
    }, [isLoggedIn, user]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch orders
            const ordersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders`);
            const ordersData = await ordersRes.json();
            
            // 2. Fetch driver profile info
            const driversRes = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-persons`);
            const driversData = await driversRes.json();
            
            const currentDriver = driversData.find(d => d.name === user.name);
            setDriverInfo(currentDriver || null);

            // Filter orders assigned to this driver
            const myOrders = (ordersData || []).filter(o => o.assigned_driver === user.name);
            setOrders(myOrders);
        } catch (err) {
            console.error("Error fetching delivery dashboard data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        setIsUpdating(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delivery_status: newStatus })
            });
            if (response.ok) {
                await fetchDashboardData(); // Refresh all
            }
        } catch (err) {
            console.error("Error updating order status:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const toggleAvailability = async () => {
        if (!driverInfo) return;
        const newAvailability = driverInfo.availability === 'disponible' ? 'non disponible' : 'disponible';
        setIsUpdating(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-persons/${driverInfo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availability: newAvailability })
            });
            if (response.ok) {
                setDriverInfo({ ...driverInfo, availability: newAvailability });
            }
        } catch (err) {
            console.error("Error updating availability:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const simulateMovement = async () => {
        if (!driverInfo) return;
        let lat = 33.5731;
        let lng = -7.5898;
        if (driverInfo.gps_position) {
            const parts = driverInfo.gps_position.split(',');
            if (parts.length === 2) {
                lat = parseFloat(parts[0]);
                lng = parseFloat(parts[1]);
            }
        }
        const newLat = (lat + (Math.random() - 0.5) * 0.005).toFixed(4);
        const newLng = (lng + (Math.random() - 0.5) * 0.005).toFixed(4);
        const newGps = `${newLat}, ${newLng}`;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/delivery-persons/${driverInfo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gps_position: newGps })
            });
            if (response.ok) {
                setDriverInfo({ ...driverInfo, gps_position: newGps });
            }
        } catch (err) {
            console.error("Error simulating GPS movement:", err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Préparation': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Expédié': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'En Transit': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'Livré': return 'bg-green-100 text-green-800 border-green-200';
            case 'Annulée': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-stone-100 text-stone-800 border-stone-200';
        }
    };

    const activeDeliveries = orders.filter(o => o.delivery_status !== 'Livré' && o.delivery_status !== 'Annulée');
    const pastDeliveries = orders.filter(o => o.delivery_status === 'Livré' || o.delivery_status === 'Annulée');

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#fafaf5]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#fafaf5] text-[#1a1c19] min-h-screen flex flex-col font-body pt-16" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            <main className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full space-y-10">
                {/* Welcoming Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                            {i18n.language === 'ar' ? 'بوابة التوصيل' : 'Espace Logistique'}
                        </span>
                        <h1 className="text-4xl font-black font-headline text-stone-900 mt-3">
                            {i18n.language === 'ar' ? `مرحباً، ${user.name}` : `Bonjour, ${user.name}`}
                        </h1>
                        <p className="text-stone-500 font-medium mt-1">
                            {driverInfo?.vehicle} - {driverInfo?.delivery_zone}
                        </p>
                    </div>

                    {/* Driver Availability & GPS Simulation */}
                    {driverInfo && (
                        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-stone-900 border border-stone-200 p-4 rounded-2xl shadow-sm">
                            {/* Toggle availability */}
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${driverInfo.availability === 'disponible' ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}`}></span>
                                <button 
                                    onClick={toggleAvailability}
                                    disabled={isUpdating}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${driverInfo.availability === 'disponible' ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100' : 'bg-stone-50 text-stone-600 border-stone-200'}`}
                                >
                                    {driverInfo.availability === 'disponible' ? (i18n.language === 'ar' ? 'نشط (متاح للتوصيل)' : 'Actif (Disponible)') : (i18n.language === 'ar' ? 'غير نشط' : 'Hors Service')}
                                </button>
                            </div>
                            
                            {/* Status */}
                            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${driverInfo.status === 'libre' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                {driverInfo.status === 'libre' ? (i18n.language === 'ar' ? 'حر (انتظار)' : 'Libre (En Attente)') : (i18n.language === 'ar' ? 'مستغل (توصيل جارٍ)' : 'En Livraison')}
                            </div>

                            {/* GPS Position */}
                            <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600">
                                <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                                <span className="font-mono">{driverInfo.gps_position || '33.5731, -7.5898'}</span>
                                <button onClick={simulateMovement} className="p-1 hover:bg-stone-200 rounded text-primary flex items-center justify-center" title="Simuler déplacement">
                                    <span className="material-symbols-outlined text-xs">autorenew</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Active Deliveries Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold font-headline text-stone-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">local_shipping</span>
                        {i18n.language === 'ar' ? 'مهام التوصيل الحالية' : 'Livraisons En Cours'} ({activeDeliveries.length})
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeDeliveries.map((order) => (
                            <div key={order.id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-primary-container" />
                                
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Numéro Commande</p>
                                        <h3 className="text-xl font-bold text-stone-900 font-headline">{order.order_num}</h3>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.delivery_status)}`}>
                                        {order.delivery_status}
                                    </span>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-stone-100">
                                    {/* Client info */}
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{i18n.language === 'ar' ? 'العميل' : 'Client'}</p>
                                        <p className="font-bold text-sm text-stone-900">{order.user_name}</p>
                                        <p className="text-sm text-stone-600 flex items-center gap-1.5 mt-1">
                                            <span className="material-symbols-outlined text-xs text-stone-400">call</span>
                                            <a href={`tel:${order.user_phone}`} className="hover:text-primary transition-colors">{order.user_phone || 'Non renseigné'}</a>
                                        </p>
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{i18n.language === 'ar' ? 'عنوان التسليم' : 'Adresse de Livraison'}</p>
                                        <p className="font-bold text-xs mt-1">{order.farm_name || 'Ferme N/A'}</p>
                                        <p className="text-xs text-stone-600">{order.street}, {order.city} {order.parcel_num ? `(Parcelle: ${order.parcel_num})` : ''}</p>
                                    </div>
                                </div>

                                {/* Logistics Controls */}
                                <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{i18n.language === 'ar' ? 'طريقة الدفع' : 'Paiement'}</span>
                                        <span className="font-black text-sm text-primary uppercase">{order.amount} ({order.payment_method})</span>
                                    </div>

                                    <div className="flex gap-2 w-full sm:w-auto">
                                        {order.delivery_status === 'Préparation' && (
                                            <button 
                                                onClick={() => updateOrderStatus(order.id, 'Expédié')}
                                                disabled={isUpdating}
                                                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">inventory_2</span>
                                                Prise en charge
                                            </button>
                                        )}
                                        {order.delivery_status === 'Expédié' && (
                                            <button 
                                                onClick={() => updateOrderStatus(order.id, 'En Transit')}
                                                disabled={isUpdating}
                                                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">local_shipping</span>
                                                Lancer Transit
                                            </button>
                                        )}
                                        {order.delivery_status === 'En Transit' && (
                                            <button 
                                                onClick={() => updateOrderStatus(order.id, 'Livré')}
                                                disabled={isUpdating}
                                                className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">home_pin</span>
                                                Confirmer Livraison
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {activeDeliveries.length === 0 && (
                        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-sm">
                            <span className="material-symbols-outlined text-6xl text-stone-200 mb-4 font-thin">inbox</span>
                            <p className="text-stone-500 font-bold">
                                {i18n.language === 'ar' ? 'لا يوجد أي طرود بانتظار التوصيل.' : 'Aucun colis à livrer pour le moment.'}
                            </p>
                        </div>
                    )}
                </section>

                {/* History Section */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold font-headline text-stone-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-stone-400">history</span>
                        {i18n.language === 'ar' ? 'سجل التوصيل' : 'Historique des Livraisons'} ({pastDeliveries.length})
                    </h2>

                    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-stone-50 border-b border-stone-200">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Commande</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Client</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Montant</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {pastDeliveries.map((order) => (
                                        <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-stone-900">{order.order_num}</td>
                                            <td className="px-6 py-4 text-xs font-semibold text-stone-500">{order.date}</td>
                                            <td className="px-6 py-4 font-medium text-stone-600">{order.user_name}</td>
                                            <td className="px-6 py-4 font-black text-primary uppercase">{order.amount}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.delivery_status)}`}>
                                                    {order.delivery_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default DeliveryDashboard;
