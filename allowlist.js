export const ALLOWLIST_HOSTS = [
  'www.linkedin.com',
  'linkedin.com',
  'media.licdn.com',
  'static.licdn.com',
  'lnkd.in',
  'api.openai.com',
  'localhost',
  '127.0.0.1',
  'api.knoxgroupanalyzer.com',
  'app.knoxgroupanalyzer.com',
  'logs.knoxgroupanalyzer.com'
];

export function isAllowedHost(hostname) {
  return ALLOWLIST_HOSTS.includes((hostname || '').toLowerCase());
}

// Quick heuristic to ensure the supplied URL is intended for a LinkedIn group.
// Allows formats like:
// - https://www.linkedin.com/groups/<group-id>/
// - https://www.linkedin.com/groups/<group-name>-<id>/
// The regex is case-insensitive to avoid false negatives from unusual casing.
const GROUP_PATH_REGEX = /^\/?groups\/[A-Za-z0-9._%-]+(\/|$)/i;

export function isLikelyLinkedInGroup(url) {
  const host = (url.hostname || '').toLowerCase();
  const pathname = url.pathname || '';
  const isLinkedInHost = host.endsWith('linkedin.com') || host === 'lnkd.in';
  const hasGroupPath = GROUP_PATH_REGEX.test(pathname);
  return isLinkedInHost && hasGroupPath;
}
