'use client';

import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 mt-auto">
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div>
          © 2026 {t('app.name')} — {t('app.admin')} 🇸🇦
        </div>
        <div className="flex items-center gap-4">
          <span>v1.0.0</span>
          <a href="#" className="hover:text-primary-600">Help</a>
          <a href="#" className="hover:text-primary-600">Docs</a>
        </div>
      </div>
    </footer>
  );
}
