import React from 'react';
import './home.css';
import Player from 'lottie-react';
import animationData from './chat-animation.json';// Ensure this file exists and is valid JSON
import styles from './home.module.css';
import { Landing } from './components/Landing';
import { useNavigate } from 'react-router-dom';
import randomIcon from './icons/random.png';
import secureIcon from './icons/secure.png';
import globalIcon from './icons/global.png';
import { Signin } from './pages/signin';



const HomePage: React.FC = () => {
  const navigate = useNavigate();  // Get the navigate function from useNavigate

  const handleStartChatting = () => {
    navigate('/landing');  // Navigate to the landing page
  };
  const handleSignUpClick = () => {
    navigate('/signup');};
    const handleSignInClick = () => {
      navigate('/signin'); // Navigate to the Sign In page
    };
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to ConnectNow</h1>
          <p>Connect with people around the globe instantly.</p>
          <div className="cta-buttons">
            <button className="primary-btn" onClick={handleStartChatting}>Start Chatting</button>
            <button className="secondary-btn">Learn More</button>
          </div>
        </div>
        <div className="auth-buttons">
            <button className="sign-in-btn" onClick={handleSignInClick}>
              Sign In
            </button>
            <button className="sign-up-btn" onClick={handleSignUpClick}>
              Sign Up
            </button>
          </div>
        <div className="hero-graphic">
  <Player
    autoplay
    loop
    animationData={animationData} // Correct prop for passing animation data
    style={{ height: '300px', width: '800px' }}
  />
</div>

      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose connectNow?</h2>
        <div className="features-grid">
          <div className="feature-item">
          <img src={randomIcon} alt="Random Match" />
            <h3>video chat</h3>
            <p>Experience authentic face to face encounters with real people from all over the world.</p>
          </div>
          <div className="feature-item">
            <img src={secureIcon} alt="Safe & Secure" />
            <h3>Safety & Moderation</h3>
            <p>We make use of advanced AI technologies and enhanced spam protection to keep your chats clean..</p>
          </div>
          <div className="feature-item">
            <img src={globalIcon} alt="Global Reach" />
            <h3>Global Reach</h3>
            <p>Connect with users from around the world.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-number">1</span>
            <h3>Sign Up</h3>
            <p>Create your free account in minutes.</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>Start Chatting</h3>
            <p>Click "Start Chatting" and get matched instantly.</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>Enjoy</h3>
            <p>Have fun meeting new people!</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2024 RandomChat. All rights reserved.</p>
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/contact">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
