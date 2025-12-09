import express from 'express';
import { scrapePosts } from './scraper.js';
import { classifyPosts } from './classifier.js';
import { scoreGroup } from './scoring.js';
import { isAllowedHost, isLikelyLinkedInGroup } from './allowlist.js';
import { PORT } from './config.js';

const app = express();
app.use(express.json());

function validateRequestUrl(url) {
  if (!url || typeof url !== 'string') {
    const error = new Error('Request body must include a url string');
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

  return parsed.toString();
}

app.post('/analyze', async (req, res) => {
  let targetUrl;
  try {
    targetUrl = validateRequestUrl(req.body?.url);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }

  try {
    console.log(`Received /analyze request for ${targetUrl}`);
    const posts = await scrapePosts(targetUrl);
    console.log(`Scraped ${posts.length} posts from ${targetUrl}`);
    let classified;
    try {
      classified = await classifyPosts(posts);
    } catch (error) {
      console.error('Error during classification', error);
      throw error;
    }

    let report;
    try {
      report = scoreGroup(classified);
    } catch (error) {
      console.error('Error during scoring', error);
      throw error;
    }
    const posts = await scrapePosts(targetUrl);
    const classified = await classifyPosts(posts);
    const report = scoreGroup(classified);

    return res.json({ url: targetUrl, posts: classified, report });
  } catch (error) {
    console.error('Internal error while analyzing group', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`LinkedIn Group Intelligence Analyzer running on port ${PORT}`);
});
