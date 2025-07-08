// start react: bash -> cd brickwyze-homepage -> npm start

import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from './supabaseClient'; // Introducing the supabase client

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import WhoWeAre from './components/WhoWeAre';
import Welcome from './components/Welcome';
import WhyChooseUs from './components/WhyChooseUs';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';

function Homepage() {
  return (
    <>
      <Hero />
      <WhoWeAre />
      <Welcome />
      <WhyChooseUs />
      <HowItWorks />
      <Footer />
    </>
  );
}

function App() {
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
    }

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      {/* Navbar is outside the Router and is only displayed once. All pages will have it */}
      <Navbar />
      <div className="App">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;