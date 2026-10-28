'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: cats, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;

        const catsWithCount = await Promise.all(
          (cats || []).map(async (cat) => {
            const { count } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('category_code', cat.code)
              .eq('is_active', true);
            return { ...cat, product_count: count || 0 };
          })
        );

        setCategories(catsWithCount);
      } catch (e) {
        console.error('Error:', e);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
        <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition">
          <Plus className="w-5 h-5" />
          {t('categories.add')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition"
          >
            <div className="flex items-start justify-between mb-4">
              <img
                src={cat.image_url}
                alt={cat.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div className="flex gap-1">
                <button className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg">
                  <Edit className="w-4 h-4 text-green-600" />
                </button>
                <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            <div className="text-xl font-bold mb-1">
              {i18n.language === 'ar' ? cat.name : cat.name_en}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {i18n.language === 'ar' ? cat.name_en : cat.name}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('categories.count')}
              </span>
              <span className="text-2xl font-bold text-primary-600">
                {cat.product_count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          لا توجد تصنيفات
        </div>
      )}
    </div>
  );
}
