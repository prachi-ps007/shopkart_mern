import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Signup from './Pages/Signup'
import {Login} from './Pages/Login'
// import {Landing} from './Pages/Landing'
import Home from './Pages/Home'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Products from './Pages/Products'
import ProductDetails from './Pages/ProductDetails'
import Wishlist from './Pages/WishList'
import Cart from './Pages/Cart'
import Checkout from './Pages/Checkout'
import Orders from './Pages/Orders'
import OrderDetails from './Pages/OrderDetails'
function App() {
  

  return (
    <>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<PublicRoute><Signup/></PublicRoute>}/>
          <Route path="/home" element={<ProtectedRoute><Home/></ProtectedRoute>}/>
          <Route path="/login" element={<PublicRoute><Login/></PublicRoute>}/>
          <Route path="/signup" element={<PublicRoute><Signup/></PublicRoute>}/>
          <Route path="/products" element={<Products/>}/>
          <Route path="/products/:id" element={<ProductDetails/>}/>
          <Route path="/wishlist" element={<Wishlist/>}/>
          <Route path="/cart" element={<Cart/>}/>
          <Route path="/checkout" element={<Checkout/>}/>
          <Route path="/orders" element={<Orders/>}/>
          <Route path="/orders/:id" element={<OrderDetails/>}/>
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </>
  )
}

export default App
