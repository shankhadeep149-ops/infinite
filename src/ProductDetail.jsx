import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import { ChevronLeft, ShoppingCart, Star } from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // Product State
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  
  // Review States
  const [reviews, setReviews] = useState([])
  const [user, setUser] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Fetch Product
    supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setProduct(data)
      setLoading(false)
    })
    
    // Fetch User
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    
    // Fetch Reviews for this product
    fetchReviews()
  }, [id])

  async function fetchReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', id)
      .order('created_at', { ascending: false })
    setReviews(data || [])
  }

  const addToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem('cart')) || []
    const itemIndex = existingCart.findIndex(item => item.id === product.id)
    
    if (itemIndex > -1) {
      existingCart[itemIndex].quantity += quantity
    } else {
      existingCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        image_url: product.image_url
      })
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart))
    alert('Added to Cart!')
    navigate('/cart')
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user) return alert("Please log in to leave a review.")
    
    setIsSubmitting(true)
    const { error } = await supabase.from('reviews').insert([{
      product_id: id, // Link review to this specific product
      user_id: user.id,
      user_email: user.email,
      rating: Number(rating),
      comment: comment
    }])

    if (error) {
      alert(error.message)
    } else {
      setComment('')
      setRating(5)
      fetchReviews()
    }
    setIsSubmitting(false)
  }

  // Calculate average rating for this product
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  if (loading) return <div className="app-container center-content">Loading...</div>
  if (!product) return <div className="app-container center-content">Product not found.</div>

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <ChevronLeft onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
        <h2 style={{ margin: '0 0 0 10px' }}>Product Details</h2>
      </div>

      {/* Product Image */}
      <div style={{ width: '100%', height: '250px', background: '#eef2f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', overflow: 'hidden' }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ color: '#93c5fd' }}>Product Image</span>
        )}
      </div>

      {/* Product Info */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>{product.name}</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>{product.description}</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.8rem' }}>₹{product.price}</h3>
          <span style={{ color: product.stock > 0 ? 'var(--accent)' : 'red', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Quantity Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontWeight: '600' }}>Quantity:</span>
          <div className="qty-controls" style={{ background: '#f0f4f8' }}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span style={{ fontWeight: 'bold', width: '30px', textAlign: 'center' }}>{quantity}</span>
            <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button 
          className="btn-primary" 
          onClick={addToCart}
          disabled={product.stock === 0}
          style={{ opacity: product.stock === 0 ? 0.5 : 1, background: product.stock === 0 ? '#ccc' : 'var(--primary)' }}
        >
          <ShoppingCart size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          {product.stock === 0 ? 'Out of Stock' : `Add to Cart - ₹${product.price * quantity}`}
        </button>
      </div>

      {/* ===== REVIEW SECTION ===== */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>Ratings & Reviews</h3>
        
        {/* Average Rating Box */}
        <div style={{ background: 'white', padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--primary)' }}>{averageRating}</h1>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={16} fill={star <= Math.round(averageRating) ? '#fbbf24' : 'none'} color="#fbbf24" />
              ))}
            </div>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#666' }}>{reviews.length} reviews</p>
          </div>
          <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Have you used this product? Let others know what you think!</p>
          </div>
        </div>

        {/* Write a Review Form */}
        {user ? (
          <form onSubmit={handleSubmitReview} style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Write a Review</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  size={28} 
                  fill={star <= rating ? '#fbbf24' : 'none'} 
                  color="#fbbf24" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <textarea 
              placeholder="What did you like or dislike?" 
              value={comment} 
              onChange={e => setComment(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '70px', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.9rem' }}
            />
            <button type="submit" className="btn-primary" style={{ marginTop: '10px', padding: '10px' }} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <p style={{ margin: '0 0 10px 0', color: '#666' }}>Please log in to write a review.</p>
          </div>
        )}

        {/* Reviews List */}
        {reviews.map(review => (
          <div key={review.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '0.9rem', color: '#333' }}>{review.user_email.split('@')[0]}</strong>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={14} fill={star <= review.rating ? '#fbbf24' : 'none'} color="#fbbf24" />
                ))}
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>{review.comment}</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', color: '#999' }}>{new Date(review.created_at).toLocaleDateString()}</p>
          </div>
        ))}
        {reviews.length === 0 && <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>No reviews yet. Be the first to review this product!</p>}
      </div>

    </div>
  )
}