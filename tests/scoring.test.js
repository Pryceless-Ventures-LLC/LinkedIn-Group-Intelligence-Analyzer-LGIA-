import { scoreGroup } from '../scoring.js';

describe('scoreGroup', () => {
  it('returns expected scores and JOIN recommendation when spam is low and relevance is high', () => {
    const posts = [
      { category: 'educational', isSpam: false, engagementLevel: 'high' },
      { category: 'investor discussion', isSpam: false, engagementLevel: 'medium' },
      { category: 'deal sourcing', isSpam: false, engagementLevel: 'low' }
    ];

    const result = scoreGroup(posts);

    expect(result.scores).toHaveProperty('spamScore');
    expect(result.scores).toHaveProperty('engagementScore');
    expect(result.scores).toHaveProperty('relevanceScore');
    expect(result).toHaveProperty('recommendation', 'JOIN');
  });

  it('returns SKIP recommendation when spam is high and relevance is low', () => {
    const posts = [
      { category: 'spam', isSpam: true, engagementLevel: 'low' },
      { category: 'spam', isSpam: true, engagementLevel: 'low' },
      { category: 'general conversation', isSpam: false, engagementLevel: 'low' }
    ];

    const result = scoreGroup(posts);

    expect(result.recommendation).toBe('SKIP');
    expect(result.scores.spamScore).toBeLessThan(60);
    expect(result.scores.relevanceScore).toBeLessThan(55);
  });
});
