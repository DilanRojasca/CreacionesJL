import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/notifications.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import Navbar from './components/Navbar/Navbar';
import Home from './components/Home/Home';
import LoginForm from './components/LoginForm/LoginForm';
import RegisterForm from './components/RegisterForm/RegisterForm';
import Footer from './components/Footer/Footer';
import { Catalog } from './components/Catalog/Catalog';
import CartView from './components/CartView/CartView';
import ProfileView from './components/ProfileView/ProfileView';
import UpdateProfile from './components/UpdateProfile/UpdateProfile';
import './App.css';
import './components/LoginForm/LoginForm.css';
import './components/RegisterForm/RegisterForm.css';
import './components/CartView/CartView.css';
import './components/ProfileView/ProfileView.css';
import './components/UpdateProfile/UpdateProfile.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ProductsProvider>
          <Router>
          <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/cart" element={<CartView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/update-profile" element={<UpdateProfile />} />
          </Routes>
          <Footer />
          {/* Configuración global de Toasts */}
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
