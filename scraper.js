import puppeteer from 'puppeteer';
import { HEADLESS_MODE, MAX_POSTS, SCRAPE_TIMEOUT } from './config.js';

async function scrollForPosts(page, maxScrolls = 6) {
  let lastHeight = 0;
  for (let i = 0; i < maxScrolls; i += 1) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === lastHeight) {
      break; // stop if no more content is loaded
    }
    lastHeight = newHeight;
  }
}

async function extractPosts(page, limit) {
  const posts = await page.evaluate((max) => {
    const postSelectors = ['[data-urn^="urn:li:activity"]', 'article'];
    const elements = postSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    const uniqueElements = Array.from(new Set(elements));

    return uniqueElements
      .map((el) => ({
        text: (el.innerText || el.textContent || '').trim(),
        rawHtml: el.innerHTML
      }))
      .filter((post) => post.text.length > 0)
      .slice(0, max);
  }, limit);

  return posts;
}

export async function scrapePosts(groupUrl, maxPosts = MAX_POSTS) {
  console.log(`Starting scrape for ${groupUrl}`);
  const browser = await puppeteer.launch({ headless: HEADLESS_MODE !== 'false' });
  const page = await browser.newPage();
  page.setDefaultTimeout(SCRAPE_TIMEOUT);
  page.setDefaultNavigationTimeout(SCRAPE_TIMEOUT);

  try {
    await page.goto(groupUrl, { waitUntil: 'domcontentloaded', timeout: SCRAPE_TIMEOUT });
    await page.waitForSelector('body', { timeout: SCRAPE_TIMEOUT });

    // Attempt to load additional posts with simple scrolling
    await scrollForPosts(page);

    const posts = await extractPosts(page, maxPosts);
    console.log(`Scraped ${posts.length} posts (limit ${maxPosts})`);
    return posts;
  } catch (error) {
    console.error('Error during scraping', error);
    throw error;
  } finally {
    await browser.close();
    console.log('Scraping session closed');
  }
}
