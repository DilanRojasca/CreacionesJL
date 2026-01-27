import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar/Navbar';
import Home from './components/Home/Home';
import LoginForm from './components/LoginForm/LoginForm';
import RegisterForm from './components/RegisterForm/RegisterForm';
import Footer from './components/Footer/Footer';
import { Catalog } from './components/Catalog/Catalog';
import CartView from './components/CartView/CartView';
import ProfileView from './components/ProfileView/ProfileView';
import UpdateProfile from './components/UpdateProfile/UpdateProfile';
import { mockProducts } from './data/mockProducts';
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
        <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/catalog" element={<Catalog products={mockProducts} />} />
            <Route path="/cart" element={<CartView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/update-profile" element={<UpdateProfile />} />
          </Routes>
          <Footer />
        </div>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
