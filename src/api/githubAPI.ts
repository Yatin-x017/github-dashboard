import axios from 'axios';
import { Repo, Contributor } from 'features/reposList/types';
import { REPOS_PER_PAGE, PROJECT_REPO_LINK, CONTRIBUTORS_PER_PAGE } from 'utils/consts';
import log from 'utils/log';

const SEARCH_URL_BASE = 'https://api.github.com/search/repositories';
const REPO_URL_BASE = 'https://api.github.com/repositories';

export interface GetReposResponse {
    incomplete_results: boolean,
    items: Repo[],
    total_count: number,
}

interface IConfig {
    params: {
        q: string,
        page?: number,
        sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated',
        order?: 'desc' | 'asc',
        per_page?: number,
    },
    headers?: {
        [key: string]: string,
    },
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function requestWithRetry<T>(fn: () => Promise<T>, retries = 3, backoff = 500): Promise<T | string> {
  try {
    return await fn();
  } catch (err: any) {
    const status = err?.response?.status;
    if ((status === 429 || status === 502 || status === 503 || status === 504) && retries > 0) {
      // transient error, retry with exponential backoff
      await sleep(backoff);
      return requestWithRetry(fn, retries - 1, backoff * 2);
    }

    log.error(err);

    // for other errors return the message to preserve existing API
    return err.message || 'Request failed';
  }
}

export const fetchRepos = async (q: string, page: number): Promise<GetReposResponse | string> => {
  const config: IConfig = {
    params: {
      q,
      page,
      sort: 'stars',
      order: 'desc',
      per_page: REPOS_PER_PAGE,
    },
  };

  const result = await requestWithRetry(() => axios.get<GetReposResponse>(SEARCH_URL_BASE, config));
  if (typeof result === 'string') return result;
  return (result as any).data as GetReposResponse;
};

export const fetchRepoDetails = async (id: string): Promise<Repo | string> => {
  const result = await requestWithRetry(() => axios.get<Repo>(`${REPO_URL_BASE}/${id}`));
  if (typeof result === 'string') return result;
  return (result as any).data as Repo;
};

/**
 * https://developer.github.com/v3/repos/#list-repository-contributors
 *
 * Lists contributors to the specified repository and
 * sorts them by the number of commits per contributor in descending order.
 */
export const fetchContributors = async (url: string): Promise<Contributor[] | string> => {
  const config = {
    params: {
      per_page: CONTRIBUTORS_PER_PAGE,
    },
  };

  const result = await requestWithRetry(() => axios.get<Contributor[]>(url, config));
  if (typeof result === 'string') return result;
  return (result as any).data as Contributor[];
};

/**
 *  https://developer.github.com/v3/repos/#list-repository-languages
 */
export const fetchLanguages = async (url: string): Promise<string[] | [] | string> => {
  try {
    const response = await axios.get<{[key:string]: number}>(url);

    return Object.keys(response.data);
  } catch (e) {
    log.error(e);
    return e.message;
  }
};

let warnedNoToken = false;

export const fetchUserRepos = async (username: string, per_page = 100): Promise<Repo[] | string> => {
  try {
    const response = await axios.get<Repo[]>(`https://api.github.com/users/${username}/repos`, { params: { per_page } });

    return response.data;
  } catch (e) {
    log.error(e);
    return e.message;
  }
};

axios.interceptors.request.use((config: Partial<IConfig> = {}) => {
  try {
    // Prefer token provided via environment variable REACT_APP_GITHUB_OAUTH_TOKEN
    // (create-react-app exposes REACT_APP_* vars to the browser at build time)
    const token = process?.env?.REACT_APP_GITHUB_OAUTH_TOKEN || (typeof window !== 'undefined' && (window as any).__GITHUB_OAUTH_TOKEN__);

    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers = { ...config.headers, Authorization: `token ${token}` };
    } else if (!warnedNoToken) {
      // Log only once: missing token will cause unauthenticated requests with low rate limits
      warnedNoToken = true;
      log.error('No GitHub OAuth token provided (set REACT_APP_GITHUB_OAUTH_TOKEN). Requests will be unauthenticated and rate-limited.');
      log.error(`Read the README Access token section for more details: ${PROJECT_REPO_LINK}#access-token`);
    }
  } catch (e) {
    log.error(e);
  }

  return config;
});
