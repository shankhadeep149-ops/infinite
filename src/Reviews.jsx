import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Link } from 'react-router-dom'
import { ChevronLeft, Star, MessageSquare } from 'lucide-react'

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [user, setUser] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Fetch user
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    // Fetch reviews
    fetchReviews()
  }, [])

  async function fetchReviews() {
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
    setReviews(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return alert("Please log in to leave a review.")
    
    setIsSubmitting(true)
    const { error } = await supabase.from('reviews').insert([{
      user_id: user.id,
      user_email: user.email,
      rating: Number(rating),
      comment: comment
    }])

    if (error) {
      alert(error.message)
    } else {
      alert("Thank you for your review!")
      setComment('')
      setRating(5)
      fetchReviews()
    }
    setIsSubmitting(false)
  }

  // Calculate Average Rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <div className="app-container" style={{ paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/" style={{ color: '#333' }}><ChevronLeft /></Link>
        <h2 style={{ margin: '0 0 0 10px' }}>Customer Reviews</h2>
      </div>

      {/* Average Rating Card */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--primary)' }}>{averageRating}</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', margin: '10px 0' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <Star key={star} size={24} fill={star <= Math.round(averageRating) ? '#fbbf24' : 'none'} color="#fbbf24" />
          ))}
        </div>
        <p style={{ margin: 0, color: '#666' }}>Based on {reviews.length} reviews</p>
      </div>

      {/* Add Review Form */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Write a Review</h3>
        {user ? (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  size={32} 
                  fill={star <= rating ? '#fbbf24' : 'none'} 
                  color="#fbbf24" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <textarea 
              placeholder="Share your experience with this product/store..." 
              value={comment} 
              onChange={e => setComment(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '80px', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
            <MessageSquare size={30} color="#94a3b8" style={{ margin: '0 auto' }} />
            <p style={{ color: '#666', margin: '10px 0' }}>You must be logged in to leave a review.</p>
            <Link to="/login" className="btn-small" style={{ display: 'inline-block' }}>Log In Now</Link>
          </div>
        )}
      </div>

      {/* Review List */}
      <h3 style={{ marginBottom: '10px' }}>All Reviews</h3>
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
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#555', lineHeight: '1.4' }}>{review.comment}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', color: '#999' }}>{new Date(review.created_at).toLocaleDateString()}</p>
        </div>
      ))}
      {reviews.length === 0 && <p style={{ textAlign: 'center', color: '#666' }}>No reviews yet. Be the first!</p>}

    </div>
  )
}