'use client';

import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('nav.settings') || 'الإعدادات'}
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg text-center">
        <div className="text-6xl mb-4">⚙️</div>
        <h2 className="text-xl font-bold mb-2">قريباً</h2>
        <p className="text-gray-500">صفحة الإعدادات قيد التطوير</p>
      </div>
    </div>
  );
}
