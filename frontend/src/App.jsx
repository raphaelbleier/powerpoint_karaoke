import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import HostView from './components/HostView';
import ControllerView from './components/ControllerView';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host/:roomCode" element={<HostView />} />
          <Route path="/controller/:roomCode" element={<ControllerView />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
