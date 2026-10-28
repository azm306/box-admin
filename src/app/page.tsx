'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Leaf, MapPin, Clock } from 'lucide-react';
import { productsApi, categoriesApi } from '@/lib/supabase';

interface Stats {
  total: number;
  organic: number;
  local: number;
  freshToday: number;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, catRes]: any = await Promise.all([
          productsApi.stats(),
          categoriesApi.list(),
        ]);
        setStats(statsRes.data || {});
        setCategories(catRes.data || []);
      } catch (e) {
        console.error('Load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 dark:text-gray-400">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: t('dashboard.totalProducts'), value: stats?.total || 0, icon: Package, color: 'primary' },
    { label: t('dashboard.organicProducts'), value: stats?.organic || 0, icon: Leaf, color: 'emerald' },
    { label: t('dashboard.localProducts'), value: stats?.local || 0, icon: MapPin, color: 'blue' },
    { label: t('dashboard.freshToday'), value: stats?.freshToday || 0, icon: Clock, color: 'orange' },
  ];

  const colorMap: any = {
    primary: 'from-green-500 to-green-700',
    emerald: 'from-emerald-500 to-emerald-700',
    blue: 'from-blue-500 to-blue-700',
    orange: 'from-orange-500 to-orange-700',
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[card.color]} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{card.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4">🏷️ {t('dashboard.categories')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-lg transition">
              <div className="text-lg font-bold mb-1">{cat.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">{cat.name_en}</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-primary-600">{cat.product_count}</div>
                <div className="text-xs text-gray-400">{t('dashboard.product')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
