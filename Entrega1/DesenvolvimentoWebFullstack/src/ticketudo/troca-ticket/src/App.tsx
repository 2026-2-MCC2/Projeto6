import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './components/Admin/Dashboard';
import Supplier from './components/Supplier/Dashboard';
import Organizer from './components/Organizer/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/supplier" element={<Supplier />} />
        <Route path="/organizer" element={<Organizer />} />
      </Routes>
    </Router>
  );
}

export default App;