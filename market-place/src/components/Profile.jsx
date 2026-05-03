import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { isLoggedIn, user, login } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'profile');

  const initialName = user?.name || "";
  const firstSpaceIndex = initialName.indexOf(' ');
  const initFirst = firstSpaceIndex !== -1 ? initialName.substring(0, firstSpaceIndex) : initialName;
  const initLast = firstSpaceIndex !== -1 ? initialName.substring(firstSpaceIndex + 1) : "";

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(initFirst);
  const [lastName, setLastName] = useState(initLast);
  const [phone, setPhone] = useState(user?.phone || "");

  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: "", location: "", zones: "", surface: "" });
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [allRentals, setAllRentals] = useState([]);
  const [activeAdminTab, setActiveAdminTab] = useState('products');
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState({ message: '', type: '' });
  const [newProduct, setNewProduct] = useState({ name: "", category: "Semences", price: "", description: "", images: [], is_rental: false, rental_period: [], rental_prices: { Jour: "", Semaine: "", Mois: "" } });

  // Load addresses, orders and wishlist on mount
  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
      fetchOrders();
      fetchWishlist();
      fetchAllProducts();
    }
  }, [user?.id]);

  const fetchAllProducts = async () => {
    setIsLoadingAdmin(true);
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
      setIsLoadingAdmin(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsAddingProduct(true);
    setAdminFeedback({ message: '', type: '' });

    // Helper to convert file to Base64
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
        // First image is main
        const mainFile = newProduct.images[0];
        imageBase64 = typeof mainFile === 'string' ? mainFile : await fileToBase64(mainFile);

        // Others are gallery
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
          if (Array.isArray(newProduct.rental_period)) {
              payload.rental_period = newProduct.rental_period.join(', ');
              if (newProduct.rental_period.length > 0) {
                  const firstPeriod = newProduct.rental_period[0];
                  payload.price = `${newProduct.rental_prices[firstPeriod]} DH / ${firstPeriod}`;
              } else {
                  payload.price = 'Sur demande';
              }
          }
          payload.rental_prices = newProduct.rental_prices;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        if (newProduct.is_rental) {
            setAllRentals([data, ...allRentals]);
        } else {
            setAllProducts([data, ...allProducts]);
        }
        setNewProduct({ name: "", category: newProduct.is_rental ? "Tracteurs" : "Semences", price: "", description: "", images: [], is_rental: newProduct.is_rental, rental_period: [], rental_prices: { Jour: "", Semaine: "", Mois: "" } });
        setAdminFeedback({ message: i18n.language === 'ar' ? 'تم إضافة المنتج بنجاح!' : 'Produit ajouté au catalogue avec succès !', type: 'success' });
        setTimeout(() => setAdminFeedback({ message: '', type: '' }), 3000);
      } else {
        setAdminFeedback({ message: `Erreur: ${data.error || 'Impossible d\'ajouter le produit'}`, type: 'error' });
      }
    } catch (err) {
      console.error('Error adding product:', err);
      setAdminFeedback({ message: 'Erreur réseau ou serveur.', type: 'error' });
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (id, isRental) => {
    if (window.confirm('Voulez-vous supprimer ce produit du catalogue ?')) {
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

  const fetchWishlist = async () => {
    setIsLoadingWishlist(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist/${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setWishlistItems(data);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wishlist`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId })
      });
      if (response.ok) {
        setWishlistItems(wishlistItems.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/addresses/${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setAddresses(data);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (newAddress.name && newAddress.location) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, ...newAddress })
        });
        const data = await response.json();
        if (response.ok) {
          setAddresses([...addresses, data]);
          setNewAddress({ name: "", location: "", zones: "", surface: "" });
          setIsAddingAddress(false);
        }
      } catch (err) {
        console.error('Error adding address:', err);
      }
    }
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette adresse ?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/addresses/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setAddresses(addresses.filter(addr => addr.id !== id));
        }
      } catch (err) {
        console.error('Error deleting address:', err);
      }
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${firstName} ${lastName}`, phone })
      });
      if (response.ok) {
        login({ ...user, name: `${firstName} ${lastName}`, phone });
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const getTabClass = (tabName) => {
    const base = "flex items-center gap-3 px-6 py-4 transition-all duration-300 cursor-pointer whitespace-nowrap ";
    return activeTab === tabName
      ? base + "text-primary font-bold bg-primary/10 border-b-2 md:border-b-0 md:border-r-4 border-primary"
      : base + "text-stone-500 hover:bg-stone-100 hover:text-stone-800";
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body pb-32">
      <div className="flex flex-col md:flex-row pt-[72px] w-full min-h-screen">
        {/* Responsive Tab Navigation */}
        <aside className="w-full md:w-64 bg-stone-50 dark:bg-stone-900/50 border-b md:border-b-0 md:border-r border-outline/10 md:h-[calc(100vh-72px)] md:sticky md:top-[72px] shrink-0">
          <div className="hidden md:block p-8 border-b border-outline/10">
            <h2 className="text-xl font-black text-primary tracking-tight font-headline">{user?.name || "Member"}</h2>
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Verified Explorer</p>
          </div>
          
          <nav className="flex md:flex-col overflow-x-auto md:overflow-x-visible hide-scrollbar">
            <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}>
              <span className="material-symbols-outlined">person</span>
              <span>{t('account')}</span>
            </button>
            <button onClick={() => setActiveTab('orders')} className={getTabClass('orders')}>
              <span className="material-symbols-outlined">history</span>
              <span>{t('order_history')}</span>
            </button>
            <button onClick={() => setActiveTab('wishlist')} className={getTabClass('wishlist')}>
              <span className="material-symbols-outlined">favorite</span>
              <span>{t('wishlist')}</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={getTabClass('settings')}>
              <span className="material-symbols-outlined">settings</span>
              <span>{t('settings')}</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-12">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* ... Content remains consistent but wrapped in descriptive headers ... */}

            {/* Tab: Profile */}
            {activeTab === 'profile' && (
              <>
                <section className="space-y-8" id="personal-infos">
                  <div className="flex justify-between items-end border-b border-[#bfcaba]/15 pb-4">
                    <h3 className="text-3xl font-extrabold text-[#1a1c19] font-headline tracking-tight">{t('personal_info')}</h3>
                    {isEditing ? (
                      <span onClick={handleSave} className="text-[#32602c] font-bold text-sm cursor-pointer hover:underline bg-[#e3e3de] px-3 py-1.5 rounded-lg border border-[#32602c]/20">{t('save_button') || 'Enregistrer'}</span>
                    ) : (
                      <span onClick={() => setIsEditing(true)} className="text-[#32602c] font-bold text-sm cursor-pointer hover:underline">{t('edit_button') || 'Modifier'}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#40493d]">{t('firstName') || 'Prénom'}</label>
                      <input
                        className={`w-full bg-[#e8e8e3] border-none rounded-xl px-4 py-3 text-[#1a1c19] outline-none ${isEditing ? 'focus:ring-2 focus:ring-[#32602c] ring-1 ring-[#bfcaba]' : 'opacity-80 cursor-not-allowed'}`}
                        readOnly={!isEditing}
                        onChange={(e) => setFirstName(e.target.value)}
                        type="text"
                        value={firstName}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#40493d]">{t('lastName') || 'Nom'}</label>
                      <input
                        className={`w-full bg-[#e8e8e3] border-none rounded-xl px-4 py-3 text-[#1a1c19] outline-none ${isEditing ? 'focus:ring-2 focus:ring-[#32602c] ring-1 ring-[#bfcaba]' : 'opacity-80 cursor-not-allowed'}`}
                        readOnly={!isEditing}
                        onChange={(e) => setLastName(e.target.value)}
                        type="text"
                        value={lastName}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#40493d]">{t('email') || 'Email'}</label>
                      <input
                        className="w-full bg-[#e8e8e3] border-none rounded-xl px-4 py-3 text-[#1a1c19] outline-none opacity-60 cursor-not-allowed"
                        readOnly
                        type="email"
                        value={user?.email || ""}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#40493d]">{t('phone') || 'Téléphone'}</label>
                      <input
                        className={`w-full bg-[#e8e8e3] border-none rounded-xl px-4 py-3 text-[#1a1c19] outline-none ${isEditing ? 'focus:ring-2 focus:ring-[#32602c] ring-1 ring-[#bfcaba]' : 'opacity-80 cursor-not-allowed'}`}
                        readOnly={!isEditing}
                        onChange={(e) => setPhone(e.target.value)}
                        type="text"
                        value={phone}
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-8" id="addresses">
                  <h3 className="text-2xl font-extrabold text-[#1a1c19] font-headline tracking-tight">{t('my_addresses')}</h3>

                  {isAddingAddress ? (
                    <form onSubmit={handleAddAddress} className="bg-[#f4f4ef] rounded-xl p-6 border border-[#bfcaba]/30 space-y-4">
                      <h4 className="font-bold text-[#32602c] mb-4">{t('add_parcel')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-[#40493d]">{t('farm_name')}</label>
                          <input required value={newAddress.name} onChange={e => setNewAddress({ ...newAddress, name: e.target.value })} className="w-full bg-[#e8e8e3] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#32602c]" type="text" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-[#40493d]">{t('shipping_address')}</label>
                          <input required value={newAddress.location} onChange={e => setNewAddress({ ...newAddress, location: e.target.value })} className="w-full bg-[#e8e8e3] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#32602c]" type="text" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-[#40493d]">{t('zones_num') || 'Zones'}</label>
                          <input value={newAddress.zones} onChange={e => setNewAddress({ ...newAddress, zones: e.target.value })} className="w-full bg-[#e8e8e3] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#32602c]" type="text" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-[#40493d]">{t('surface') || 'Surface'}</label>
                          <input value={newAddress.surface} onChange={e => setNewAddress({ ...newAddress, surface: e.target.value })} className="w-full bg-[#e8e8e3] rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#32602c]" type="text" />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit" className="bg-[#32602c] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#254720]">{t('confirm_order') === 'تأكيد الطلب' ? 'حفظ' : 'Sauvegarder'}</button>
                        <button type="button" onClick={() => setIsAddingAddress(false)} className="bg-[#e8e8e3] text-[#40493d] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#d5d5d0]">{t('back_to_list') === 'العودة إلى القائمة' ? 'إلغاء' : 'Annuler'}</button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {isLoadingAddresses ? (
                        <div className="lg:col-span-3 text-center py-12">
                          <p className="text-[#40493d] font-bold">{t('loading_details')}</p>
                        </div>
                      ) : (
                        <>
                          {addresses.map((addr, idx) => (
                            <div key={addr.id} className="lg:col-span-2 bg-[#f4f4ef] rounded-xl p-6 relative overflow-hidden group border border-[#bfcaba]/30">
                              <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                  {idx === 0 && <span className="bg-[#32602c] text-[#ffffff] text-[10px] font-bold px-2 py-1 rounded inline-block uppercase">{t('primary')}</span>}
                                  {!idx === 0 && <span></span>}
                                  <button onClick={() => handleDeleteAddress(addr.id)} className="material-symbols-outlined text-red-600 hover:text-red-800 transition-colors p-1 bg-white/50 rounded-full">delete</button>
                                </div>
                                <h4 className="text-xl font-bold text-[#32602c] mb-1">{addr.name}</h4>
                                <p className="text-[#40493d] text-sm mb-4">{addr.location}</p>
                              </div>
                                <div className="flex gap-4">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-[#40493d] uppercase">{i18n.language === 'ar' ? 'قطع أراضي' : 'Parcelles'}</span>
                                    <span className="text-lg font-bold text-[#1a1c19]">{addr.zones || '-'}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-[#40493d] uppercase">{i18n.language === 'ar' ? 'المساحة' : 'Superficie'}</span>
                                    <span className="text-lg font-bold text-[#1a1c19]">{addr.surface || '-'}</span>
                                  </div>
                                </div>
                                <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 grayscale group-hover:grayscale-0 transition-all duration-500">
                                  <img alt="Aerial farm view" className="h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4mveaPQVsPKcBRtgOAN_ImGcLvH3bUnKqpm3nmNc5JYsAH6x-_9-01IMlbp09kUIz7eiN6uQQ0o1d_essb9L5GiRFq2bhZiOkR67JQxRNoarsY8PaS3cBQb_O-Q9Y5PGEj-qwC2ZFVNBqYTinwaBMIln-mzdylAgYvX8wi9jzET9ORSb6K0UiXX8eAimaYmz3ysMyHiQFwqs97kzty3nRxava1H6JYbusubq0gnD7XP8XgoC5rs830NkTwE-NuNKrSHsAu_SQVCs" />
                                </div>
                              </div>
                            ))}
                        </>
                      )}

                      <div onClick={() => setIsAddingAddress(true)} className="bg-[#e3e3de] rounded-xl p-6 flex flex-col justify-center items-center border-2 border-dashed border-[#bfcaba]/60 hover:border-[#32602c]/50 transition-colors cursor-pointer min-h-[200px]">
                        <span className="material-symbols-outlined text-[#32602c] text-4xl mb-2">add_location</span>
                        <span className="font-bold text-sm text-[#40493d]">{t('add_parcel')}</span>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Tab: Orders */}
            {activeTab === 'orders' && (
              <section className="space-y-8" id="orders">
                <div className="flex justify-between items-end border-b border-[#bfcaba]/15 pb-4">
                  <h3 className="text-3xl font-extrabold text-[#1a1c19] font-headline tracking-tight">{t('orders_history')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-widest text-[#40493d]">
                        <th className="px-6 py-2">{t('order_id')}</th>
                        <th className="px-6 py-2">Date</th>
                        <th className="px-6 py-2">{t('summary')}</th>
                        <th className="px-6 py-2">{t('status')}</th>
                        <th className="px-6 py-2">{t('action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingOrders ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-stone-500 font-bold">{t('loading_details')}</td>
                        </tr>
                      ) : orders.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-stone-500 font-bold">{t('no_orders_found')}</td>
                        </tr>
                      ) : (
                        orders.map((order) => (
                          <tr key={order.id} className="bg-[#f4f4ef] hover:bg-[#e8e8e3] transition-colors border border-[#bfcaba]/30 rounded-xl">
                            <td className="px-6 py-4 font-bold rounded-l-xl text-[#1a1c19]">{order.order_num}</td>
                            <td className="px-6 py-4 text-sm text-[#40493d]">{order.date}</td>
                            <td className="px-6 py-4 font-bold text-[#1a1c19]">{order.amount}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                                order.status === 'LIVRÉ' ? 'bg-[#c6c8b7] text-[#1a1d12]' : 'bg-[#32602c] text-white'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 rounded-r-xl">
                              <span className="material-symbols-outlined text-[#32602c] cursor-pointer">description</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Tab: Wishlist */}
            {activeTab === 'wishlist' && (
              <section className="space-y-8" id="wishlist">
                <div className="flex justify-between items-end border-b border-[#bfcaba]/15 pb-4">
                  <h3 className="text-3xl font-extrabold text-[#1a1c19] font-headline tracking-tight">Liste d'Envies</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {isLoadingWishlist ? (
                    <div className="md:col-span-2 text-center py-12 text-stone-500 font-bold">Chargement de votre liste d'envies...</div>
                  ) : wishlistItems.length === 0 ? (
                    <div className="md:col-span-2 text-center py-12 text-stone-500 font-bold">Votre liste d'envies est vide.</div>
                  ) : (
                    wishlistItems.map((product) => (
                      <div key={product.id} className="group">
                        <div className="aspect-video w-full rounded-xl overflow-hidden mb-4 relative">
                          <img alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={product.image} />
                          <div onClick={() => removeFromWishlist(product.id)} className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-sm cursor-pointer hover:bg-red-50 transition-colors">
                            <span className="material-symbols-outlined text-[#923357]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-[#1a1c19]">{product.name}</h4>
                            <p className="text-[#40493d] text-sm">{product.category}</p>
                          </div>
                          <span className="text-[#32602c] font-bold">{product.price}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
              <section className="space-y-8 pb-12" id="settings">
                <div className="flex justify-between items-end border-b border-[#bfcaba]/15 pb-4">
                  <h3 className="text-3xl font-extrabold text-[#1a1c19] font-headline tracking-tight">{t('settings')}</h3>
                </div>
                <div className="bg-[#f4f4ef] rounded-2xl p-8 space-y-6 border border-[#bfcaba]/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#1a1c19]">{t('notifications_push')}</h4>
                      <p className="text-sm text-[#40493d]">{i18n.language === 'ar' ? 'تنبيهات حول أسعار السوق وحالة التربة.' : 'Alertes sur les prix du marché et l\'état des sols.'}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input defaultChecked className="sr-only peer" type="checkbox" />
                      <div className="w-11 h-6 bg-[#bfcaba] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#32602c]"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#1a1c19]">{t('sms_alerts')}</h4>
                      <p className="text-sm text-[#40493d]">{i18n.language === 'ar' ? 'ملخص أسبوعي للنشاط.' : 'Résumé hebdomadaire de l\'activité.'}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input className="sr-only peer" type="checkbox" />
                      <div className="w-11 h-6 bg-[#bfcaba] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#32602c]"></div>
                    </label>
                  </div>
                  <div className="pt-4 border-t border-[#bfcaba]/15 flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#1a1c19]">{t('account_language')}</h4>
                      <p className="text-sm text-[#40493d]">{i18n.language === 'ar' ? 'تفضيل عرض واجهة المستخدم.' : 'Préférence d\'affichage de l\'interface.'}</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => i18n.changeLanguage('fr')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${i18n.language === 'fr' ? 'bg-[#32602c] text-white' : 'bg-[#e8e8e3] text-[#40493d]'}`}>Français</button>
                       <button onClick={() => i18n.changeLanguage('ar')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${i18n.language === 'ar' ? 'bg-[#32602c] text-white' : 'bg-[#e8e8e3] text-[#40493d]'}`}>العربية</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Tab: Admin */}
            {activeTab === 'admin' && (
              <section className="space-y-12 pb-24" id="admin">
                <div className="flex justify-between items-end border-b border-red-200/50 pb-4">
                  <div>
                    <h3 className="text-3xl font-extrabold text-[#1a1c19] font-headline tracking-tight">{t('administration')}</h3>
                    <p className="text-xs text-red-600 font-bold uppercase tracking-widest mt-1">{i18n.language === 'ar' ? 'إدارة الدليل' : 'Gestion du catalogue'}</p>
                  </div>
                </div>

                {/* Add Product Form */}
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 border border-[#bfcaba]/30 shadow-sm">
                  <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    {t('add_new_product')}
                  </h4>
                  <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 flex items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                      <label className="text-sm font-bold text-[#40493d]">{t('product_type')}</label>
                      <button type="button" onClick={() => setNewProduct({...newProduct, is_rental: false, category: "Semences"})} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!newProduct.is_rental ? 'bg-primary text-white' : 'bg-surface text-stone-500 hover:bg-stone-50'}`}>{t('product_standard')}</button>
                      <button type="button" onClick={() => setNewProduct({...newProduct, is_rental: true, category: "Tracteurs"})} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${newProduct.is_rental ? 'bg-[#32602c] text-white' : 'bg-surface text-stone-500 hover:bg-stone-50'}`}>{t('rental_machine_admin')}</button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-[#40493d]">{i18n.language === 'ar' ? 'الاسم' : 'Nom'}</label>
                      <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-[#f4f4ef] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent" type="text" placeholder={i18n.language === 'ar' ? 'أدخل اسم المنتج...' : 'Saisissez le nom du produit...'} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-[#40493d]">{i18n.language === 'ar' ? 'الفئة' : 'Catégorie'}</label>
                      <select required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-[#f4f4ef] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent appearance-none">
                        {newProduct.is_rental ? (
                            <>
                                <option value="Tracteurs">{t('cat_tractors')}</option>
                                <option value="Moissonneuses">{t('cat_harvesters')}</option>
                                <option value="Excavatrices">{t('cat_excavators')}</option>
                                <option value="Matériel de Transport">{t('cat_transport')}</option>
                                <option value="Matériel agricole">{t('cat_agri_equipment')}</option>
                            </>
                        ) : (
                            <>
                                <option value="Plantes">{t('cat_plants')}</option>
                                <option value="Semences">{t('cat_seeds')}</option>
                                <option value="Engrais">{t('cat_fertilizers')}</option>
                                <option value="Matériel">{t('cat_equipment')}</option>
                                <option value="Phytosanitaires">{t('cat_phytosanitary')}</option>
                                <option value="Capteurs IoT">{t('cat_iot')}</option>
                            </>
                        )}
                      </select>
                    </div>

                    {newProduct.is_rental && (
                      <div className="space-y-4 md:col-span-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-[#40493d]">Périodes de location possibles</label>
                          <div className="flex gap-4">
                            {['Jour', 'Semaine', 'Mois'].map(period => (
                              <label key={period} className="flex items-center gap-2 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                                  checked={newProduct.rental_period?.includes(period) || false}
                                  onChange={(e) => {
                                    const current = newProduct.rental_period || [];
                                    if (e.target.checked) {
                                      setNewProduct({ ...newProduct, rental_period: [...current, period] });
                                    } else {
                                      setNewProduct({ ...newProduct, rental_period: current.filter(p => p !== period) });
                                    }
                                  }}
                                />
                                <span className="text-sm font-medium text-stone-700">{period}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {newProduct.rental_period && newProduct.rental_period.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                            {newProduct.rental_period.map(period => (
                              <div key={`price-${period}`} className="space-y-1">
                                <label className="text-xs font-bold uppercase text-[#40493d]">Tarif par {period} (MAD) *</label>
                                <input 
                                  required 
                                  value={newProduct.rental_prices[period] || ''} 
                                  onChange={e => setNewProduct({
                                    ...newProduct, 
                                    rental_prices: { ...newProduct.rental_prices, [period]: e.target.value } 
                                  })} 
                                  className="w-full bg-[#f4f4ef] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent" 
                                  type="text" 
                                  placeholder={`ex: ${period === 'Jour' ? '450' : period === 'Semaine' ? '2500' : '9000'}`} 
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {!newProduct.is_rental && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-[#40493d]">Prix</label>
                        <input required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-[#f4f4ef] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent" type="text" placeholder={`ex: 12 500 ${t('currency')}`} />
                      </div>
                    )}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold uppercase text-[#40493d]">{i18n.language === 'ar' ? 'الوصف' : 'Description'}</label>
                      <textarea required value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-[#f4f4ef] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent min-h-[80px]" placeholder={i18n.language === 'ar' ? 'أدخل وصفاً للمنتج...' : 'Brève description du produit...'} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold uppercase text-[#40493d]">Photos du produit (Cliquez plusieurs fois pour en ajouter d'autres)</label>
                      <div className="relative">
                        <input 
                          onChange={e => {
                            const files = Array.from(e.target.files);
                            setNewProduct({
                              ...newProduct, 
                              images: [...newProduct.images, ...files]
                            });
                            e.target.value = ''; // Reset input to allow adding same file again if needed
                          }} 
                          className="w-full bg-[#f4f4ef] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary border border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                          type="file" 
                          accept="image/*"
                          multiple
                        />
                      </div>
                      
                      {newProduct.images && newProduct.images.length > 0 && (
                        <div className="flex flex-wrap gap-4 mt-6">
                          {newProduct.images.map((file, idx) => (
                            <div key={idx} className={`relative w-28 h-28 rounded-2xl overflow-hidden border-2 group transition-all ${idx === 0 ? 'border-primary shadow-lg scale-105' : 'border-stone-100'}`}>
                              <img 
                                src={typeof file === 'string' ? file : URL.createObjectURL(file)} 
                                className="w-full h-full object-cover" 
                                alt="Preview" 
                              />
                              {idx === 0 && (
                                <div className="absolute top-0 right-0 bg-primary text-white text-[9px] px-2 py-1 rounded-bl-xl font-black">{i18n.language === 'ar' ? 'رئيسي' : 'PRINCIPALE'}</div>
                              )}
                              <button 
                                type="button"
                                onClick={() => {
                                  const newImages = [...newProduct.images];
                                  newImages.splice(idx, 1);
                                  setNewProduct({ ...newProduct, images: newImages });
                                }}
                                className="absolute bottom-2 right-2 bg-red-500/90 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          ))}
                          <div 
                            onClick={() => document.querySelector('input[type="file"]').click()}
                            className="w-28 h-28 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 hover:text-primary hover:border-primary/50 transition-all cursor-pointer bg-stone-50/50"
                          >
                            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                            <span className="text-[10px] font-bold mt-1 uppercase">{i18n.language === 'ar' ? 'إضافة' : 'Ajouter'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 pt-2">
                      {adminFeedback.message && (
                        <div className={`mb-4 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${adminFeedback.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                          <span className="material-symbols-outlined">{adminFeedback.type === 'success' ? 'check_circle' : 'error'}</span>
                          {adminFeedback.message}
                        </div>
                      )}
                      <button 
                        type="submit" 
                        disabled={isAddingProduct}
                        className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isAddingProduct ? 'bg-stone-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}`}
                      >
                        {isAddingProduct ? (
                          <>
                            <span className="animate-spin material-symbols-outlined">autorenew</span>
                            {i18n.language === 'ar' ? 'جاري الإضافة...' : 'Ajout en cours...'}
                          </>
                        ) : (
                          <>{t('add_to_catalog_btn')}</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Product Management List */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex bg-[#e8e8e3] p-1 rounded-lg">
                      <button onClick={() => setActiveAdminTab('products')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeAdminTab === 'products' ? 'bg-white shadow-sm text-primary' : 'text-stone-500'}`}>{t('all_products_admin')} ({allProducts.length})</button>
                      <button onClick={() => setActiveAdminTab('rentals')} className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeAdminTab === 'rentals' ? 'bg-white shadow-sm text-primary' : 'text-stone-500'}`}>{t('rental_list')} ({allRentals.length})</button>
                    </div>
                    <button onClick={fetchAllProducts} className="text-primary text-sm flex items-center gap-1 hover:underline">
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      {t('refresh')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {isLoadingAdmin ? (
                      <p className="text-center py-12 text-stone-500 font-bold">Chargement du catalogue...</p>
                    ) : (
                      (activeAdminTab === 'products' ? allProducts : allRentals).map(product => (
                        <div key={product.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-[#bfcaba]/30 flex items-center justify-between group hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100">
                              <img 
                                src={product.image?.startsWith('data:') || product.image?.startsWith('http') 
                                  ? product.image 
                                  : `http://127.0.0.1:5000${product.image}`} 
                                alt={product.name} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div>
                              <h5 className="font-bold text-[#1a1c19]">{product.name}</h5>
                              <p className="text-xs text-[#40493d]">{product.category} • <span className="font-bold text-primary">{product.price}</span></p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteProduct(product.id, product.is_rental)} className="w-10 h-10 rounded-full flex items-center justify-center text-red-200 group-hover:text-red-600 hover:bg-red-50 transition-all">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}

          </div>
        </main>
      </div>

    </div>
  );
};

export default Profile;
