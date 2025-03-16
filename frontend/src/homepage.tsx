import React from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import animationData from './chat-animation.json';
import randomIcon from './icons/random.png';
import secureIcon from './icons/secure.png';
import globalIcon from './icons/global.png';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartChatting = () => navigate('/landing');
  const handleSignUpClick = () => navigate('/signup');
  const handleSignInClick = () => navigate('/signin');

  return (
    <div className="flex flex-col items-center text-center min-h-screen font-sans bg-white">
      {/* Navigation Bar */}
      <nav className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#008cba] to-[#006c9a] bg-clip-text text-transparent">
            ConnectNow
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSignInClick}
            className="text-[#008cba] hover:text-[#006c9a] px-4 py-2 transition-colors duration-300"
          >
            Sign In
          </button>
          <button
            onClick={handleSignUpClick}
            className="bg-[#008cba] text-white px-6 py-2 rounded-full hover:bg-[#007399] transition-colors duration-300 shadow-md"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full flex flex-col md:flex-row items-center justify-between p-8 md:p-16 bg-gradient-to-br from-[#008cba] to-[#006c9a] text-white rounded-b-3xl">
        <div className="md:max-w-lg space-y-6 text-left">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Connect with people around the globe
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-[#ccefff]">
            Instant video chats with new friends from every corner of the world.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={handleStartChatting}
              className="bg-white text-[#008cba] px-8 py-3 rounded-full hover:bg-[#008cba]/10 hover:text-white transition-colors duration-300 shadow-lg font-medium"
            >
              Start Chatting
            </button>
            <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full hover:bg-white hover:text-[#008cba] transition-colors duration-300">
              Learn More
            </button>
          </div>
        </div>

        <div className="mt-10 md:mt-0 md:max-w-lg">
          <Lottie
            autoplay
            loop
            animationData={animationData}
            className="w-full max-w-md h-auto"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 px-8 md:px-16">
        <h2 className="text-3xl font-bold mb-16 text-gray-800">Why Choose ConnectNow?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: randomIcon, title: 'Video Chat', text: 'Experience authentic face to face encounters with real people from all over the world.' },
            { icon: secureIcon, title: 'Safety & Moderation', text: 'We use advanced AI technologies and enhanced spam protection to keep your chats clean.' },
            { icon: globalIcon, title: 'Global Reach', text: 'Connect with users from around the world in just one click.' }
          ].map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 text-center">
              <div className="bg-[#008cba]/20 p-4 rounded-full inline-flex mb-6">
                <img src={feature.icon} alt={feature.title} className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-16 px-8 md:px-16 bg-gray-50">
        <h2 className="text-3xl font-bold mb-16 text-gray-800">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { number: '1', title: 'Sign Up', text: 'Create your free account in minutes with just a few clicks.' },
            { number: '2', title: 'Start Chatting', text: 'Click "Start Chatting" and get matched with someone new instantly.' },
            { number: '3', title: 'Enjoy', text: 'Have fun meeting new people from around the world!' }
          ].map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-[#008cba] text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                {step.number}
              </div>
              {index < 2 && (
                <div className="hidden md:block absolute top-6 left-12 w-full h-0.5 bg-[#008cba]/30"></div>
              )}
              <h3 className="text-xl font-semibold mb-3 text-gray-800">{step.title}</h3>
              <p className="text-gray-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full py-16 px-8 md:px-16 bg-gradient-to-br from-[#008cba] to-[#006c9a] text-white text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to start connecting?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-[#ccefff]">
          Join thousands of users already making meaningful connections around the world.
        </p>
        <button 
          onClick={handleSignUpClick}
          className="bg-white text-[#008cba] px-10 py-4 rounded-full hover:bg-[#008cba]/10 transition-colors duration-300 shadow-lg font-medium text-lg"
        >
          Get Started Now
        </button>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gray-800 text-white py-12 px-8 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">ConnectNow</h3>
              <p className="text-gray-400">Connect with people around the globe instantly through video chat.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-[#008cba] hover:text-[#006c9a] transition-colors duration-300">Privacy Policy</a></li>
                <li><a href="/terms" className="text-[#008cba] hover:text-[#006c9a] transition-colors duration-300">Terms of Service</a></li>
                <li><a href="/contact" className="text-[#008cba] hover:text-[#006c9a] transition-colors duration-300">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>© 2024 ConnectNow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;