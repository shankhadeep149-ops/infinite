import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import { ChevronLeft, CreditCard, Banknote, ShieldCheck, Trash2, Upload } from 'lucide-react'
import gpayQr from './assets/gpay-qr.png' 

export default function Cart() {
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart')) || [])
  const [step, setStep] = useState(1) // 1=Cart, 2=Checkout, 3=UPI Pay, 4=Success
  
  // Checkout States
  const [payment, setPayment] = useState('UPI')
  const [contactNo, setContactNo] = useState('')
  const [upiName, setUpiName] = useState('')
  const [utr, setUtr] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [orderId, setOrderId] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const navigate = useNavigate()

  // Update localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  // Update Quantity function (handles +, -, and deletion)
  const updateQuantity = (index, newQty) => {
    if (newQty === 0) {
      const newCart = cart.filter((_, i) => i !== index)
      setCart(newCart)
    } else {
      const newCart = [...cart]
      newCart[index].quantity = newQty
      setCart(newCart)
    }
  }

  // Calculate total price
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Validate and handle Image Upload
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        alert("Invalid file type. Please upload a PNG or JPG image only.")
        e.target.value = null
        setScreenshot(null)
        return
      }
      setScreenshot(file)
    }
  }

  // Finalize the order, upload proof, and deduct stock
  const finalizeOrder = async () => {
    if (!contactNo || contactNo.length < 10) {
      return alert("Please enter a valid 10-digit contact number.")
    }
    if (payment === 'UPI' && (!upiName || utr.length < 12 || !screenshot)) {
      return alert("Please fill in all UPI details: Name, 12-digit UTR, and upload a screenshot.")
    }

    setIsProcessing(true)
    const { data: { user } } = await supabase.auth.getUser()
    let uploadedScreenshotUrl = null

    // 1. Upload Payment Screenshot
    if (payment === 'UPI' && screenshot) {
      const fileExt = screenshot.name.split('.').pop().toLowerCase()
      const fileName = `${Date.now()}-${user?.id}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot)

      if (uploadError) {
        alert("Error uploading screenshot: " + uploadError.message)
        setIsProcessing(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName)
      
      uploadedScreenshotUrl = publicUrl
    }

    // 2. Create the Main Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{ 
        user_id: user?.id, 
        total_amount: total, 
        payment_method: payment, 
        status: 'Pending',
        contact_no: contactNo,
        upi_name: payment === 'UPI' ? upiName : null, 
        utr: payment === 'UPI' ? utr : null,
        screenshot_url: uploadedScreenshotUrl
      }])
      .select()

    if (orderError) {
      alert(orderError.message)
      setIsProcessing(false)
      return
    }

    const newOrderId = orderData[0].id
    
    // 3. Save Order Items & Deduct Stock
    const orderItems = []
    
    for (const item of cart) {
      // Add to order_items array
      orderItems.push({
        order_id: newOrderId,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      })

      // Check if the purchased item is a Kit
      const { data: kitContents } = await supabase
        .from('products')
        .select('*')
        .eq('kit_id', item.id)

      // If it is a Kit, deduct stock for all internal components
      if (kitContents && kitContents.length > 0) {
        for (const component of kitContents) {
          await supabase.from('products')
            .update({ stock: component.stock - item.quantity })
            .eq('id', component.id)
        }
      }
    }

    // Insert all order items
    await supabase.from('order_items').insert(orderItems)
    
    // 4. Show Success Screen
    setOrderId(newOrderId)
    setStep(4)
    setCart([]) 
    setIsProcessing(false)
  }

  const handlePlaceOrder = () => {
    if (payment === 'UPI') {
      setStep(3) 
    } else {
      if (!contactNo || contactNo.length < 10) {
        return alert("Please go back and enter a valid 10-digit contact number.")
      }
      finalizeOrder() 
    }
  }

  // ===== RENDERERS =====

  if (step === 4) {
    return (
      <div className="app-container center-content">
        <ShieldCheck size={60} color="var(--accent)" style={{ margin: '0 auto' }} />
        <h2 className="text-green" style={{ marginTop: '20px' }}>Order Placed ✓</h2>
        <p style={{ color: '#666' }}>Order ID: #{orderId}</p>
        <div className="order-card" style={{ textAlign: 'left', marginTop: '20px' }}>
          <p><strong>Contact No:</strong> {contactNo}</p>
          <p><strong>Payment:</strong> {payment}</p>
          <p><strong>Status:</strong> Waiting for Organizer Verification</p>
          {payment === 'UPI' && (
            <>
              <p><strong>UPI Name:</strong> {upiName}</p>
              <p><strong>UTR:</strong> {utr}</p>
            </>
          )}
        </div>
        <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>Continue Shopping</button>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <ChevronLeft onClick={() => step > 1 ? setStep(step - 1) : navigate('/')} style={{ cursor: 'pointer' }} />
        <h2 style={{ margin: '0 0 0 10px' }}>
          {step === 1 && "Shopping Cart"}
          {step === 2 && "Checkout"}
          {step === 3 && "UPI Payment"}
        </h2>
      </div>

      {/* --- STEP 1: CART REVIEW --- */}
      {step === 1 && (
        <>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <p style={{ color: '#666' }}>Your cart is empty.</p>
              <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>Go Shopping</button>
            </div>
          ) : (
            <>
              {cart.map((item, i) => (
                <div key={i} className="cart-item" style={{ alignItems: 'center' }}>
                  <div className="product-img-placeholder small">
                    {item.image_url ? <img src={item.image_url} alt={item.name} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'8px'}}/> : 'Pic'}
                  </div>
                  <div style={{flex: 1, marginLeft: '10px'}}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{item.name}</h4>
                    <p style={{ fontWeight: 'bold', margin: 0, color: 'var(--primary)' }}>₹{item.price}</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <button onClick={() => updateQuantity(i, 0)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                      <Trash2 size={16} />
                    </button>
                    <div className="qty-controls">
                      <button onClick={() => updateQuantity(i, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(i, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div style={{ background: 'white', padding: '15px', borderRadius: '12px', marginTop: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  <span>Total Price</span>
                  <span>₹{total}</span>
                </div>
              </div>
              
              <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setStep(2)}>
                Proceed to Checkout
              </button>
            </>
          )}
        </>
      )}

      {/* --- STEP 2: CHECKOUT --- */}
      {step === 2 && (
        <>
          <div style={{ background: 'white', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Contact Number</label>
            <input 
              type="tel" placeholder="e.g. 9876543210" maxLength={10} value={contactNo}
              onChange={(e) => setContactNo(e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', padding: '12px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box', fontSize: '1rem' }}
            />
          </div>

          <div className="payment-methods">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: payment === 'UPI' ? '2px solid var(--primary)' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="radio" checked={payment === 'UPI'} onChange={() => setPayment('UPI')} />
              <div><strong>UPI (GPay)</strong></div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: payment === 'COD' ? '2px solid var(--primary)' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>
              <input type="radio" checked={payment === 'COD'} onChange={() => setPayment('COD')} />
              <div><strong>Cash on Delivery</strong></div>
            </label>
          </div>
          
          <button 
            className="btn-green" 
            style={{ marginTop: '20px', opacity: contactNo.length < 10 ? 0.5 : 1 }} 
            onClick={handlePlaceOrder} 
            disabled={isProcessing || contactNo.length < 10}
          >
            {isProcessing ? 'Processing...' : `Place Order - ₹${total}`}
          </button>
        </>
      )}

      {/* --- STEP 3: UPI PAYMENT & UPLOAD --- */}
      {step === 3 && (
        <div style={{ textAlign: 'center', background: 'white', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ color: '#4285F4' }}>GPay Scanner</h3>
          <div style={{ width: '180px', height: '180px', margin: '0 auto 15px', border: '2px solid #4285F4', borderRadius: '12px', overflow: 'hidden' }}>
            <img src={gpayQr} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <p style={{ fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '15px' }}>₹{total}</p>
          
          <div style={{ textAlign: 'left', marginBottom: '15px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>UPI Account Holder Name</label>
            <input 
              type="text" placeholder="e.g. Shankha Deeph" value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '15px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>12-Digit UTR Number</label>
            <input 
              type="text" placeholder="123456789012" maxLength={12} value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Payment Screenshot (PNG/JPG)</label>
            <div style={{ border: '1px dashed #ccc', padding: '15px', borderRadius: '8px', marginTop: '5px', textAlign: 'center', background: '#f8fafc' }}>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg" 
                onChange={handleFileChange}
                style={{ display: 'none' }} 
                id="file-upload"
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666' }}>
                <Upload size={20} />
                <span style={{ fontSize: '0.8rem', marginTop: '5px' }}>{screenshot ? screenshot.name : 'Click to select image'}</span>
              </label>
            </div>
          </div>

          <button 
            className="btn-green" onClick={finalizeOrder} 
            disabled={isProcessing || utr.length < 12 || !screenshot || !upiName}
            style={{ opacity: (utr.length < 12 || !screenshot || !upiName) ? 0.5 : 1 }}
          >
            {isProcessing ? 'Uploading...' : "Confirm Payment ✓"}
          </button>
        </div>
      )}
    </div>
  )
}