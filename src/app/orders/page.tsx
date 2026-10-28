'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Clock, MapPin, User, Loader2, Star } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter((o) =>
    statusFilter === 'all' ? true : o.status === statusFilter
  );

  // ✅ Only online drivers appear in the dropdown
  const availableDrivers = drivers.filter(
    (d) => d.is_available !== false
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: ordersData } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      // ✅ Include is_available so we can filter
      const { data: driversData } = await supabase
        .from('drivers')
        .select('id, name, phone, is_available');

      setOrders(ordersData || []);
      setDrivers(driversData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: newStatus })
      .eq('id', orderId);
    if (error) {
      alert('Error updating status: ' + error.message);
      fetchData();
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    if (!driverId) return;
    const { error } = await supabase
      .from('subscriptions')
      .update({ driver_id: driverId })
      .eq('id', orderId);
    if (error) {
      alert('Error assigning driver: ' + error.message);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, driver_id: driverId } : o))
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Orders (طلبات)</h1>

      {/* Status Filter Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'active', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium ${
              statusFilter === status
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No orders match this filter</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
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
                      order.status === 'active'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : order.status === 'delivered'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    <option value="active">Active / Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* ✅ Assign Driver Dropdown — only available drivers */}
                  <select
                    value={order.driver_id || ''}
                    onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200 outline-none cursor-pointer"
                  >
                    <option value="">-- Assign Driver --</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                    {availableDrivers.length === 0 && (
                      <option value="" disabled>
                        (No drivers available)
                      </option>
                    )}
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

              {/* ✅ Structured address preview */}
              {(order.city || order.street || order.house_no) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium text-gray-700 mb-1">📍 Full Address:</p>
                  <p className="text-gray-600">
                    {[
                      order.city,
                      order.district,
                      order.street,
                      order.house_no && `House ${order.house_no}`,
                      order.floor_no && `Floor ${order.floor_no}`,
                      order.flat_no && `Flat ${order.flat_no}`,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}

              {/* ✅ Drivers availability indicator (optional debug) */}
              {availableDrivers.length === 0 && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  All drivers are currently offline
                </p>
              )}

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-gray-500">Total</span>
                <span className="text-xl font-bold text-green-600">
                  {order.total_price} SAR
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
