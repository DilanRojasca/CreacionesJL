import React, { useState, useEffect } from 'react';
import Button from '../../components/Button/Button';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import './Home.css';

const Home: React.FC = () => {
  const images = [
    '/shirt%201.jpeg',
    '/shirt%202.jpeg',
    '/shirt%203.jpeg',
    '/shirt%204.jpeg'
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); // Cambia cada 4 segundos

    return () => clearInterval(interval);
  }, [images.length]);

  // Detector de scroll para la sección About Me
  const { elementRef: aboutRef, isVisible: isAboutVisible } = useIntersectionObserver({
    threshold: 0.2, // Se activa cuando el 20% del elemento es visible
  });

  const scrollDown = () => {
    if (aboutRef.current) {
      aboutRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home-container">
      {/* Background Global (Fixed) */}
      <div className="home-background">
        {images.map((image, index) => (
          <div
            key={index}
            className={`background-image ${index === currentImageIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
      </div>

      {/* Overlay Global */}
      <div className="home-overlay"></div>

      {/* Sección Hero / Intro */}
      <section className="hero-section">
        {/* Contenido Hero */}
        <div className="home-content">
          <h1 className="home-title">Creaciones JL</h1>
          <p className="home-tagline">Creamos tus ideas</p>
          <div className="home-buttons">
            <Button to="/catalog" variant="primary" size="large">
              Ver Nuestro Catálogo
            </Button>
          </div>
        </div>

        {/* Indicador de scroll */}
        <button className="scroll-indicator" onClick={scrollDown} aria-label="Scroll down">
          <span className="scroll-arrow">↓</span>
        </button>
      </section>

      {/* Contenedor Principal de Dos Columnas (Profile + About) */}
      <div className="home-grid" ref={aboutRef}>
        {/* Columna Izquierda: Imagen de Perfil */}
        <section className={`profile-column ${isAboutVisible ? 'animate-in-left' : ''}`}>
          <div className="profile-image-wrapper">
            <img 
              src="/JPG JL 04.jpg" 
              alt="Perfil Profesional" 
              className="profile-image"
              loading="lazy"
            />
          </div>
        </section>

        {/* Columna Derecha: About Me */}
        <section className={`about-column ${isAboutVisible ? 'animate-in-right' : ''}`}>
          <div className="about-content">
            <span className="about-greeting">HOLA, MI NOMBRE ES</span>
            <h1 className="about-name">CREACIONES JL</h1>
            <h2 className="about-title">Diseño & Confección</h2>

            <p className="about-description">
              Transformamos ideas en prendas únicas. Con una pasión inquebrantable por el detalle y la calidad, 
              creamos colecciones que fusionan estilo contemporáneo con comodidad absoluta. 
              Cada pieza cuenta una historia de dedicación y artesanía.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;