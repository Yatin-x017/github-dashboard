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

  // If the user provides a descriptive query (natural language), perform a
  // lightweight AI-like semantic re-ranking on the fetched repositories.
  useEffect(() => {
    const isDescriptive = (q: string) => {
      if (!q) return false;
      const words = q.trim().split(/\s+/);
      return q.length > 20 || words.length >= 3;
    };

    if (!isDescriptive(debouncedSearchTerm)) return;
    if (!repos || repos.length === 0) return;

    // Dynamically import the semantic utility to keep initial bundle small.
    (async () => {
      try {
        const mod = await import('utils/semantic');
        const { computeSimilarityScores } = mod;
        // Build a getter that returns searchable text for a repo
        const getter = (r: any) => `${r.name || ''} ${r.description || ''} ${(r.topics || []).join(' ')}`;
        const ranked = computeSimilarityScores(debouncedSearchTerm, repos, getter);
        if (ranked && ranked.length > 0) {
          // import setRepos action from repos slice
          const { setRepos } = await import('features/reposList/reposSlice');
          // dispatch reordered repos to the store
          dispatch(setRepos(ranked));
        }
      } catch (e) {
        // ignore semantic ranking failures — fallback to default search
        // console.debug('semantic ranking failed', e);
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
