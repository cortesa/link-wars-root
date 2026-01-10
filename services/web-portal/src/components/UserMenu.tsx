import { useAuth } from '../auth';
import styles from './UserMenu.module.css';

function UserMenu() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  if (isLoading) {
    return <div className={styles.loading}>...</div>;
  }

  if (!isAuthenticated) {
    return (
      <button type="button" className={styles.loginBtn} onClick={() => login()}>
        Login
      </button>
    );
  }

  return (
    <div className={styles.userMenu}>
      <span className={styles.username}>{user?.username}</span>
      <button type="button" className={styles.logoutBtn} onClick={logout}>
        Logout
      </button>
    </div>
  );
}

export default UserMenu;
