import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/notifications.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import './App.css';
import { useEffect } from 'react';

const Home = lazy(() => import('./views/Home/Home'));
const LoginForm = lazy(() => import('./views/LoginForm/LoginForm'));
const RegisterForm = lazy(() => import('./views/RegisterForm/RegisterForm'));
const Catalog = lazy(() => import('./views/Catalog/Catalog').then(m => ({ default: m.Catalog })));
const CartView = lazy(() => import('./views/CartView/CartView'));
const ProfileView = lazy(() => import('./views/ProfileView/ProfileView'));
  const UpdateProfile = lazy(() => import('./views/UpdateProfile/UpdateProfile'));
  const AdminView = lazy(() => import('./views/AdminView/AdminView'));
  const ForgotPassword = lazy(() => import('./views/ForgotPassword/ForgotPassword'));
  
  function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);

    return null;
  }

  function App() {
    return (
      <AuthProvider>
        <CartProvider>
          <ProductsProvider>
            <Router>
              <div className="App">
                <Navbar />
                <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>}>
                  <ScrollToTop />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/register" element={<RegisterForm />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/cart" element={<CartView />} />
                    <Route path="/profile" element={<ProfileView />} />
                    <Route path="/update-profile" element={<UpdateProfile />} />
                    <Route path="/admin" element={<AdminView />} />
                  </Routes>
                </Suspense>
              <Footer />
              <ToastContainer 
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                limit={3}
              />
            </div>
          </Router>
        </ProductsProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
