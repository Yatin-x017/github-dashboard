import React, { forwardRef, useState, useEffect } from 'react';
import { ROUTES } from 'utils/consts';
import { Link, useHistory } from 'react-router-dom';
import 'components/Header/index.css';

const STORAGE_KEY = 'github_username';

const Header = forwardRef<HTMLHeadElement>((props, ref) => {
  const history = useHistory();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(localStorage.getItem(STORAGE_KEY));
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
    </header>
  );
});

export default Header;
