module.exports = function (eleventyConfig) {
  // Pass existing HTML pages through without any template processing.
  // Add each page explicitly so Eleventy never touches them.
  const staticPages = [
    "index.html",
    "privacy.html",
    // terms-of-service.html is deliberately NOT passed through. It carries
    // `permalink: /terms/index.html`, and addPassthroughCopy bypasses template
    // processing entirely — front matter is never parsed, so the permalink was
    // silently ignored and the file published at /terms-of-service/ instead.
    // Letting Eleventy process it is what makes /terms resolve.
    "refund-policy.html",
    "membership-billing-terms.html",
    "cancellation-instructions.html",
    "newsletter-signup.html",
    "newsletter-confirmed.html",
    "email-confirmed.html",
    "optin-confirmed.html",
    "trading-essentials-thank-you.html",
  ];

  for (const page of staticPages) {
    eleventyConfig.addPassthroughCopy(page);
  }

  // Pass through static assets
  eleventyConfig.addPassthroughCopy("marketeye-icon.png");
  eleventyConfig.addPassthroughCopy("og-default.png");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("assets");

  // Date filters for Nunjucks templates
  eleventyConfig.addFilter("readableDate", (date) => {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();
    return new Date(year, month, day).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
  });

  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  // Tell Eleventy to look for posts in _posts/
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("_posts/**/*.md")
      .sort((a, b) => b.date - a.date);
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_includes/layouts",
    },
    // Only use Nunjucks for .html files that aren't passed through above.
    // Markdown is processed normally.
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
