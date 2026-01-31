import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/notifications.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import Navbar from './components/Navbar/Navbar';
import Home from './views/Home/Home';
import LoginForm from './views/LoginForm/LoginForm';
import RegisterForm from './views/RegisterForm/RegisterForm';
import Footer from './components/Footer/Footer';
import { Catalog } from './views/Catalog/Catalog';
import CartView from './views/CartView/CartView';
import ProfileView from './views/ProfileView/ProfileView';
import UpdateProfile from './views/UpdateProfile/UpdateProfile';
import './App.css';
import './views/LoginForm/LoginForm.css';
import './views/RegisterForm/RegisterForm.css';
import './views/CartView/CartView.css';
import './views/ProfileView/ProfileView.css';
import './views/UpdateProfile/UpdateProfile.css';

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
