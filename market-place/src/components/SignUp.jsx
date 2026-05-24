import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const SignUp = () => {
  const { t, i18n } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError(t('passwords_not_match'));
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${firstName} ${lastName}`, email, password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error);
        return;
      }
      
      login({ id: data.id, name: data.name, email: data.email });
      navigate('/products');
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

        {/* Registration Form Section */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-[#fafaf5]">
          <div className="max-w-md w-full space-y-10 mt-12 md:mt-0">
            <div className="space-y-4">
              <div className="lg:hidden mb-8">
                <img src="/logo.png" alt="ARDCENTER" className="h-10 w-auto object-contain" />
              </div>
              <h1 className="font-headline text-4xl font-extrabold text-[#1a1c19] tracking-tight leading-tight">
                {t('signup_title')}
              </h1>
              <p className="text-[#40493d] font-medium leading-relaxed">
                {t('signup_subtitle')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold border border-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[14px] font-semibold text-[#40493d] ml-1" htmlFor="first_name">{t('firstName')}</label>
                  <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-[#e8e8e3] border-none focus:ring-2 focus:ring-[#32602c] text-[#1a1c19] placeholder-[#a0aa9c] outline-none transition-all" id="first_name" placeholder="Mohamed" type="text" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[14px] font-semibold text-[#40493d] ml-1" htmlFor="last_name">{t('lastName')}</label>
                  <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-[#e8e8e3] border-none focus:ring-2 focus:ring-[#32602c] text-[#1a1c19] placeholder-[#a0aa9c] outline-none transition-all" id="last_name" placeholder="Ibn..." type="text" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#40493d] ml-1" htmlFor="email">{t('email')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707a6c]">mail</span>
                  <input required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#e8e8e3] border-none focus:ring-2 focus:ring-[#32602c] text-[#1a1c19] placeholder-[#a0aa9c] outline-none transition-all" id="email" placeholder="contact@domaine.ma" type="email" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#40493d] ml-1" htmlFor="password">{t('password')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707a6c]">lock</span>
                  <input required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#e8e8e3] border-none focus:ring-2 focus:ring-[#32602c] text-[#1a1c19] placeholder-[#a0aa9c] outline-none transition-all tracking-widest text-lg" id="password" placeholder="••••••••" type="password" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[14px] font-semibold text-[#40493d] ml-1" htmlFor="confirm_password">{t('confirm_password')}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#707a6c]">lock</span>
                  <input required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#e8e8e3] border-none focus:ring-2 focus:ring-[#32602c] text-[#1a1c19] placeholder-[#a0aa9c] outline-none transition-all tracking-widest text-lg" id="confirm_password" placeholder="••••••••" type="password" />
                </div>
              </div>

              <button className="w-full bg-[#2E7D32] hover:bg-[#4a7942] text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center space-x-2" type="submit">
                <span>{t('signup_title')}</span>
                <span className={`material-symbols-outlined ${i18n.language === 'ar' ? 'rotate-180' : ''}`}>arrow_forward</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-[#40493d] font-medium text-[15px]">
                {t('have_account')}
                <Link to="/login" className="text-[#32602c] font-bold hover:underline ml-2">{t('nav_login')}</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
