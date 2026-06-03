#!/usr/bin/env node
// OAuth bootstrap for a single per-channel YouTube credential profile.
// Reads config/youtube/<channel>/credentials.json, runs a local OAuth flow,
// and writes the resulting token to config/youtube/<channel>/tokens.json.
//
// Run once per channel:
//   node scripts/youtube-auth.js --channel mind-melt-quiz
//   node scripts/youtube-auth.js --channel weird-why-facts

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const { google } = require('googleapis');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(arg);
    }
  }
  return args;
}

function getChannelDir(repoRoot, channelId) {
  return path.join(repoRoot, 'config', 'youtube', channelId);
}

function readCredentials(channelDir) {
  const credPath = path.join(channelDir, 'credentials.json');
  if (!fs.existsSync(credPath)) {
    throw new Error(`Missing ${credPath}. Create it from the channel-setup checklist before running this.`);
  }
  return JSON.parse(fs.readFileSync(credPath, 'utf8'));
}

async function runAuth({ clientId, clientSecret, redirectUri, channelDir, scopes }) {
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  console.log('\nOpen this URL in a browser signed in to the CHANNEL OWNER Google account:');
  console.log(authUrl);
  console.log(`\nWaiting for OAuth callback on ${redirectUri} ...`);

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const query = url.parse(req.url, true).query;
        if (!query.code) {
          res.writeHead(400);
          res.end('No authorization code in callback URL.');
          return;
        }
        const { tokens } = await oauth2.getToken(query.code);
        if (!tokens.refresh_token) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`<h2>No refresh token returned.</h2>
                   <p>This usually means the Google account already granted this app previously.
                   Revoke the app at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>
                   and run this command again.</p>`);
          server.close();
          reject(new Error('No refresh_token in response'));
          return;
        }
        fs.mkdirSync(channelDir, { recursive: true });
        fs.writeFileSync(path.join(channelDir, 'tokens.json'), JSON.stringify(tokens, null, 2));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h2>Token saved to ${path.join(channelDir, 'tokens.json')}</h2>
                 <p>You can close this tab and return to the terminal.</p>`);
        server.close();
        resolve(tokens);
      } catch (err) {
        res.writeHead(500);
        res.end(`Auth error: ${err.message}`);
        server.close();
        reject(err);
      }
    });

    server.listen(8765, () => console.log('Listening on http://localhost:8765'));
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const channelId = args.channel;
  if (!channelId) {
    console.error('Usage: node scripts/youtube-auth.js --channel <channel-id>');
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, '..');
  const channelDir = getChannelDir(repoRoot, channelId);
  const creds = readCredentials(channelDir);
  if (!creds.youtube || !creds.youtube.client_id || !creds.youtube.client_secret) {
    throw new Error(`credentials.json for "${channelId}" is missing the youtube.client_id / client_secret block.`);
  }

  const redirectUri = (creds.youtube.redirect_uris && creds.youtube.redirect_uris[0]) || 'http://localhost:8765';

  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly'
  ];

  const tokens = await runAuth({
    clientId: creds.youtube.client_id,
    clientSecret: creds.youtube.client_secret,
    redirectUri,
    channelDir,
    scopes
  });

  console.log(`\nSaved ${path.join(channelDir, 'tokens.json')}.`);
  console.log('Token has scopes: upload, manage, read, analytics-read.');
  console.log('Next: run "npm run channels:check" to verify.');
}

main().catch(err => {
  console.error('Auth failed:', err.message);
  process.exit(1);
});
