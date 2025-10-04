import React, { memo, useState, useEffect, useRef } from 'react';
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

  // Emoji reaction flags (persisted in localStorage)
  const [flags, setFlags] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const emojiOptions = [
    { flag: 'red', emoji: '🔴', label: 'Critical' },
    { flag: 'yellow', emoji: '🟡', label: 'At risk' },
    { flag: 'blue', emoji: '🔵', label: 'Info' },
    { flag: 'green', emoji: '🟢', label: 'Healthy' },
    { flag: 'violet', emoji: '🟣', label: 'Popular' },
  ];

  useEffect(() => {
    // load flags for this repo
    if (!id) return;
    const { getFlagsFor } = require('utils/flags');
    const f = getFlagsFor(id);
    setFlags(f);
  }, [id]);

  const toggleFlag = (f: string) => {
    if (!id) return;
    const { toggleFlagFor } = require('utils/flags');
    const updated = toggleFlagFor(id, f as any);
    setFlags(updated);
    setPickerOpen(false);
  };

  // close picker when clicking outside
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!pickerOpen) return;
      if (!pickerRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [pickerOpen]);


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
            {/* Emoji flag reactions */}
            <div className="repo-card__emoji-reactions" ref={null}>
              {flags && flags.map((f) => (
                <button key={f} type="button" className={`repo-card__emoji repo-card__emoji--${f}`} onClick={() => toggleFlag(f)} aria-label={`flag-${f}`}>
                  {f === 'red' ? '🔴' : f === 'yellow' ? '🟡' : f === 'green' ? '🟢' : f === 'violet' ? '🟣' : '🔵'}
                </button>
              ))}
              <button type="button" className="repo-card__emoji-add" onClick={(e) => { e.stopPropagation(); setPickerOpen((v) => !v); }} aria-expanded={pickerOpen} aria-label="add-flag">➕</button>

              {pickerOpen && (
                <div className="repo-card__emoji-picker" role="menu" aria-label="flag-picker" ref={pickerRef}>
                  {emojiOptions.map((opt) => (
                    <button key={opt.flag} type="button" className={`repo-card__emoji repo-card__emoji--${opt.flag}`} onClick={() => toggleFlag(opt.flag)} aria-pressed={flags.includes(opt.flag)}>
                      <span className="repo-card__emoji-icon">{opt.emoji}</span>
                      <span className="repo-card__emoji-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {flag && <span className={`repo-card__flag repo-card__flag--${flag}`} aria-hidden>{
              flag === 'red' ? 'Critical' : flag === 'yellow' ? 'At risk' : flag === 'green' ? 'Healthy' : flag === 'violet' ? 'Popular' : 'Info'
            }</span>}
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
