'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Clock, MapPin, User, Loader2 } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

   const fetchData = async () => {
    try {
      const { data: ordersData } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      // ✅ Use the actual column names from your table
      const { data: driversData } = await supabase
        .from('drivers')
        .select('id, name, phone');

      setOrders(ordersData || []);
      setDrivers(driversData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    // Optimistic UI update
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: newStatus })
      .eq('id', orderId);
      
    if (error) {
      alert('Error updating status: ' + error.message);
      fetchData(); // Revert on failure
    }
  };

   const handleAssignDriver = async (orderId: string, driverId: string) => {
    if (!driverId) return;

    // ✅ Save the drivers.id (not auth_user_id)
    const { error } = await supabase
      .from('subscriptions')
      .update({ driver_id: driverId })
      .eq('id', orderId);

    if (error) {
      alert('Error assigning driver: ' + error.message);
      return;
    }

    // Update the UI instantly
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, driver_id: driverId } : o))
    );
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Orders (طلبات)</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                <div>
                  <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                
                {/* Action Controls */}
                <div className="flex flex-wrap gap-2">
                  {/* Status Dropdown */}
                  <select 
                    value={order.status}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border outline-none cursor-pointer ${
                      order.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    <option value="active">Active / Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* Assign Driver Dropdown */}
                                    <select
                    value={order.driver_id || ''}
                    onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200 outline-none cursor-pointer"
                  >
                    <option value="">-- Assign Driver --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option> 
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {order.customer_name} - {order.customer_phone}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {order.delivery_address}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Day: {order.delivery_day} - {order.delivery_time_slot}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-gray-500">Total</span>
                <span className="text-xl font-bold text-green-600">{order.total_price} SAR</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
