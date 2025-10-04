import React, { memo, useState, useEffect } from 'react';
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

  const [hovered, setHovered] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!hovered) return undefined;
    if (summary) return undefined; // already have summary

    const load = async () => {
      setLoadingSummary(true);
      try {
        // Try to fetch README via API using owner.login and name
        if (owner && (owner as any).login && name) {
          const { fetchReadme } = await import('api/githubAPI');
          const { summarizeToWords } = await import('utils/summarize');
          const readme = await fetchReadme((owner as any).login, name);
          if (typeof readme === 'string') {
            const s = summarizeToWords(readme, 20);
            if (!cancelled) setSummary(s);
          }
        }
        // Fallback to description
        if (!summary && description) {
          const { summarizeToWords } = await import('utils/summarize');
          const s = summarizeToWords(description, 20);
          if (!cancelled) setSummary(s);
        }
      } catch (e) {
        // ignore errors
      } finally {
        if (!cancelled) setLoadingSummary(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [hovered]);

  return (
    <main className="repo-card__container">
      <div className="repo-card__card" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
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
              {hovered && summary && (
                <div className="repo-card__summary" aria-live="polite">
                  {summary}
                </div>
              )}
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
