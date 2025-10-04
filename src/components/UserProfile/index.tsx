import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Loading from 'components/Loading';
import RepoCard from 'components/RepoCard';
import { fetchUserRepos, fetchLanguages, fetchContributors } from 'api/githubAPI';
import 'components/UserProfile/index.css';

const STORAGE_KEY = 'github_username';

const UserProfile = () => {
  const history = useHistory();
  const [username, setUsername] = useState<string | null>(localStorage.getItem(STORAGE_KEY));
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!username) return;
      setLoading(true);
      setError(null);
      const result = await fetchUserRepos(username);
      if (typeof result === 'string') {
        setError(result);
        setLoading(false);
        return;
      }
      // augment with languages and contributors
      const sliced = result.slice(0, 50);
      const augmented = await Promise.all(sliced.map(async (r) => {
        const [langs, contribs] = await Promise.all([
          r.languages_url ? fetchLanguages(r.languages_url) : [],
          r.contributors_url ? fetchContributors(r.contributors_url) : [],
        ]);
        return { ...r, languages: Array.isArray(langs) ? langs : [], contributors: Array.isArray(contribs) ? contribs : [] };
      }));

      setRepos(augmented);
      setLoading(false);
    };

    load();
  }, [username]);

  const link = () => {
    const u = window.prompt('Enter your GitHub username (public):', username || '');
    if (!u) return;
    localStorage.setItem(STORAGE_KEY, u);
    setUsername(u);
    history.push('/profile');
  };

  if (!username) {
    return (
      <div className="user-profile__empty">
        <p>No GitHub account linked.</p>
        <button type="button" className="btn-link" onClick={link}>Link GitHub account</button>
      </div>
    );
  }

  return (
    <section className="user-profile__container">
      <div className="user-profile__header">
        <h2>{username}</h2>
        <div>
          <button type="button" className="btn-link" onClick={() => { localStorage.removeItem(STORAGE_KEY); setUsername(null); }}>Unlink</button>
          <button type="button" className="btn-link" onClick={link}>Change</button>
        </div>
      </div>

      {loading && <Loading />}
      {error && <div className="user-profile__error">{error}</div>}

      {!loading && !error && (
        <ul className="repo-list user-repos">
          {repos.map((r) => (
            <li key={r.id} className="repo-list--item">
              <RepoCard {...r} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default UserProfile;
