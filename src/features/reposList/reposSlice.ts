import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk, AppDispatch } from 'app/store';
import { fetchRepos } from 'api/githubAPI';
import { Repo } from 'features/reposList/types';
import { setTotalPages } from 'features/pagination/pageSlice';
import log from 'utils/log';

type IRepos = Repo[];

const initialState: IRepos = [];

const reposSlice = createSlice({
  name: 'repos',
  initialState,
  reducers: {
    fetchRepos: (state, action: PayloadAction<Repo[]>): IRepos => action.payload,
  },
});

export const loadRepos = (q: string, page: number): AppThunk => async (dispatch: AppDispatch) => {
  const repos = await fetchRepos(q, page);

  if (typeof repos === 'string') {
    if (repos === 'RATE_LIMITED') {
      // set empty and bail silently — UI can read window.__GITHUB_RATE_LIMITED__ to show banner
      dispatch(reposSlice.actions.fetchRepos([]));
      dispatch(setTotalPages(0));
      return;
    }
    // Instead of throwing (which bubbles to the ErrorBoundary), handle gracefully:
    log.error('Failed to load repositories:', repos);
    dispatch(reposSlice.actions.fetchRepos([]));
    dispatch(setTotalPages(0));
    return;
  }

  dispatch(reposSlice.actions.fetchRepos(repos.items));
  dispatch(setTotalPages(repos.total_count));
};

export const { fetchRepos: setRepos } = reposSlice.actions;

export default reposSlice.reducer;
