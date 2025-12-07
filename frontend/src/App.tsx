import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useStore } from './store';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import MapPage from './pages/MapPage';
import LeaderboardPage from './pages/LeaderboardPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import AddPlaceModal from './components/AddPlaceModal';

const App: React.FC = () => {
  const { fetchPlaces, places } = useStore();
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (!hasFetched.current && places.length === 0) {
      hasFetched.current = true;
      fetchPlaces();
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header onAddPlace={() => setShowAddPlaceModal(true)} />
        
        <main className="flex-1 pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<MapPage onAddPlace={() => setShowAddPlaceModal(true)} />} />
            <Route path="/map" element={<MapPage onAddPlace={() => setShowAddPlaceModal(true)} />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/user/:id" element={<UserProfilePage />} />
          </Routes>
        </main>
        
        <BottomNav />
        
        <AddPlaceModal 
          isOpen={showAddPlaceModal} 
          onClose={() => setShowAddPlaceModal(false)} 
        />
      </div>
    </Router>
  );
};

export default App;