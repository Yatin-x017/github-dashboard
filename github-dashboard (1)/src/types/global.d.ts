export {};

declare global {
  interface Window {
    __GITHUB_RATE_LIMITED__?: boolean;
    __GITHUB_OAUTH_TOKEN__?: string;
  }
}
