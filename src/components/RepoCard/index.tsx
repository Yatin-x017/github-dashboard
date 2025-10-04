import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import { Repo } from 'features/reposList/types';
import { formatDate } from 'utils/helpers';
import { RootState } from 'app/rootReducer';
import 'components/RepoCard/index.css';

const RepoCard = memo(({
  id, name, stargazers_count, updated_at, html_url, description, owner, contributors, languages, language,
}: Partial<Repo>) => {
  const { t } = useTranslation();
  const currentLocale = useSelector((state: RootState) => state.i18n.currentLocale);

  // Use primary language provided by search results (language) or fallback to languages array
  const primaryLang = language || (languages && languages.length > 0 ? languages[0] : undefined);

  const stackKeywords = ['JavaScript', 'TypeScript', 'React', 'Node', 'Python', 'Go', 'Ruby'];
  const compatible = primaryLang && stackKeywords.includes(primaryLang) ? 'Likely' : 'Unknown';

  const contributorsCount = contributors ? contributors.length : undefined;
  const communityHealth = (stargazers_count && contributorsCount) ? Math.min(100, Math.round((contributorsCount / Math.max(1, stargazers_count)) * 100)) : undefined;

  // Determine a colored flag representing repo health / issues / status
  const computeFlag = () => {
    // priority checks
    const text = `${name || ''} ${(description || '')}`.toLowerCase();
    if (text.includes('deprecated') || text.includes('unmaintained') || text.includes('archive')) return 'red';

    // parse updated_at
    try {
      if (updated_at) {
        const updated = new Date(updated_at).getTime();
        const now = Date.now();
        const days = (now - updated) / (1000 * 60 * 60 * 24);
        if (days > 365) return 'red';
        if (days > 180) return 'yellow';
        if (days <= 30 && (communityHealth || 0) >= 30) return 'green';
      }
    } catch (e) {
      // ignore
    }

    // low engagement
    if ((contributorsCount === 0 || contributorsCount === undefined) && (stargazers_count || 0) < 10) return 'yellow';

    // popular projects
    if ((stargazers_count || 0) >= 5000) return 'violet';

    // docs / examples
    if (text.includes('example') || text.includes('demo') || text.includes('tutorial')) return 'blue';

    // fallback
    return 'blue';
  };

  const flag = computeFlag();


  return (
    <main className="repo-card__container">
      <div className="repo-card__card">
        <div className="repo-card__inner">
          <div className="repo-card__left">
            <div className="repo-card__title-wrap">
              <h3 className="repo-card__name--title">
                {html_url ? (
                  <a
                    href={html_url}
                    className="repo-card__name repo-card__name--link"
                    aria-label={name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {name}
                  </a>
                ) : (id ? (
                  <Link
                    to={id.toString()}
                    className="repo-card__name repo-card__name--link"
                    aria-label={name}
                  >
                    {name}
                  </Link>
                ) : name)}
              </h3>
              {primaryLang && <span className="repo-card__language">{primaryLang}</span>}
              {description && <div className="repo-card__description">{description}</div>}
            </div>
          </div>

          <div className="repo-card__meta">
            {stargazers_count !== undefined && stargazers_count >= 0 && (
              <div className="repo-card__point">
                <span className="icon--purple">&#9733;</span>
                &nbsp;
                <strong>{stargazers_count.toLocaleString(currentLocale)}</strong>
              </div>
            )}
            {contributorsCount !== undefined && (
              <div className="repo-card__point">
                <span className="icon--gray">&#128101;</span>
                &nbsp;
                <strong>{contributorsCount}</strong>
              </div>
            )}
            {communityHealth !== undefined && (
              <div className="repo-card__point repo-card__point--health">
                Community: <strong>{communityHealth}%</strong>
              </div>
            )}
            {updated_at && (
              <span className="repo-card__point repo-card__point--last-edited">
                {`${t('last_update')}:`}
                &nbsp;
                {`${formatDate(updated_at, currentLocale)}`}
              </span>
            )}
          </div>
        </div>

        <div className="repo-card__footer">
          <div className="repo-card__badges">
            <span className="repo-card__badge">Compatible: {compatible}</span>
            {primaryLang && <span className="repo-card__badge">{primaryLang}</span>}
            {!primaryLang && languages && languages.slice(0,3).map((l) => <span className="repo-card__badge" key={l}>{l}</span>)}
          </div>

          {html_url && (
            <div className="repo-card__point">
              <a
              href={html_url}
              className="repo-card__name repo-card__name--link"
              aria-label={t('repo')}
              target="_blank"
              rel="noopener noreferrer"
            >
              {new URL(html_url).pathname.slice(1)}
            </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}, shallowEqual);

export default RepoCard;
