import React, { forwardRef, useState, useEffect } from 'react';
import { ROUTES } from 'utils/consts';
import { Link, useHistory } from 'react-router-dom';
import 'components/Header/index.css';

const STORAGE_KEY = 'github_username';

const Header = forwardRef<HTMLHeadElement>((props, ref) => {
  const history = useHistory();
  const [username, setUsername] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    setUsername(localStorage.getItem(STORAGE_KEY));
    // check global rate limit flag
    // eslint-disable-next-line no-undef
    setRateLimited(typeof window !== 'undefined' && !!(window as any).__GITHUB_RATE_LIMITED__);
    // also listen to storage events to update flag if changed elsewhere
    const onStorage = () => {
      // eslint-disable-next-line no-undef
      setRateLimited(typeof window !== 'undefined' && !!(window as any).__GITHUB_RATE_LIMITED__);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const linkAccount = () => {
    const u = window.prompt('Enter your GitHub username (public):', username || '');
    if (!u) return;
    localStorage.setItem(STORAGE_KEY, u);
    setUsername(u);
    history.push(ROUTES.PROFILE);
  };

  return (
    <header className="header__container" ref={ref}>
      <Link to={ROUTES.MAIN} className="header__link">
        <svg width="50" height="50">
          <image className="header__image" href={`${process.env.PUBLIC_URL}/github-logo.svg`} />
        </svg>
        <h2 className="header__link--name header__title">Reporigger</h2>
      </Link>

      <div className="header__account">
        {username ? (
          <>
            <Link to={ROUTES.PROFILE} className="header__account__link">{username}</Link>
            <button type="button" className="header__account__button" onClick={() => { localStorage.removeItem(STORAGE_KEY); setUsername(null); }}>Unlink</button>
          </>
        ) : (
          <button type="button" className="header__account__button" onClick={linkAccount}>Link GitHub</button>
        )}
      </div>

      {rateLimited && (
        <div className="header__rate-limited">GitHub API rate limit reached — add a personal token for full functionality.</div>
      )}
    </header>
  );
});

export default Header;
