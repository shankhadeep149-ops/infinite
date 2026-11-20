import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, LogOut, ShieldAlert } from 'lucide-react'

export default function App() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch products
    supabase.from('products').select('*').then(({ data }) => setProducts(data || []))
    
    // Check Auth & Admin Status
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('id', data.user.id)
          .single()
        if (adminData) setIsAdmin(true)
      }
    })
  }, [])

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="app-container">
      <header className="top-bar">
        <h3 style={{ margin: 0, color: 'var(--primary)' }}>Infinite</h3>
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
            
            {/* Product Image */}
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
              {/* OUT OF STOCK TAG */}
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
    </div>
  )
}