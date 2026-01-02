import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lobby from './pages/Lobby';
import GamePage from './pages/GamePage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game/:gameSlug" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
