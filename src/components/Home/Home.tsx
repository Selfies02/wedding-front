import React from 'react';
import './Home.css';
import Gallery from '../Gallery/Gallery';
import Videos from '../Videos/Videos';

const Home: React.FC = () => {
  return (
    <div className="wedding-cover">
      <div className="hero-section">
        <div className="overlay"></div>

        <div className="hero-content">
          <h1 className="couple-names">
            Sara <span className="ampersand">&</span> Daniel
          </h1>

          <div className="wedding-date">
            <span className="date-day">26</span>
            <span className="date-month">JULIO</span>
            <span className="date-year">2025</span>
          </div>

          <p className="wedding-quote">
            "Encontrarse fue el inicio, quererse fue un camino,<br />
            y estar juntos será el destino"
          </p>

          <div className="scroll-indicator">
            <div className="chevron"></div>
            <div className="chevron"></div>
            <div className="chevron"></div>
          </div>
        </div>
      </div>
      <Gallery />
      <Videos />
    </div>
  );
};

export default Home;
