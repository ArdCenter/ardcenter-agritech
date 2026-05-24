import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error);
        return;
      }
      
      login({ id: data.id, name: data.name, email: data.email, role: data.role });
      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'expert') {
        navigate('/expert-dashboard');
      } else if (data.role === 'driver') {
        navigate('/delivery-dashboard');
      } else {
        navigate('/products');
      }
    } catch (err) {
      setError(t('server_error') || 'Erreur de connexion au serveur.');
      console.error(err);
    }
  };

  return (
    <div className="bg-[#fafaf5] text-[#1a1c19] min-h-screen flex flex-col font-body">
      <main className="flex-grow flex items-stretch min-h-screen">
        {/* Visual Sidebar */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#1f3a1b]">
          <img alt="Vue aérienne" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfoNktTC117M5m8ZbT1ysuZGSOL0dDdyrw31YK8m9LvTGrpYYoa2CM5wBIcjwXxXzDOxbKLUWAdxHiDQgQ58TSZ0WGJIxwZBNZ12U9Ja62xXIwIpYtKbxeW7hTFaavBMyclhF7uDsNJ5_R1aMm7DgiQ-IwUbxTGUbEam5qvtnVc03KYoS9daSKS8K3KTJ-USIwFBX5hFRpmFiSi1gwoOp5jGZnw1JkzDEStMfFl0irNY0Y9U-WZuKajQ5Dk2UTTFjCjfAejS1m2no" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#152912]/80 via-[#1f3a1b]/30 to-transparent pointer-events-none"></div>
          <div className="relative z-10 p-16 flex flex-col justify-center h-full w-full max-w-2xl mx-auto">
            <div className="inline-flex self-start items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#ccffbe] text-sm font-bold tracking-widest mb-8 shadow-lg">
              {t('back_to_catalog')}
            </div>
            <h2 className="font-headline text-[3.5rem] md:text-6xl font-black text-white leading-tight mb-8 drop-shadow-md">
              {t('hero_title')}
            </h2>
          </div>
        </div>

        {/* Login Form Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-[#fafaf5]">
          <div className="max-w-md w-full space-y-10 mt-12 md:mt-0">
            <div className="space-y-4">
              <div className="lg:hidden mb-8">
                <img src="/logo.png" alt="ARDCENTER" className="h-10 w-auto object-contain" />
              </div>
              <h1 className="font-headline text-4xl font-extrabold text-[#1a1c19] tracking-tight leading-tight">
                {t('login_title')}
              </h1>
              <p className="text-[#40493d] font-medium leading-relaxed">
                {t('login_subtitle')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold border border-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#40493d] ml-1">{t('email')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707a6c]">person</span>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#e8e8e3] border-none focus:ring-2 focus:ring-[#32602c] text-[#1a1c19] placeholder-[#a0aa9c] outline-none transition-all"
                    placeholder="agriculteur@domaine.ma"
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="block text-[14px] font-semibold text-[#40493d] ml-1">{t('password')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707a6c]">lock</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-[#e8e8e3] border-none focus:ring-2 focus:ring-[#32602c] text-[#1a1c19] placeholder-[#a0aa9c] outline-none transition-all tracking-widest text-lg"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${i18n.language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-[#8c8c88] hover:text-stone-700 p-1 flex items-center`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#2E7D32] hover:bg-[#4a7942] text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <span>{t('nav_login')}</span>
                <span className={`material-symbols-outlined ${i18n.language === 'ar' ? 'rotate-180' : ''}`}>arrow_forward</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-[#40493d] font-medium text-[15px]">
                {t('no_account')} 
                <Link to="/signup" className="text-[#32602c] font-bold hover:underline ml-2">{t('signup_title')}</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
