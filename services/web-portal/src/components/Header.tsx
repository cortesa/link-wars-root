import UserMenu from './UserMenu';
import styles from './Header.module.css';

interface HeaderProps {
  onMenuToggle?: () => void;
  onLogoClick?: () => void;
  showExitGame?: boolean;
  onExitGame?: () => void;
}

function Header({ onMenuToggle, onLogoClick, showExitGame = false, onExitGame }: HeaderProps) {
  return (
    <header className={styles.mainHeader}>
      {/* Mobile Hamburger (Left - Hidden on Desktop) */}
      <button 
        type="button" 
        className={`${styles.hamburgerBtn} ${styles.mobileOnly}`} 
        onClick={onMenuToggle}
      >
        ☰
      </button>
      
      <button 
        type="button" 
        className={styles.logo} 
        onClick={onLogoClick}
      >
        LINK WARS
      </button>
      
      {/* Desktop Nav */}
      <nav className={`${styles.nav} ${styles.desktopOnly}`}>
        {showExitGame && (
          <button 
            type="button" 
            onClick={onExitGame} 
            className={styles.navItem}
          >
            Exit Game
          </button>
        )}
        {!showExitGame && (
          <a href="#" className={styles.navItem}>Play</a>
        )}
        <a href="#" className={styles.navItem}>Leaderboard</a>
        <a href="#" className={styles.navItem}>About</a>
      </nav>

      {/* User Menu - Always visible */}
      <UserMenu />
    </header>
  );
}

export default Header;
