import {throttling} from '@octokit/plugin-throttling';
import {Octokit} from '@octokit/rest';
import {getLogger} from '../../logger';

const logger = getLogger();

/**
 * Create github client
 *
 * @export
 * @param {string} githubUrl
 * @param {string} githubToken
 * @return {*}  {Octokit}
 */
export function createClient(githubToken: string): Octokit {
  const ThrottledOctokit = Octokit.plugin(throttling);

  const octokit = new ThrottledOctokit({
    auth: `token ${githubToken}`,
    baseUrl: 'https://api.github.com', // For now it's fixed
    throttle: {
      onRateLimit: (
        retryAfter: number,
        options: {method: string; url: string; request: {retryCount: number}},
        octokit: Octokit,
      ) => {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`,
        );

        // Retry twice after hitting a rate limit error, then give up
        if (options.request.retryCount <= 2) {
          logger(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onAbuseLimit: (
        _retryAfter: number,
        options: Record<string, string>,
        octokit: Octokit,
      ) => {
        // Does not retry, only logs a warning
        octokit.log.warn(
          `Abuse detected for request ${options?.method} ${options?.url}`,
        );
      },
    },
  });

  return octokit;
}
