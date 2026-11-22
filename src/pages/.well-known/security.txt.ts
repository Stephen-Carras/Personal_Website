// /.well-known/security.txt (RFC 9116), generated at build time so Expires and
// Canonical stay correct. The deploy workflow rebuilds monthly, and Expires is set
// 180 days ahead, so the file never lapses (RFC 9116 asks for under a year).
import type { APIRoute } from 'astro';

const REPO = 'https://github.com/Stephen-Carras/stephen-carras.github.io';
const EXPIRES_DAYS = 180;

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('Set `site` in astro.config.mjs');
  const expires = new Date(Date.now() + EXPIRES_DAYS * 864e5);
  expires.setUTCHours(0, 0, 0, 0);
  const body = [
    '# Please report security issues privately via GitHub private vulnerability reporting.',
    `Contact: ${REPO}/security/advisories/new`,
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: en',
    `Canonical: ${new URL('/.well-known/security.txt', site).href}`,
    `Policy: ${REPO}/security/policy`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
