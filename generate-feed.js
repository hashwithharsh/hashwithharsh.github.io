#!/usr/bin/env node
/**
 * generate-feed.js
 * Run: node generate-feed.js
 * Generates feed.xml in the project root from content/blogs.json
 * 
 * Add to GitHub Actions deploy.yml:
 *   - run: node generate-feed.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const SITE_URL  = 'https://hashwithharsh.dev';
const SITE_NAME = 'hashwithharsh';
const AUTHOR    = 'Harsh Yadav';

const blogs = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'content/blogs.json'), 'utf8')
);

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const items = blogs
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .map(post => {
    const pubDate = new Date(post.date).toUTCString();
    const link    = `${SITE_URL}/post.html?slug=${post.slug}`;
    return `
  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(post.excerpt)}</description>
    ${post.tags.map(t => `<category>${escapeXml(t)}</category>`).join('\n    ')}
    <author>${AUTHOR}</author>
  </item>`;
  }).join('');

const lastBuildDate = new Date().toUTCString();
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} — ${AUTHOR}</title>
    <link>${SITE_URL}</link>
    <description>DevOps and Cloud Engineering posts by Harsh Yadav. Real problems, real fixes, no fluff.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <managingEditor>harsh@hashwithharsh.dev (${AUTHOR})</managingEditor>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/favicon.ico</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

const outputPath = path.join(__dirname, 'feed.xml');
fs.writeFileSync(outputPath, feed);
console.log(`✓ Generated feed.xml with ${blogs.length} posts → ${outputPath}`);
