import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tkvyjtsipfwylnmmbwge.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrdnlqdHNpcGZ3eWxubW1id2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTgxNjksImV4cCI6MjA5MDAzNDE2OX0.IMQLGDOeqJQGoOl8aX1LhBnFRsY19fi-bbrE3aGyL6U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'fresh_box' },
});

// ============ API Functions ============
export const productsApi = {
  list: async (params?: any) => {
    let q = supabase.from('products').select('*').eq('is_active', true);
    if (params?.categoryCode) q = q.eq('category_code', params.categoryCode);
    if (params?.limit) q = q.limit(params.limit);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, count: data?.length || 0, data: data || [] };
  },

  stats: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('is_organic, is_local, is_fresh_today')
      .eq('is_active', true);
    if (error) throw error;

    const total = data?.length || 0;
    const organic = data?.filter((p) => p.is_organic).length || 0;
    const local = data?.filter((p) => p.is_local).length || 0;
    const freshToday = data?.filter((p) => p.is_fresh_today).length || 0;

    return { success: true, data: { total, organic, local, freshToday } };
  },
};

export const categoriesApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;

    // ✅ احسب عدد المنتجات لكل تصنيف باستخدام category_code
    const catsWithCount = await Promise.all(
      (data || []).map(async (cat) => {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_code', cat.code)   // ✅ category_code
          .eq('is_active', true);
        return { ...cat, product_count: count || 0 };
      })
    );

    return { success: true, count: catsWithCount.length, data: catsWithCount };
  },
};
