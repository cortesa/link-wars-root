import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import styles from '../App.module.css';

function GamePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { gameSlug } = useParams<{ gameSlug: string }>();

  const games = {
    'tower-wars': {
      title: "Tower Wars",
      description: "Strategy meets chaos in this multiplayer tower defense game.",
      url: "http://localhost:5174/game.html",
      slug: "tower-wars",
      thumbnail: "http://localhost:5174/thumbnail.html"
    }
  };

  const activeGame = games[gameSlug as keyof typeof games] || games['tower-wars'];

  const exitGame = () => {
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={styles.gamePageLayout}>
        
        {/* Menu Overlay */}
        <div className={`${styles.menuOverlay} ${isMenuOpen ? styles.menuOpen : ''}`}>
          <div className={styles.menuContent}>
            <button type="button" className={styles.closeMenuBtn} onClick={toggleMenu}>×</button>
            <nav className={styles.menuNav}>
              <button type="button" onClick={exitGame} className={styles.menuLink}>Exit Game</button>
              <button type="button" className={styles.menuLink} onClick={toggleMenu}>Leaderboard</button>
              <button type="button" className={styles.menuLink} onClick={toggleMenu}>About</button>
            </nav>
          </div>
        </div>

        <Header 
          onMenuToggle={toggleMenu} 
          onLogoClick={exitGame}
          showExitGame={true}
          onExitGame={exitGame}
        />

        <div className={styles.gamePageContent}>
          <iframe 
            ref={iframeContainerRef}
            src={activeGame.url} 
            title={activeGame.title}
            className={styles.gamePageIframe}
            allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media"
          />
        </div>

        <div className={styles.gamePageBanner}>
          <div className={styles.adBannerPlaceholder}>Banner Ad</div>
        </div>

    </div>
  )
}

export default GamePage;
