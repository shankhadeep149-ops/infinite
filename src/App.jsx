import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, LogOut, ShieldAlert, Package } from 'lucide-react'
import logo from './assets/logo.png' 

export default function App() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // NEW: State for Splash Screen
  const [showSplash, setShowSplash] = useState(true)
  
  const navigate = useNavigate()

  useEffect(() => {
    // Hide splash screen after 2.8 seconds (2s wait + 0.8s fade out)
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2800)
    
    // Fetch data
    async function loadData() {
      const { data: allProducts } = await supabase.from('products').select('*')
      const processedProducts = await Promise.all((allProducts || []).map(async (p) => {
        if (p.item_type === 'kit') {
          const { data: kitItems } = await supabase.from('products').select('stock').eq('kit_id', p.id)
          const hasOutOfStockItem = kitItems?.some(item => item.stock === 0)
          if (hasOutOfStockItem) return { ...p, stock: 0 } 
        }
        return p
      }))
      setProducts(processedProducts)
    }
    loadData()
    
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: adminData } = await supabase.from('admins').select('*').eq('id', data.user.id).single()
        if (adminData) setIsAdmin(true)
      }
    })

    // Cleanup timer
    return () => clearTimeout(timer)
  }, [])

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      {/* SPLASH SCREEN OVERLAY */}
      {showSplash && (
        <div className="splash-screen">
          <img src={logo} alt="Infinite Logo" className="splash-logo" />
          <div className="splash-text">INFINITE</div>
        </div>
      )}

      {/* MAIN APP CONTENT */}
      <div className="app-container">
        <header className="top-bar">
          <img 
            src={logo} 
            alt="Infinite Logo" 
            style={{ height: '35px', width: 'auto', objectFit: 'contain', cursor: 'pointer' }} 
            onClick={() => navigate('/')}
          />
          
          <Link to="/cart" className="icon-btn"><ShoppingCart size={20} /></Link>
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isAdmin && (
                <Link to="/admin" className="btn-small" style={{ background: '#d97706', color: 'white' }}>
                  <ShieldAlert size={14} style={{ marginRight: 4 }} /> Admin
                </Link>
              )}
              <button className="icon-btn text-red" onClick={() => { supabase.auth.signOut(); setUser(null); setIsAdmin(false); }}>
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-small">Login</Link>
          )}
        </header>

        <div className="product-list">
          {filteredProducts.map(p => (
            <div key={p.id} className="product-card" onClick={() => navigate('/product/' + p.id)}>
              
              <div className="product-img-placeholder" style={{ overflow: 'hidden', position: 'relative' }}>
                {p.image_url ? (
                  <img 
                    src={p.image_url} 
                    alt={p.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  'Product Pic'
                )}
              </div>

              <div className="product-info">
                <h4>{p.name}</h4>
                <p>₹{p.price}</p>
                {p.stock === 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>OUT OF STOCK</span>
                )}
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No products found.</p>
          )}
        </div>

        {/* MY ORDERS BUTTON */}
        <div style={{ marginTop: '20px', paddingBottom: '20px' }}>
          <Link 
            to="/my-orders" 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px',
              width: '100%', 
              padding: '15px', 
              background: 'white', 
              border: '2px solid #1e3a8a', 
              borderRadius: '12px', 
              color: '#1e3a8a', 
              fontWeight: 'bold', 
              textDecoration: 'none',
              fontSize: '1rem'
            }}
          >
            <Package size={18} /> MY ORDERS
          </Link>
        </div>

      </div>
    </>
  )
}