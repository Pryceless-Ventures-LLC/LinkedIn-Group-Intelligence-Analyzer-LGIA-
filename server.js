import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapePosts } from './scraper.js';
import { classifyPosts } from './classifier.js';
import { scoreGroup } from './scoring.js';
import { isAllowedHost, isLikelyLinkedInGroup } from './allowlist.js';
import { ALLOWED_ORIGINS, DEFAULT_MAX_POSTS, MAX_POSTS_CAP, NODE_ENV, PORT } from './config.js';

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const corsOptions = {
  origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true,
  methods: ['GET', 'POST']
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '256kb' }));
if (NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
app.use(express.static(path.join(__dirname, 'public')));

function validateRequestUrl(url) {
  if (!url || typeof url !== 'string') {
    const error = new Error('Request body must include a url string');
    error.statusCode = 400;
    throw error;
  }

  if (url.length > 2048) {
    const error = new Error('URL is too long');
    error.statusCode = 400;
    throw error;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    const error = new Error('Invalid URL');
    error.statusCode = 400;
    throw error;
  }

  if (!isAllowedHost(parsed.hostname)) {
    const error = new Error('URL host is not allowed');
    error.statusCode = 400;
    throw error;
  }

  if (!isLikelyLinkedInGroup(parsed)) {
    const error = new Error('URL must point to a LinkedIn group (e.g., https://www.linkedin.com/groups/<id>)');
    error.statusCode = 400;
    throw error;
  }

  const isLocalhost = ['localhost', '127.0.0.1'].includes(parsed.hostname);
  const isSecure = parsed.protocol === 'https:' || isLocalhost;
  if (!isSecure) {
    const error = new Error('Only https:// group URLs are allowed');
    error.statusCode = 400;
    throw error;
  }

  return parsed.toString();
}

function parseMaxPosts(value) {
  if (value === undefined || value === null) return DEFAULT_MAX_POSTS;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_POSTS;
  return Math.min(MAX_POSTS_CAP, Math.max(1, Math.floor(parsed)));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/analyze', async (req, res) => {
  let targetUrl;
  try {
    targetUrl = validateRequestUrl(req.body?.url);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }

  const maxPosts = parseMaxPosts(req.body?.maxPosts);

  try {
    console.log(`Received /analyze request for ${targetUrl} (maxPosts=${maxPosts})`);
    const posts = await scrapePosts(targetUrl, maxPosts);
    console.log(`Scraped ${posts.length} posts from ${targetUrl}`);
    const classified = await classifyPosts(posts);
    const report = scoreGroup(classified, { url: targetUrl });

    return res.json({ url: targetUrl, posts: classified, report });
  } catch (error) {
    console.error('Internal error while analyzing group', error);
    const status = error.statusCode || error?.cause?.statusCode || 500;
    const code = error.code || error?.cause?.code;

    return res.status(status).json({
      error:
        status === 502
          ? 'Unable to scrape posts from this group. The group may require login or changed markup.'
          : status === 403
            ? 'Access blocked: login or captcha detected.'
            : 'Internal server error',
      code,
      status
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`LinkedIn Group Intelligence Analyzer running on port ${PORT}`);
});
