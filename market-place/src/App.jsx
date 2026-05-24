import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Products from './components/Products';
import ProductDetails from './components/ProductDetails';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Orders from './components/Orders';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import MobileNav from './components/MobileNav';
import MachineRental from './components/MachineRental';
import MachineBooking from './components/MachineBooking';
import PlantDiseaseDetection from './components/PlantDiseaseDetection';

import AdminRoute from './components/Admin/AdminRoute';
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminOrders from './components/Admin/AdminOrders';
import AdminProducts from './components/Admin/AdminProducts';
import AdminExpertReports from './components/Admin/AdminExpertReports';
import AdminExperts from './components/Admin/AdminExperts';
import AdminDelivery from './components/Admin/AdminDelivery';
import DeliveryDashboard from './components/DeliveryDashboard';

import ExpertService from './components/ExpertService';
import ExpertsByCategory from './components/ExpertsByCategory';
import ExpertProfile from './components/ExpertProfile';
import MyExpertConsultations from './components/MyExpertConsultations';
import ExpertChat from './components/ExpertChat';
import ExpertDashboard from './components/Admin/ExpertDashboard';
import ExpertLanding from './components/ExpertLanding';
import ExpertRegister from './components/ExpertRegister';
import ExpertSubscription from './components/ExpertSubscription';
import AdminExpertApplications from './components/Admin/AdminExpertApplications';

const AppContent = () => {
  const { i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Redirect admin to /admin if they try to access a public route
  if (isAdmin && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

  // Redirect driver to /delivery-dashboard if they try to access other pages
  const { user } = useAuth();
  if (user?.role === 'driver' && location.pathname !== '/delivery-dashboard' && location.pathname !== '/profile') {
    return <Navigate to="/delivery-dashboard" replace />;
  }
  
  // Define expert-only routes
  const expertOnlyRoutes = ['/expert-dashboard', '/my-expert-consultations', '/expert-chat'];
  const isExpertRoute = expertOnlyRoutes.some(route => location.pathname.startsWith(route));

  // Protect Expert Routes based on validation status
  if (user?.role === 'expert' && user?.approval_status === 'pending_validation' && isExpertRoute) {
      // Block them from expert dashboards and features
      return <Navigate to="/profile" replace />;
  }

  const needsSubscription = user?.role === 'expert' && 
                           (user?.approval_status === 'approved_waiting_payment' || user?.approval_status === 'expired');
                           
  if (needsSubscription && isExpertRoute) {
      return <Navigate to="/expert-subscription" replace />;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/machine-rental" element={<MachineRental />} />
        <Route path="/machine-rental/:id/booking" element={<MachineBooking />} />
        <Route path="/plant-disease-detection" element={<PlantDiseaseDetection />} />
        
        {/* Expert Onboarding Routes */}
        <Route path="/devenir-expert" element={<ExpertLanding />} />
        <Route path="/expert-register" element={<ExpertRegister />} />
        <Route path="/expert-subscription" element={<ExpertSubscription />} />

        {/* Expert Service Routes */}
        <Route path="/experts" element={<ExpertService />} />
        <Route path="/experts/category/:categoryId" element={<ExpertsByCategory />} />
        <Route path="/experts/profile/:expertId" element={<ExpertProfile />} />
        <Route path="/my-expert-consultations" element={<MyExpertConsultations />} />
        <Route path="/expert-chat/:consultationId" element={<ExpertChat />} />
        <Route path="/expert-dashboard" element={<ExpertDashboard />} />
        <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
        
        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="expert-reports" element={<AdminExpertReports />} />
            <Route path="experts" element={<AdminExperts />} />
            <Route path="expert-applications" element={<AdminExpertApplications />} />
            <Route path="delivery" element={<AdminDelivery />} />
          </Route>
        </Route>
      </Routes>
      {!isAdmin && <MobileNav />}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
