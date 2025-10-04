import React, { useEffect, useState, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { loadRepos } from 'features/reposList/reposSlice';
import { setCurrentPage } from 'features/pagination/pageSlice';
import { setSearchTerm, setIsSearching } from 'features/search/searchSlice';
import useDebounce from 'utils/hooks/useDebounce';
import { RootState } from 'app/rootReducer';
import {
  FIRST_PAGE, INPUT_DEBOUNCE_DELAY, DEFAULT_SEARCH_TERM, REPOS_PER_PAGE,
} from 'utils/consts';
import 'features/search/SearchInput.css';

const SearchInput = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const repos = useSelector((state: RootState) => state.repos, shallowEqual);
  const { currentPage, totalPages } = useSelector((state: RootState) => state.pages, shallowEqual);
  const { searchTerm, isSearching } = useSelector((state: RootState) => state.search, shallowEqual);
  const currentLocale = useSelector((state: RootState) => state.i18n.currentLocale);

  /**
     * Used for catching error in error boundary https://github.com/facebook/react/issues/14981#issuecomment-468460187.
     * Make sure the component or its ascendant
     * is wrapped in withErrorBoundary HOC to throw error safely.
     */
  const [, setErrorBoundary] = useState();

  const trimmedSearch = searchTerm.trim();
  const debouncedSearchTerm = useDebounce(trimmedSearch, INPUT_DEBOUNCE_DELAY);
  const search = debouncedSearchTerm ? `${debouncedSearchTerm} in:name` : DEFAULT_SEARCH_TERM;

  useEffect(() => {
    dispatch(setIsSearching(true));

    (async () => {
      try {
        await dispatch(loadRepos(search, currentPage));
      } catch (error) {
        setErrorBoundary(() => {
          throw error;
        });
      }

      dispatch(setIsSearching(false));
    })();
  },
  // eslint-disable-next-line
        // eslint-disable-next-line react-hooks/exhaustive-deps
  [dispatch, setIsSearching, search, currentPage]);

  // Deep research: for descriptive natural-language queries, fetch README
  // contents of top search results and rank by similarity to the query. This
  // gives repo contents the highest priority in the search hierarchy.
  useEffect(() => {
    const isDescriptive = (q: string) => {
      if (!q) return false;
      const words = q.trim().split(/\s+/);
      return q.length > 20 || words.length >= 3;
    };

    if (!isDescriptive(debouncedSearchTerm)) return;
    if (!repos || repos.length === 0) return;

    (async () => {
      try {
        const { computeSimilarityScores } = await import('utils/semantic');
        const { fetchReadme } = await import('api/githubAPI');
        const { setRepos } = await import('features/reposList/reposSlice');

        // We'll examine up to first N repos to avoid excessive requests
        const N = Math.min(30, repos.length);
        const batch = repos.slice(0, N);

        // Fetch readmes with a small concurrency limit
        const concurrency = 6;
        const readmeResults: (string | null)[] = [];

        for (let i = 0; i < batch.length; i += concurrency) {
          const chunk = batch.slice(i, i + concurrency);
          const promises = chunk.map(async (r: any) => {
            try {
              if (r.owner && r.owner.login && r.name) {
                const md = await fetchReadme(r.owner.login, r.name);
                return md || '';
              }
              return '';
            } catch (e) {
              return '';
            }
          });
          // eslint-disable-next-line no-await-in-loop
          const resolved = await Promise.all(promises);
          readmeResults.push(...resolved);
        }

        // Build docs combining name, description and readme
        const docs = batch.map((r: any, idx: number) => ({
          repo: r,
          text: `${r.name || ''} ${r.description || ''} ${readmeResults[idx] || ''}`,
        }));

        // Rank by similarity to the query
        const getter = (d: any) => d.text || '';
        const rankedDocs = computeSimilarityScores(debouncedSearchTerm, docs, getter);

        // Map back to repo order. computeSimilarityScores returns items from docs
        const rankedRepos = rankedDocs.map((d: any) => d.repo);

        // Append remaining repos (beyond N) preserving their order
        if (repos.length > N) {
          rankedRepos.push(...repos.slice(N));
        }

        // Dispatch ranked repos to store (overrides default search ordering)
        dispatch(setRepos(rankedRepos));
      } catch (e) {
        // ignore deep research failures — fallback to default search
      }
    })();
  }, [debouncedSearchTerm, repos, dispatch]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    dispatch(setCurrentPage(FIRST_PAGE));
    dispatch(setSearchTerm(value));
  };

  const onBlur = () => {
    dispatch(setSearchTerm(trimmedSearch));
  };

  const reposFound = totalPages > 1 ? totalPages * REPOS_PER_PAGE : Object.keys(repos).length;

  const id = 'input-search';

  const renderHint = () => {
    if (isSearching) {
      return <label htmlFor={id} className="search-input__status">{t('search')}</label>;
    }
    if (reposFound) {
      return (
        <label
          htmlFor={id}
          className="search-input__status"
        >
          {`${t('repos_found_approximately')} ${reposFound.toLocaleString(currentLocale)}`}
        </label>
      );
    }
    return null;
  };

  return (
    <section className="search-input__container">
      {useMemo(() => (
        <input
          id={id}
          type="text"
          value={searchTerm}
          placeholder={t('repo_search')}
          onChange={onChange}
          className="search-input"
          aria-label="search"
          onBlur={onBlur}
        />
        // eslint-disable-next-line
          // eslint-disable-next-line react-hooks/exhaustive-deps
      ), [id, searchTerm, t])}
      {renderHint()}
    </section>
  );
};

export default SearchInput;
