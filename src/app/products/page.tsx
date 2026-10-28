'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProductModal from '@/components/ProductModal';

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
  supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1000),  // ← أضف هذا
  supabase.from('categories').select('*').eq('is_active', true).limit(200),
]);

      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (e) {
      console.error('Load error:', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      // soft delete
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', deleteConfirm.id);
      if (error) throw error;
      setDeleteConfirm(null);
      loadData();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name?.includes(search) ||
      p.name_en?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('products.title')}</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition"
        >
          <Plus className="w-5 h-5" />
          {t('products.add')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('products.search')}
              className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('products.name')}
                </th>
                <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('products.origin')}
                </th>
                <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('products.price')}
                </th>
                <th className="text-start px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('products.stock')}
                </th>
                <th className="text-end px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                  {t('products.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div>
                        <div className="font-semibold">
                          {i18n.language === 'ar' ? product.name : product.name_en}
                        </div>
                        <div className="text-xs text-gray-500">
                          {i18n.language === 'ar' ? product.name_en : product.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {product.origin}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary-600">
                    {product.price_per_kg
                      ? `${parseFloat(product.price_per_kg).toFixed(2)} ر.س/كجم`
                      : `${parseFloat(product.price_per_piece).toFixed(2)} ر.س/حبة`}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.stock > 50
                          ? 'bg-green-100 text-green-700'
                          : product.stock > 10
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-blue-100 rounded-lg">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setModalOpen(true);
                        }}
                        className="p-2 hover:bg-green-100 rounded-lg"
                      >
                        <Edit className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(product)}
                        className="p-2 hover:bg-red-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {t('products.noProducts')}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadData}
        product={editingProduct}
        categories={categories}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">تأكيد الحذف</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              هل أنت متأكد من حذف "{deleteConfirm.name}"؟
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
