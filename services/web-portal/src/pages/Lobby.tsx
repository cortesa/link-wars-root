import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import styles from '../App.module.css';

function Lobby() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const games = {
    current: {
      title: "Tower Wars",
      description: "Strategy meets chaos in this multiplayer tower defense game.",
      url: "http://localhost:5174/game.html",
      slug: "tower-wars",
      thumbnail: "http://localhost:5174/thumbnail"
    }
  };

  const activeGame = games.current;

  const startGame = async () => {
    navigate(`/game/${activeGame.slug}`);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={styles.appLayout}>
        
        {/* Menu Overlay */}
        <div className={`${styles.menuOverlay} ${isMenuOpen ? styles.menuOpen : ''}`}>
          <div className={styles.menuContent}>
            <button type="button" className={styles.closeMenuBtn} onClick={toggleMenu}>×</button>
            <nav className={styles.menuNav}>
              <button type="button" className={styles.menuLink} onClick={toggleMenu}>Leaderboard</button>
              <button type="button" className={styles.menuLink} onClick={toggleMenu}>About</button>
            </nav>
          </div>
        </div>

        <Header onMenuToggle={toggleMenu} />

      <div className={styles.content}>
        
        <div className={styles.bannerSection}>
          <div className={styles.adBannerPlaceholder}>Banner Ad</div>
        </div>

        <main className={styles.gameWrapper}>
          <div className={styles.iframeContainer} ref={iframeContainerRef}>
            <iframe 
              src={activeGame.thumbnail} 
              title={`${activeGame.title} - Thumbnail`}
              className={styles.gameThumbnail}
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media"
            />
            <div className={styles.gameOverlay}>
              <button type="button" className={styles.playNowBtn} onClick={startGame}>
                Play now ▶
              </button>
            </div>
          </div>
          <div className={styles.gameInfo}>
            <h1>{activeGame.title}</h1>
            <p>{activeGame.description}</p>
          </div>
        </main>

      </div>

    </div>
  )
}

export default Lobby;
