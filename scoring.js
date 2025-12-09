const MIN_RELEVANCE_FOR_JOIN = 55;
const MIN_SPAM_SCORE_FOR_JOIN = 60;

function safePercentage(part, total) {
  if (!total) return 0;
  return (part / total) * 100;
}

export function scoreGroup(classifiedPosts) {
  const totals = classifiedPosts.reduce(
    (acc, post) => {
      const category = (post.category || '').toLowerCase();
      if (category === 'spam' || post.isSpam) acc.spam += 1;
      if (category === 'promotional') acc.promo += 1;
      if (category === 'educational') acc.education += 1;
      if (category === 'investor discussion') acc.investor += 1;
      if (category === 'deal sourcing') acc.deals += 1;
      if (post.engagementLevel === 'high') acc.highEngagement += 1;
      return acc;
    },
    { spam: 0, promo: 0, education: 0, investor: 0, deals: 0, highEngagement: 0 }
  );

  const totalPosts = classifiedPosts.length;
  const spamScore = 100 - safePercentage(totals.spam, totalPosts);
  const engagementScore = safePercentage(totals.highEngagement, totalPosts);
  const networkingScore = safePercentage(totals.education, totalPosts);
  const fundraisingScore = safePercentage(totals.investor, totalPosts);
  const dealSourcingScore = safePercentage(totals.deals, totalPosts);
  const relevancePosts = totals.investor + totals.deals + totals.education;
  const relevanceScore = safePercentage(relevancePosts, totalPosts);

  const meetsSpamThreshold = spamScore >= MIN_SPAM_SCORE_FOR_JOIN;
  const meetsRelevanceThreshold = relevanceScore >= MIN_RELEVANCE_FOR_JOIN;
  const recommendation = meetsSpamThreshold && meetsRelevanceThreshold ? 'JOIN' : 'SKIP';

  const summary = `Analyzed ${totalPosts} posts: spam score ${spamScore.toFixed(1)}%, engagement score ${engagementScore.toFixed(1)}%, networking score ${networkingScore.toFixed(1)}%, fundraising score ${fundraisingScore.toFixed(1)}%, deal sourcing score ${dealSourcingScore.toFixed(1)}%, overall relevance score ${relevanceScore.toFixed(1)}%. Recommendation: ${recommendation}.`;

  return {
    totals: {
      spam: totals.spam,
      promo: totals.promo,
      education: totals.education,
      investor: totals.investor,
      deals: totals.deals
    },
    scores: {
      spamScore,
      engagementScore,
      relevanceScore,
      networkingScore,
      fundraisingScore,
      dealSourcingScore
    },
    recommendation,
    summary
  };
}

export const thresholds = {
  MIN_RELEVANCE_FOR_JOIN,
  MIN_SPAM_SCORE_FOR_JOIN
};
