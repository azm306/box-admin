'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: any;
  categories: any[];
}

export default function ProductModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
}: ProductModalProps) {
  const { t, i18n } = useTranslation();
  const isEdit = !!product?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    image_url: '',
    category_id: '',
    price_per_kg: '',
    price_per_piece: '',
    old_price: '',
    discount: 0,
    unit: 'kg',
    min_weight: '0.5',
    weight_step: '0.25',
    stock: 100,
    origin: '',
    is_organic: false,
    is_local: false,
    is_fresh_today: false,
    is_seasonal: false,
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        name_en: product.name_en || '',
        description: product.description || '',
        description_en: product.description_en || '',
        image_url: product.image_url || '',
        category_id: product.category_id || '',
        price_per_kg: product.price_per_kg?.toString() || '',
        price_per_piece: product.price_per_piece?.toString() || '',
        old_price: product.old_price?.toString() || '',
        discount: product.discount || 0,
        unit: product.unit || 'kg',
        min_weight: product.min_weight?.toString() || '0.5',
        weight_step: product.weight_step?.toString() || '0.25',
        stock: product.stock || 100,
        origin: product.origin || '',
        is_organic: product.is_organic || false,
        is_local: product.is_local || false,
        is_fresh_today: product.is_fresh_today || false,
        is_seasonal: product.is_seasonal || false,
      });
    } else {
      setForm({
        name: '',
        name_en: '',
        description: '',
        description_en: '',
        image_url: '',
        category_id: categories[0]?.id || '',
        price_per_kg: '',
        price_per_piece: '',
        old_price: '',
        discount: 0,
        unit: 'kg',
        min_weight: '0.5',
        weight_step: '0.25',
        stock: 100,
        origin: '',
        is_organic: false,
        is_local: false,
        is_fresh_today: false,
        is_seasonal: false,
      });
    }
  }, [product, categories]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ رفع صورة إلى Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setUploadError('الملف يجب أن يكون صورة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('حجم الصورة يجب أن يكون أقل من 5MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      // اسم فريد للملف
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // رفع
      const { error: uploadErr } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      // الحصول على URL العام
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    } catch (e: any) {
      console.error('Upload error:', e);
      setUploadError(e.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: any = {
        name: form.name,
        name_en: form.name_en,
        description: form.description,
        description_en: form.description_en,
        image_url: form.image_url,
        category_code: form.category_id || null,
        unit: form.unit,
        stock: parseInt(form.stock.toString()) || 0,
        origin: form.origin,
        is_organic: form.is_organic,
        is_local: form.is_local,
        is_fresh_today: form.is_fresh_today,
        is_seasonal: form.is_seasonal,
        discount: parseInt(form.discount.toString()) || 0,
        is_active: true,
      };

      if (form.unit === 'kg') {
        payload.price_per_kg = parseFloat(form.price_per_kg) || null;
        payload.min_weight = parseFloat(form.min_weight) || 0.5;
        payload.weight_step = parseFloat(form.weight_step) || 0.25;
      } else {
        payload.price_per_piece = parseFloat(form.price_per_piece) || null;
      }

      if (form.old_price) payload.old_price = parseFloat(form.old_price);

      if (isEdit) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      console.error('Save error:', e.message, e.details, e.hint, e.code);
      setError(e.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold">
            {isEdit ? 'تعديل منتج' : 'إضافة منتج'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">الاسم (عربي) *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Name (English) *</label>
              <input
                type="text"
                value={form.name_en}
                onChange={(e) => handleChange('name_en', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">الوصف</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={form.description_en}
                onChange={(e) => handleChange('description_en', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
          </div>

          {/* ✅ رفع الصورة */}
          <div>
            <label className="block text-sm font-medium mb-2">صورة المنتج</label>

            {form.image_url ? (
              <div className="relative inline-block">
                <img
                  src={form.image_url}
                  alt="preview"
                  className="w-32 h-32 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 transition"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    <p className="text-sm text-gray-500">جاري الرفع...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="text-sm font-medium">اضغط لرفع صورة</p>
                    <p className="text-xs text-gray-500">PNG, JPG — 5MB max</p>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {uploadError && (
              <p className="text-xs text-red-600 mt-2">{uploadError}</p>
            )}
          </div>

               <div>
              <label className="block text-sm font-medium mb-2">التصنيف</label>
              <select
                value={form.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="">— اختر —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.code || cat.slug || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {form.unit === 'kg' ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">السعر / كجم *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price_per_kg}
                    onChange={(e) => handleChange('price_per_kg', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">الحد الأدنى (كجم)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={form.min_weight}
                    onChange={(e) => handleChange('min_weight', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">السعر / حبة *</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price_per_piece}
                  onChange={(e) => handleChange('price_per_piece', e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">السعر القديم</label>
              <input
                type="number"
                step="0.01"
                value={form.old_price}
                onChange={(e) => handleChange('old_price', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">الخصم (%)</label>
              <input
                type="number"
                value={form.discount}
                onChange={(e) => handleChange('discount', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">المخزون</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">المصدر</label>
              <input
                type="text"
                value={form.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                placeholder="الرياض، السعودية"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { key: 'is_organic', label: 'عضوي' },
              { key: 'is_local', label: 'محلي' },
              { key: 'is_fresh_today', label: 'طازج اليوم' },
              { key: 'is_seasonal', label: 'موسمي' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form as any)[item.key]}
                  onChange={(e) => handleChange(item.key, e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-6 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
