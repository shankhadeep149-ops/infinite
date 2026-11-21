import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Login from './Login.jsx'
import Cart from './Cart.jsx'
import Admin from './Admin.jsx'
import ProductDetail from './ProductDetail.jsx'
import MyOrders from './MyOrders.jsx' // <-- Import the new MyOrders page
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        
        {/* Add the My Orders Route */}
        <Route path="/my-orders" element={<MyOrders />} /> 
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)