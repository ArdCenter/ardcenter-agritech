import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdminOrders = () => {
    const { t, i18n } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Detail Panel State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    const deliveryMilestones = ['Préparation', 'Expédié', 'En Transit', 'Livré', 'Annulée'];

    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [deliveryPersons, setDeliveryPersons] = useState([]);

    useEffect(() => {
        fetchOrders();
        fetchDeliveryPersons();
    }, []);

    const fetchDeliveryPersons = () => {
        fetch(`${import.meta.env.VITE_API_URL}/api/delivery-persons`)
            .then(res => res.json())
            .then(data => {
                setDeliveryPersons(data || []);
            })
            .catch(err => console.error("Error fetching delivery persons:", err));
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.order_num.toLowerCase().includes(orderSearchTerm.toLowerCase()) || 
            order.user_name.toLowerCase().includes(orderSearchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || order.delivery_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const fetchOrders = () => {
        setIsLoading(true);
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders`)
            .then(res => res.json())
            .then(data => {
                setOrders(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching admin orders:", err);
                setIsLoading(false);
            });
    };

    const updateOrderStatus = async (orderId, updates) => {
        setIsUpdating(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (response.ok) {
                fetchOrders(); // Refresh list
                fetchDeliveryPersons(); // Refresh delivery persons to reflect status changes
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, ...updates });
                }
                if (orderDetails && orderDetails.id === orderId) {
                    setOrderDetails({ ...orderDetails, ...updates });
                }
            }
        } catch (err) {
            console.error("Error updating order:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const openOrderDetails = async (orderNum) => {
        setIsDetailsOpen(true);
        setIsDetailsLoading(true);
        fetchDeliveryPersons(); // Fetch latest driver statuses
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/details/${encodeURIComponent(orderNum)}`);
            if (response.ok) {
                const data = await response.json();
                
                // Fallback: Si une ancienne commande n'a pas de prix unitaire enregistré,
                // on va chercher le prix actuel dans le catalogue
                const hasMissingPrices = data.items?.some(item => !item.unit_price && !item.product_price);
                if (hasMissingPrices) {
                    try {
                        const prodRes = await fetch(`${import.meta.env.VITE_API_URL}/api/products`);
                        if (prodRes.ok) {
                            const products = await prodRes.json();
                            data.items = data.items.map(item => {
                                if (!item.unit_price && !item.product_price) {
                                    const p = products.find(prod => prod.id === item.product_id);
                                    if (p) item.product_price = p.price;
                                }
                                return item;
                            });
                        }
                    } catch (e) {
                        console.error("Erreur lors de la récupération des prix de fallback", e);
                    }
                }

                setOrderDetails(data);
            }
        } catch (err) {
            console.error("Error fetching order details:", err);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const closeOrderDetails = () => {
        setIsDetailsOpen(false);
        setTimeout(() => setOrderDetails(null), 300); // clear after animation
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

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-headline font-black text-stone-900 dark:text-stone-50">Gestion des Commandes</h1>
                    <p className="text-stone-500 dark:text-stone-400 mt-2">Suivi logistique et financier de la plateforme.</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">search</span>
                        <input 
                            type="text" 
                            placeholder="Commande ou Client..." 
                            value={orderSearchTerm}
                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                    
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-48 px-4 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    >
                        <option value="All">Tout Statuts</option>
                        {deliveryMilestones.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>

                    <button onClick={fetchOrders} className="p-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-50 transition-colors shadow-sm">
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/50 dark:border-stone-800/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Commande</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Client</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Montant</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Paiement</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Logistique</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors">
                                    <td className="px-6 py-6 font-bold text-stone-900 dark:text-stone-50">{order.order_num}</td>
                                    <td className="px-6 py-6 font-medium text-stone-600 dark:text-stone-400">{order.user_name}</td>
                                    <td className="px-6 py-6 font-black text-primary uppercase">{order.amount}</td>
                                    <td className="px-6 py-6">
                                        <button 
                                            onClick={() => updateOrderStatus(order.id, { payment_status: order.payment_status === 'Paid' ? 'Unpaid' : 'Paid' })}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${order.payment_status === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
                                        >
                                            {order.payment_status}
                                        </button>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.delivery_status)}`}>
                                            {order.delivery_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {deliveryMilestones.map((milestone) => (
                                                <button
                                                    key={milestone}
                                                    disabled={isUpdating || order.delivery_status === milestone}
                                                    onClick={() => updateOrderStatus(order.id, { delivery_status: milestone })}
                                                    title={milestone}
                                                    className={`
                                                        w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                                        ${order.delivery_status === milestone 
                                                            ? 'bg-primary text-white scale-110' 
                                                            : 'bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-primary'}
                                                    `}
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {milestone === 'Préparation' ? 'inventory_2' : 
                                                         milestone === 'Expédié' ? 'package' : 
                                                         milestone === 'En Transit' ? 'local_shipping' : 'home_pin'}
                                                    </span>
                                                </button>
                                            ))}
                                            <button 
                                                onClick={() => openOrderDetails(order.order_num)}
                                                className="ml-2 px-3 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                            >
                                                Détails
                                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty State */}
            {orders.length === 0 && (
                <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/50 shadow-sm">
                    <span className="material-symbols-outlined text-6xl text-stone-200 mb-4 font-thin">shopping_bag</span>
                    <p className="text-stone-500">Aucune commande enregistrée pour le moment.</p>
                </div>
            )}

            {/* Slide-over Order Details */}
            {isDetailsOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity" 
                        onClick={closeOrderDetails}
                    ></div>
                    
                    {/* Panel */}
                    <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        {isDetailsLoading || !orderDetails ? (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                <p className="text-stone-500 font-bold">Chargement des détails...</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="px-8 py-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-widest text-stone-400 mb-1">Commande</p>
                                        <h2 className="text-2xl font-bold font-headline">{orderDetails.order_num}</h2>
                                    </div>
                                    <button onClick={closeOrderDetails} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                    
                                    {/* General & Payment Info */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-stone-50 dark:bg-stone-800 p-5 rounded-2xl border border-stone-200 dark:border-stone-700">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">payments</span>
                                                Paiement
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-stone-500">Montant Total</span>
                                                    <span className="font-black text-primary">{orderDetails.amount}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-stone-500">Méthode</span>
                                                    <span className="font-bold">{orderDetails.payment_method || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                                                    <span className="text-sm text-stone-500">Statut</span>
                                                    <button 
                                                        onClick={() => updateOrderStatus(orderDetails.id, { payment_status: orderDetails.payment_status === 'Paid' ? 'Unpaid' : 'Paid' })}
                                                        className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border transition-all ${orderDetails.payment_status === 'Paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
                                                    >
                                                        {orderDetails.payment_status}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-stone-50 dark:bg-stone-800 p-5 rounded-2xl border border-stone-200 dark:border-stone-700">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">event</span>
                                                Général
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-stone-500">Date</span>
                                                    <span className="font-bold text-sm">{orderDetails.date}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-4 pt-2 border-t border-stone-200 dark:border-stone-700">
                                                    <span className="text-sm text-stone-500">Statut Global</span>
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusColor(orderDetails.delivery_status)}`}>
                                                        {orderDetails.delivery_status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Client Info */}
                                    <div>
                                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">person</span>
                                            Informations Client
                                        </h3>
                                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Nom Complet</p>
                                                    <p className="font-bold">{orderDetails.user_name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Contact</p>
                                                    <div className="flex gap-2 items-center">
                                                        <p className="font-medium text-sm">{orderDetails.user_phone || 'Non renseigné'}</p>
                                                        {orderDetails.user_phone && (
                                                            <a href={`tel:${orderDetails.user_phone}`} className="text-primary hover:bg-primary/10 p-1 rounded">
                                                                <span className="material-symbols-outlined text-[16px]">call</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 items-center mt-1">
                                                        <p className="font-medium text-sm">{orderDetails.user_email}</p>
                                                        <a href={`mailto:${orderDetails.user_email}`} className="text-primary hover:bg-primary/10 p-1 rounded">
                                                            <span className="material-symbols-outlined text-[16px]">mail</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery Address & Logistics */}
                                    <div>
                                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">local_shipping</span>
                                            Logistique & Livraison
                                        </h3>
                                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Adresse</p>
                                                    <p className="font-bold text-sm mt-1">{orderDetails.farm_name || 'Ferme N/A'}</p>
                                                    <p className="text-sm text-stone-600 dark:text-stone-400">{orderDetails.street}</p>
                                                    <p className="text-sm text-stone-600 dark:text-stone-400">{orderDetails.city} {orderDetails.parcel_num ? `(Parcelle: ${orderDetails.parcel_num})` : ''}</p>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Mettre à jour le statut</label>
                                                        <select 
                                                            value={orderDetails.delivery_status}
                                                            onChange={(e) => updateOrderStatus(orderDetails.id, { delivery_status: e.target.value })}
                                                            className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary font-bold"
                                                        >
                                                            {deliveryMilestones.map(m => <option key={m} value={m}>{m}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">Livreur assigné</label>
                                                        <select 
                                                            value={orderDetails.assigned_driver || ''}
                                                            onChange={(e) => {
                                                                const newDriver = e.target.value;
                                                                updateOrderStatus(orderDetails.id, { assigned_driver: newDriver });
                                                            }}
                                                            className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary font-bold"
                                                        >
                                                            <option value="">-- Non assigné --</option>
                                                            {deliveryPersons
                                                                .filter(p => p.availability === 'disponible' || p.name === orderDetails.assigned_driver)
                                                                .map(p => (
                                                                    <option key={p.id} value={p.name}>
                                                                        {p.name} ({p.vehicle} - {p.delivery_zone}) {p.status === 'occupé' ? '[Occupé]' : ''}
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Products */}
                                    <div>
                                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">inventory_2</span>
                                            Produits Commandés ({orderDetails.items?.length || 0})
                                        </h3>
                                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">
                                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-stone-400">Produit</th>
                                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-stone-400 text-center">Qté</th>
                                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Prix Unitaire</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                                    {orderDetails.items?.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-3 flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                                                                    <img src={item.product_image?.startsWith('http') || item.product_image?.startsWith('data:') ? item.product_image : `${import.meta.env.VITE_API_URL}${item.product_image}`} alt={item.product_name} className="w-full h-full object-cover" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm text-stone-900 dark:text-stone-50 line-clamp-1">{item.product_name}</p>
                                                                    <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest">{item.product_category}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                                                            <td className="px-4 py-3 text-right font-bold text-primary">{item.unit_price || item.product_price || 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
