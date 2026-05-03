import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t, i18n } = useTranslation();

  return (
    <footer className="bg-stone-100 dark:bg-stone-950 w-full border-t border-stone-200 dark:border-stone-800">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 px-10 py-12 max-w-7xl mx-auto text-left">
        <div className="col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo-transparent.png" alt="" className="h-10 w-auto object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-black text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-stone-900 via-primary to-primary-container">
                ARD<span className="font-medium">CENTER</span>
              </span>
              <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-stone-400 mt-0.5">Agriculture Excellence</span>
            </div>
          </div>
          <p className="text-stone-500 text-sm max-w-xs mb-6">{t('footer_desc')}</p>
          <div className="flex gap-4">
            <a className="material-symbols-outlined p-2 bg-stone-200 dark:bg-stone-800 rounded-lg text-stone-600 hover:bg-primary hover:text-white transition-colors" href="#">public</a>
            <a className="material-symbols-outlined p-2 bg-stone-200 dark:bg-stone-800 rounded-lg text-stone-600 hover:bg-primary hover:text-white transition-colors" href="#">mail</a>
          </div>
        </div>
        <div className="flex flex-col gap-4 font-inter text-xs uppercase tracking-widest">
          <span className="font-bold text-green-900 dark:text-green-100">{t('market_footer')}</span>
          <a className="text-stone-500 dark:text-stone-400 hover:underline" href="#">{i18n.language === 'ar' ? 'قطاع الهكتار' : 'Sector 4-B'}</a>
          <a className="text-stone-500 dark:text-stone-400 hover:underline" href="#">{i18n.language === 'ar' ? 'تجارة الماشية' : 'Livestock Trading'}</a>
          <a className="text-stone-500 dark:text-stone-400 hover:underline" href="#">{t('cat_seeds')} &amp; {t('livestock_feed')}</a>
        </div>
        <div className="flex flex-col gap-4 font-inter text-xs uppercase tracking-widest">
          <span className="font-bold text-green-900 dark:text-green-100">{t('tech_footer')}</span>
          <a className="text-stone-500 dark:text-stone-400 hover:underline" href="#">Ag-Tech Solutions</a>
          <a className="text-stone-500 dark:text-stone-400 hover:underline" href="#">Soil Analytics</a>
          <a className="text-stone-500 dark:text-stone-400 hover:underline" href="#">IoT Integration</a>
        </div>
        <div className="flex flex-col gap-4 font-inter text-xs uppercase tracking-widest">
          <span className="font-bold text-green-900 dark:text-green-100">{t('company_footer')}</span>
          <a className="text-stone-500 dark:text-stone-400 hover:underline" href="#">{t('contact_us')}</a>
          <a className="text-stone-500 dark:text-stone-400 hover:underline" href="#">{t('delivery_logistics')}</a>
          <a className="text-stone-500 dark:text-stone-400 hover:underline" href="#">{t('privacy_policy')}</a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-10 py-6 border-t border-stone-200 dark:border-stone-800 text-center">
        <p className="text-stone-400 text-[10px] uppercase tracking-widest">{t('copyright')}</p>
      </div>
    </footer>
  );
};

export default Footer;
