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
  return ALLOWLIST_HOSTS.includes(hostname);
}

// Quick heuristic to ensure the supplied URL is intended for a LinkedIn group.
export function isLikelyLinkedInGroup(url) {
  const host = url.hostname || '';
  const pathname = url.pathname || '';
  const isLinkedInHost = host.includes('linkedin.com') || host === 'lnkd.in';
  const hasGroupPath = pathname.includes('/groups');
  return isLinkedInHost && hasGroupPath;
}
