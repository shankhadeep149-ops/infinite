import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Package, TrendingUp, ShieldAlert, UploadCloud, Trash2, AlertOctagon, RefreshCw, Search } from 'lucide-react'
import logo from './assets/logo.png' 

export default function Admin() {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('home')
  
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  
  // Form State
  const [addType, setAddType] = useState('single') 
  const [newProduct, setNewProduct] = useState({ name: '', desc: '', sellPrice: '', buyPrice: '', stock: '' })
  const [productImage, setProductImage] = useState(null)
  const [selectedKitItems, setSelectedKitItems] = useState([]) 
  const [kitSearch, setKitSearch] = useState('') 
  const [isPublishing, setIsPublishing] = useState(false)

  // Reset States
  const [profitResetDate, setProfitResetDate] = useState(localStorage.getItem('profitResetDate') || null)
  const [dashboardResetDate, setDashboardResetDate] = useState(localStorage.getItem('dashboardResetDate') || null)
  const [ordersResetDate, setOrdersResetDate] = useState(localStorage.getItem('ordersResetDate') || null)
  
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: adminData } = await supabase.from('admins').select('*').eq('id', session.user.id).single()
        if (!adminData) {
          alert("Access Denied: You are not an Organizer.")
          navigate('/')
        } else {
          setSession(session)
          setIsAdmin(true)
        }
      }
    })
  }, [navigate])

  useEffect(() => {
    if (session && isAdmin) {
      fetchProducts()
      fetchOrders()
    }
  }, [session, isAdmin])

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').eq('item_type', 'single').order('id', { ascending: false })
    setProducts(data || [])
  }

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select(`
      *, 
      order_items (quantity, price_at_time, products (name, wholesale_price))
    `).order('created_at', { ascending: false })
    setOrders(data || [])
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    else window.location.reload() 
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        alert("Invalid file type. Please upload a PNG or JPG image.")
        e.target.value = null
        setProductImage(null)
        return
      }
      setProductImage(file)
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (Number(newProduct.buyPrice) >= Number(newProduct.sellPrice)) {
      return alert("Buy Price must be less than Selling Price to make a profit!")
    }

    setIsPublishing(true)
    let uploadedImageUrl = 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=500'

    if (productImage) {
      const fileExt = productImage.name.split('.').pop().toLowerCase()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, productImage)
      if (uploadError) {
        alert("Error uploading image: " + uploadError.message)
        setIsPublishing(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
      uploadedImageUrl = publicUrl
    }

    const { data: newItem, error } = await supabase.from('products').insert([{
      name: newProduct.name,
      description: newProduct.desc,
      price: Number(newProduct.sellPrice),
      wholesale_price: Number(newProduct.buyPrice),
      stock: Number(newProduct.stock),
      image_url: uploadedImageUrl,
      item_type: addType
    }]).select()

    if (error) {
      alert(error.message)
      setIsPublishing(false)
      return
    }

    if (addType === 'kit' && selectedKitItems.length > 0) {
      const { error: linkError } = await supabase
        .from('products')
        .update({ kit_id: newItem[0].id })
        .in('id', selectedKitItems)
      
      if (linkError) alert("Kit created, but error linking items: " + linkError.message)
    }

    alert(`${addType === 'kit' ? 'Kit' : 'Product'} Published successfully!`)
    setNewProduct({ name: '', desc: '', sellPrice: '', buyPrice: '', stock: '' })
    setProductImage(null)
    setSelectedKitItems([])
    setKitSearch('') 
    setActiveTab('home')
    fetchProducts()
    setIsPublishing(false)
  }

  // --- UPDATED: ASK FOR DELIVERY DAYS BEFORE DISPATCHING ---
  const markDelivered = async (orderId) => {
    const daysInput = window.prompt("Enter estimated delivery days (e.g., 3):", "3")
    if (daysInput === null) return; // If admin clicks cancel, stop
    
    const days = Number(daysInput)
    if (isNaN(days) || days <= 0) return alert("Please enter a valid number of days.")

    const { error } = await supabase.from('orders').update({ 
      status: 'Delivered', 
      estimated_days: days 
    }).eq('id', orderId)
    
    if (error) alert("Error updating order: " + error.message)
    else fetchOrders()
  }

  const handleDeleteOrder = async (orderId) => {
    const confirmDelete = window.confirm(`Remove Order #${orderId} from the Manage Orders list? (It will still count towards your Total Sales and Profit).`)
    if (!confirmDelete) return

    const { error } = await supabase.from('orders').update({ is_deleted: true }).eq('id', orderId)
    if (error) {
      alert("Error removing order from view: " + error.message)
    } else {
      fetchOrders()
    }
  }

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Discard "${productName}"?`)) return
    await supabase.from('products').delete().eq('id', productId)
    fetchProducts()
  }

  const handleOutOfStock = async (productId) => {
    if (!window.confirm(`Mark as Out of Stock?`)) return
    await supabase.from('products').update({ stock: 0 }).eq('id', productId)
    fetchProducts()
  }

  const handleRestock = async (productId, currentName) => {
    const newStockStr = window.prompt(`Enter new stock for "${currentName}":`, "10")
    if (!newStockStr) return
    await supabase.from('products').update({ stock: Number(newStockStr) }).eq('id', productId)
    fetchProducts()
  }

  const totalSales = orders.filter(o => !dashboardResetDate || new Date(o.created_at) >= new Date(dashboardResetDate)).reduce((sum, o) => sum + o.total_amount, 0)
  const activeOrders = orders.filter(o => o.status === 'Pending' && (!dashboardResetDate || new Date(o.created_at) >= new Date(dashboardResetDate))).length
  const totalProfit = orders.filter(o => o.status === 'Delivered' && (!profitResetDate || new Date(o.created_at) >= new Date(profitResetDate))).reduce((sum, o) => {
    return sum + o.order_items.reduce((iSum, item) => iSum + ((item.price_at_time - (item.products?.wholesale_price || 0)) * item.quantity), 0)
  }, 0)

  const filteredKitProducts = products.filter(p => p.name.toLowerCase().includes(kitSearch.toLowerCase()))

  if (!session || !isAdmin) {
    return (
      <div className="app-container center-content">
        <div className="auth-card" style={{ borderTop: '5px solid #d97706' }}>
          <img src={logo} alt="Infinite Logo" style={{ height: '60px', objectFit: 'contain', marginBottom: '15px' }} />
          <h2 style={{ color: '#d97706' }}>Organizer Login</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="admin@infinite.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary" style={{ background: '#d97706' }}>Login to Dashboard →</button>
          </form>
          <p className="auth-toggle" onClick={() => navigate('/')}>Back to Student Store</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container" style={{ paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        {activeTab !== 'home' && <ArrowLeft onClick={() => setActiveTab('home')} style={{ cursor: 'pointer', marginRight: '10px' }} />}
        <h2 style={{ margin: 0 }}>
          {activeTab === 'home' && 'Organizer Dashboard'}
          {activeTab === 'add' && 'Add Product / Kit'}
          {activeTab === 'orders' && 'Manage Orders'}
          {activeTab === 'profit' && 'Profit & Stock'}
          {activeTab === 'inventory' && 'Manage Inventory'}
        </h2>
      </div>

      {activeTab === 'home' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', marginBottom: '20px' }}>
            <div className="stat-box blue" style={{ flex: 1 }}><p>Total Sales</p><h3>₹{totalSales}</h3></div>
            <div className="stat-box yellow" style={{ flex: 1 }}><p>New Orders</p><h3>{activeOrders} Active</h3></div>
            <button onClick={() => { localStorage.setItem('dashboardResetDate', new Date().toISOString()); setDashboardResetDate(new Date().toISOString()); }} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '12px', padding: '0 15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
              <RefreshCw size={20} /><span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px' }}>Renew</span>
            </button>
          </div>

          <button className="btn-primary" style={{ background: '#bfdbfe', color: '#1e3a8a', border: '1px solid #93c5fd' }} onClick={() => setActiveTab('add')}><Plus size={18} /> Add Product / Kit</button>
          <button className="btn-primary" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', marginTop: '10px' }} onClick={() => setActiveTab('orders')}><Package size={18} /> Manage New Orders</button>
          <button className="btn-primary" style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', marginTop: '10px' }} onClick={() => setActiveTab('inventory')}><AlertOctagon size={18} /> Manage Inventory</button>
          <button className="btn-primary" style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', marginTop: '10px' }} onClick={() => setActiveTab('profit')}><TrendingUp size={18} /> Stock & Unit Profit</button>
        </div>
      )}

      {activeTab === 'add' && (
        <form onSubmit={handleAddProduct} className="auth-card" style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', background: '#e5e7eb', borderRadius: '8px', padding: '4px', marginBottom: '15px' }}>
            <button type="button" onClick={() => setAddType('single')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: addType === 'single' ? 'white' : 'transparent', fontWeight: 'bold', color: addType === 'single' ? 'var(--primary)' : '#666', boxShadow: addType === 'single' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}>Single Product</button>
            <button type="button" onClick={() => setAddType('kit')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: addType === 'kit' ? 'white' : 'transparent', fontWeight: 'bold', color: addType === 'kit' ? 'var(--primary)' : '#666', boxShadow: addType === 'kit' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}>Project Kit</button>
          </div>

          <div style={{ border: '2px dashed #93c5fd', background: productImage ? '#eff6ff' : '#f0f9ff', padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '15px', cursor: 'pointer', position: 'relative' }}>
            <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            {productImage ? <div style={{ color: '#1e3a8a', fontWeight: 'bold' }}>✓ {productImage.name} selected</div> : <div style={{ color: '#3b82f6', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}><UploadCloud size={24} /><span>[ + Upload {addType === 'kit' ? 'Kit' : 'Product'} Image ]</span></div>}
          </div>
          
          <input placeholder={`${addType === 'kit' ? 'Kit' : 'Product'} Name`} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
          <input placeholder="Description" value={newProduct.desc} onChange={e => setNewProduct({...newProduct, desc: e.target.value})} required />
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '3px', display: 'block' }}>Selling Price (₹)</label>
              <input type="number" placeholder="e.g. 1500" value={newProduct.sellPrice} onChange={e => setNewProduct({...newProduct, sellPrice: e.target.value})} required style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '3px', display: 'block' }}>Total Buy Price (₹)</label>
              <input type="number" placeholder="e.g. 1100" value={newProduct.buyPrice} onChange={e => setNewProduct({...newProduct, buyPrice: e.target.value})} required style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          
          <input type="number" placeholder={`Stock Qty (How many ${addType === 'kit' ? 'kits' : 'items'} available?)`} value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} required />

          {addType === 'kit' && (
            <div style={{ marginTop: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Select Items for this Kit:</label>
              
              <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #ccc', borderRadius: '6px', padding: '5px 10px', marginBottom: '10px' }}>
                <Search size={16} color="#666" />
                <input 
                  type="text" 
                  placeholder="Search products to add..." 
                  value={kitSearch}
                  onChange={(e) => setKitSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', marginLeft: '8px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {filteredKitProducts.length === 0 && <p style={{ fontSize: '0.8rem', color: '#666' }}>No products found.</p>}
                {filteredKitProducts.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedKitItems.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedKitItems([...selectedKitItems, p.id])
                        else setSelectedKitItems(selectedKitItems.filter(id => id !== p.id))
                      }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>{p.name} (₹{p.price})</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <button type="submit" className="btn-green" style={{ marginTop: '15px' }} disabled={isPublishing}>
            {isPublishing ? 'Publishing...' : `Publish ${addType === 'kit' ? 'Kit' : 'Product'} to Store ✓`}
          </button>
        </form>
      )}

      {activeTab === 'inventory' && (
        <div>
          {products.map(p => (
            <div key={p.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '15px' }}>
              <div style={{ display: 'flex', width: '100%', gap: '15px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#f0f4f8', flexShrink: 0 }}>
                  {p.image_url ? <img src={p.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.6rem', color: '#999' }}>No Pic</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{p.name}</h4>
                  <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 'bold' }}>Sell: ₹{p.price}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: p.stock === 0 ? '#ef4444' : '#666', fontWeight: p.stock === 0 ? 'bold' : 'normal' }}>{p.stock === 0 ? 'OUT OF STOCK' : `Stock: ${p.stock} units`}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '15px' }}>
                {p.stock > 0 ? (
                  <button onClick={() => handleOutOfStock(p.id)} style={{ flex: 1, padding: '8px', background: '#fef3c7', color: '#92400e', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Out of Stock</button>
                ) : (
                  <button onClick={() => handleRestock(p.id, p.name)} style={{ flex: 1, padding: '8px', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Restock</button>
                )}
                <button onClick={() => handleDeleteProduct(p.id, p.name)} style={{ flex: 1, padding: '8px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Discard</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>View and verify incoming orders.</p>
            <button 
              onClick={() => {
                if(window.confirm("Clear the order list view? Past orders are still saved in the database for profit calculation.")) {
                  const now = new Date().toISOString();
                  localStorage.setItem('ordersResetDate', now);
                  setOrdersResetDate(now);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <RefreshCw size={14} /> Clear View
            </button>
          </div>
          
          {orders
            .filter(o => !o.is_deleted)
            .filter(o => {
              if (ordersResetDate && new Date(o.created_at) < new Date(ordersResetDate)) return false;
              return true;
            })
            .map(order => (
            <div key={order.id} className="order-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ margin: 0 }}>Order #{order.id}</h4>
                  <p style={{ margin: '2px 0', fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 'bold' }}>📞 {order.contact_no || 'No contact'}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Pay: {order.payment_method}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
                  <button onClick={() => handleDeleteOrder(order.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px', padding: 0 }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                {order.order_items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '5px' }}>
                    <span>{item.quantity}x {item.products?.name}</span>
                    <span>₹{item.price_at_time * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '15px' }}>
                <span>Total</span><span>₹{order.total_amount}</span>
              </div>

              {order.status === 'Pending' ? (
                <div>
                  {order.payment_method === 'UPI' && (
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 'bold' }}>UPI Name:</p>
                      <h4 style={{ margin: '0 0 10px 0', color: '#1e3a8a' }}>{order.upi_name || 'Not provided'}</h4>
                      <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 'bold' }}>UTR:</p>
                      <h3 style={{ margin: 0, letterSpacing: '2px', color: '#1e3a8a', marginBottom: '10px' }}>{order.utr || 'Not provided'}</h3>
                      {order.screenshot_url ? (
                        <div>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#1e3a8a', fontWeight: 'bold' }}>Screenshot:</p>
                          <a href={order.screenshot_url} target="_blank" rel="noopener noreferrer">
                            <img src={order.screenshot_url} alt="Payment Proof" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #bfdbfe', cursor: 'pointer' }} />
                          </a>
                        </div>
                      ) : <p style={{ fontSize: '0.8rem', color: '#ef4444', fontStyle: 'italic' }}>No screenshot.</p>}
                    </div>
                  )}
                  <button className="btn-primary" style={{ padding: '10px', background: order.payment_method === 'UPI' ? 'var(--accent)' : '#1e3a8a' }} onClick={() => markDelivered(order.id)}>
                    {order.payment_method === 'UPI' ? '✓ Verify Payment & Dispatch' : 'Mark as Delivered'}
                  </button>
                </div>
              ) : (
                <p style={{ color: 'var(--accent)', fontWeight: 'bold', textAlign: 'center' }}>Order Completed ✓</p>
              )}
            </div>
          ))}
          {orders.filter(o => !o.is_deleted).length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>No orders to show.</p>}
        </div>
      )}

      {activeTab === 'profit' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', marginBottom: '20px' }}>
            <div className="stat-box green" style={{ flex: 1, marginBottom: 0 }}><p>Net Founder Profit (Delivered)</p><h3>₹{totalProfit}</h3></div>
            <button onClick={() => { localStorage.setItem('profitResetDate', new Date().toISOString()); setProfitResetDate(new Date().toISOString()); }} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '12px', padding: '0 15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}>
              <RefreshCw size={20} /><span style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px' }}>Renew</span>
            </button>
          </div>
          {products.map(p => (
            <div key={p.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '5px' }}><strong>{p.name}</strong>{p.stock <= 5 && <span style={{ color: 'red', fontSize: '0.8rem', fontWeight: 'bold' }}>Low Stock!</span>}</div>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>Buy: ₹{p.wholesale_price || 0} → Sell: ₹{p.price} (+₹{p.price - (p.wholesale_price || 0)} profit/unit)</span>
            </div>
          ))}
        </div>
      )}

      <div className="bottom-nav">
        <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>Orders</button>
        <button onClick={() => setActiveTab('inventory')} className={activeTab === 'inventory' ? 'active' : ''}>Inventory</button>
      </div>

    </div>
  )
}