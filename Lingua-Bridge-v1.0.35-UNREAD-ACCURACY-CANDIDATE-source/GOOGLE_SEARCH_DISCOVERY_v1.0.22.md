# Google / Chrome search discovery

Lingua v1.0.22 prepares the public web site for indexing:
- indexable homepage and downloads page;
- canonical URLs;
- search-focused title/description/keywords;
- SoftwareApplication structured data;
- robots.txt allows public pages;
- sitemap.xml includes the downloads page;
- optional Google Search Console verification via `GOOGLE_SITE_VERIFICATION`.

After Production deployment, add the deployed site/domain to Google Search Console, place the provided verification token in Vercel as `GOOGLE_SITE_VERIFICATION`, redeploy, verify ownership, and submit:

`https://YOUR-DOMAIN/sitemap.xml`

A custom domain is recommended for branding and long-term search visibility. Search engines decide when and where a page appears, so no software change can guarantee immediate ranking for every Chrome/Google search.
