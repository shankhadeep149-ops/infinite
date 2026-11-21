import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Link } from 'react-router-dom'
import { ChevronLeft, Package, CheckCircle2, Clock } from 'lucide-react'

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMyOrders() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('orders')
          .select(`
            *, 
            order_items (quantity, price_at_time, products (name, image_url))
          `)
          .eq('user_id', user.id)
          .eq('is_deleted', false) // Don't show orders deleted by admin
          .order('created_at', { ascending: false })
        
        setOrders(data || [])
      }
      setLoading(false)
    }
    fetchMyOrders()
  }, [])

  if (loading) return <div className="app-container center-content">Loading...</div>

  return (
    <div className="app-container">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/" style={{ color: '#333' }}><ChevronLeft /></Link>
        <h2 style={{ margin: '0 0 0 10px' }}>My Orders</h2>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <Package size={50} color="#ccc" style={{ margin: '0 auto' }} />
          <p style={{ color: '#666', marginTop: '15px' }}>You haven't placed any orders yet.</p>
          <Link to="/" className="btn-primary" style={{ display: 'inline-block', width: 'auto', marginTop: '10px', padding: '10px 20px' }}>Start Shopping</Link>
        </div>
      ) : (
        orders.map(order => (
          <div key={order.id} className="order-card" style={{ marginBottom: '15px' }}>
            {/* Order Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
              <div>
                <h4 style={{ margin: 0 }}>Order #{order.id}</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
            </div>

            {/* Order Items */}
            <div style={{ marginBottom: '15px' }}>
              {order.order_items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#eef2f6', borderRadius: '6px', overflow: 'hidden' }}>
                    {item.products?.image_url ? <img src={item.products.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{item.quantity}x {item.products?.name}</p>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>₹{item.price_at_time * item.quantity}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <span>Total</span>
              <span>₹{order.total_amount}</span>
            </div>

            {/* DELIVERY INSTRUCTION SECTION */}
            <div style={{ marginTop: '15px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {order.status === 'Pending' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706' }}>
                  <Clock size={18} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Waiting for Organizer to verify payment and dispatch.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
                  <CheckCircle2 size={18} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    Dispatched! You will receive your order in {order.estimated_days || 3} days.
                  </span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}