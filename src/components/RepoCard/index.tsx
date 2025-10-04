import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import { Repo } from 'features/reposList/types';
import { formatDate } from 'utils/helpers';
import { RootState } from 'app/rootReducer';
import 'components/RepoCard/index.css';

const RepoCard = memo(({
  id, name, stargazers_count, updated_at, html_url, description, owner, contributors, languages,
}: Partial<Repo>) => {
  const { t } = useTranslation();
  const currentLocale = useSelector((state: RootState) => state.i18n.currentLocale);

  const stackKeywords = ['JavaScript', 'TypeScript', 'React', 'Node', 'Python', 'Go', 'Ruby'];
  const compatible = languages && languages.some(l => stackKeywords.includes(l)) ? 'Likely' : 'Unknown';

  const contributorsCount = contributors ? contributors.length : undefined;
  const communityHealth = (stargazers_count && contributorsCount) ? Math.min(100, Math.round((contributorsCount / Math.max(1, stargazers_count)) * 100)) : undefined;

  return (
    <main className="repo-card__container">
      <div className="repo-card__card">
        <div className="repo-card__inner">
          <div className="repo-card__left">
            <div className="repo-card__title-wrap">
              <h3 className="repo-card__name--title">
                {id ? (
                  <Link
                    to={id.toString()}
                    className="repo-card__name repo-card__name--link"
                    aria-label={name}
                  >
                    {name}
                  </Link>
                ) : name}
              </h3>
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
            {languages && languages.slice(0,3).map((l) => <span className="repo-card__badge" key={l}>{l}</span>)}
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
                <svg className="repo-card__image--octocat">
                  <image href={`${process.env.PUBLIC_URL}/github-logo.svg`} width="17" height="17" />
                </svg>
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
