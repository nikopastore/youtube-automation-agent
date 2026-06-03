# YouTube Channel + API Setup Checklist

This is the exact step-by-step to get **Mind Melt** and **Weird Why** live with the YouTube Automation Agent.

We will:

- Create **one Google Cloud project** with **one OAuth client** (Desktop app).
- Use the **same OAuth client** to authorize both channels.
- Create **one Brand Account channel** per YouTube owner.
- Save credentials under `config/youtube/<channel-id>/credentials.json` and `tokens.json` so the per-channel `npm run channels:check` command works.

> The two Google accounts you use to own Mind Melt and Weird Why do **not** need to be different. They can be the same Gmail/Google account if you want, as long as each channel is its own Brand Account. Different owner accounts are safer (one account compromise does not take down both channels), so this checklist assumes **two different Google accounts**.

---

## Phase 0 — Decide the owner accounts

Pick two Google accounts you own. Examples:

- `mindmelt.owner@gmail.com` → owns Mind Melt
- `weirdwhy.owner@gmail.com` → owns Weird Why

If you want to use the same account for both, that also works — just skip the "sign out" steps.

Write them down here:

- Channel 1 owner: `____________________`
- Channel 2 owner: `____________________`

---

## Phase 1 — Google Cloud project (one-time, shared by both channels)

This is the only developer-setup work. Both channels will share the same project and OAuth client. The differentiation happens at the Brand Account + token level, not at the Google Cloud level.

### 1.1 Create the project

1. Open https://console.cloud.google.com/.
2. Sign in with **either** owner account (project is owned by whoever creates it; you can add the other as a project member later if needed).
3. Top-left dropdown → **New Project**.
4. Project name: `youtube-automation-agent` (or anything memorable).
5. Click **Create**.
6. Wait until the project is created, then make sure it is selected in the top-left dropdown.

### 1.2 Enable the YouTube Data API v3

1. Left menu → **APIs & Services** → **Library**.
2. Search for `YouTube Data API v3`.
3. Click the result → **Enable**.
4. Repeat for **YouTube Analytics API** (used later for read-only analytics — optional but recommended).
5. Search for `YouTube Analytics API` → **Enable**.

### 1.3 Configure the OAuth consent screen

1. Left menu → **APIs & Services** → **OAuth consent screen**.
2. User type: **External** (unless you have a Google Workspace org; if you do, you can choose Internal).
3. Click **Create**.
4. Fill in:
   - App name: `YouTube Automation Agent`
   - User support email: your email
   - Developer contact email: your email
5. Click **Save and Continue**.
6. **Scopes** step: click **Add or remove scopes**, then add:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/yt-analytics.readonly`
7. Click **Save and Continue**.
8. **Test users** step: add both Google accounts you picked in Phase 0 as test users. This lets the OAuth flow work while the app is in "Testing" status.
9. Click **Save and Continue**, then **Back to Dashboard**.

> You can leave the app in **Testing** mode. It still works for your own accounts. Publishing it for verification is only required if you want random other users to log in, which you do not.

### 1.4 Create the OAuth client

1. Left menu → **APIs & Services** → **Credentials**.
2. Click **+ Create Credentials** → **OAuth client ID**.
3. Application type: **Desktop app** (this is critical — the agent runs locally).
4. Name: `youtube-automation-agent-desktop`.
5. Click **Create**.
6. You will see a modal with **Your Client ID** and **Your Client Secret**. Click **Download JSON** and save the file.
   - That file is the OAuth client credentials JSON. It looks like:

     ```json
     {
       "installed": {
         "client_id": "xxxxx.apps.googleusercontent.com",
         "project_id": "youtube-automation-agent",
         "auth_uri": "https://accounts.google.com/o/oauth2/auth",
         "token_uri": "https://oauth2.googleapis.com/token",
         "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
         "client_secret": "GOCSPX-xxxxx",
         "redirect_uris": ["http://localhost"]
       }
     }
     ```

7. Also copy the **Client ID** and **Client Secret** values into a note. You will paste them into the per-channel `credentials.json` files.

### 1.5 (Optional) Add the second owner as a project member

If you used owner #1 to create the project but owner #2 will also use it:

1. Left menu → **IAM & Admin** → **IAM**.
2. Click **+ Grant Access**.
3. Add owner #2's email with role **Editor** (or `roles/owner` if you want full access).
4. Save.

If both channels are owned by the same account, skip this step.

---

## Phase 2 — Create the YouTube Brand Account channels

Repeat this section **once per channel** (Mind Melt, then Weird Why).

### 2.1 Sign into the channel owner account

1. Open https://www.youtube.com/ in a browser profile signed in as the **channel owner** for this brand.
2. Make sure you are signed in as that account, not your personal main channel.

### 2.2 Create the Brand Account

1. Go to https://myaccount.google.com/brandaccounts.
2. Click **Create a Brand Account**.
3. Brand account name: `Mind Melt` (or `Weird Why` for the second channel).
4. Click **Create**.
5. You will be asked which Google account manages this Brand Account — pick the owner account you chose in Phase 0.

> Note: In 2026 Google has been slowly changing this UI. If the link above does not work, the alternative path is:
> 1. Go to https://www.youtube.com/channel_switcher.
> 2. Click **Create a channel**.
> 3. Use the channel name as the Brand Account name. YouTube will create a Brand Account under the hood.

### 2.3 Set up the channel basics

Once the Brand Account exists, go to https://studio.youtube.com/ while signed in as that Brand Account, and fill in:

1. **Customization → Profile**: upload a simple logo (square, 800x800 minimum). Skip "banner" for now.
2. **Customization → Basic info**:
   - Description: paste the channel thesis from `config/channels.sample.json` (the field is `thesis`).
   - URL: skip for now (only available after eligibility, not strictly required).
3. **Customization → Layout**: leave default.
4. **Settings → Channel → Basic settings**:
   - Country: **United States** (highest CPM).
   - Keywords: paste the niche `contentPillars` from the config, comma-separated.
5. **Settings → Channel → Advanced settings**:
   - **Audience**: leave "Is this channel made for kids?" set to **No, it's not made for kids**. This is critical — the Quiz and Weird-Why niches are for adults/teens, not children.
6. **Settings → Permissions**: invite yourself or a teammate as Manager if you want a backup owner. Required: at least one Manager should be a person you trust to recover the channel.

### 2.4 Skip monetization until you have the channel running

Do **not** apply for the YouTube Partner Program yet. Wait until:

- You have uploaded at least 10-20 Shorts manually.
- You have an active Brand Account.
- You have a US-based payout method (or wherever the owner is based).

You can apply later from `studio.youtube.com → Monetization`.

---

## Phase 3 — Save credentials in the repo

We are going to create the per-channel folders the agent already expects.

From the repo root:

```bash
cd /Users/jarvis/dev/youtube-automation-agent
mkdir -p config/youtube/mind-melt-quiz
mkdir -p config/youtube/weird-why-facts
```

For each channel, create two JSON files. The format matches what `config/credentials.example.json` uses.

### 3.1 `config/youtube/mind-melt-quiz/credentials.json`

```json
{
  "youtube": {
    "client_id": "PASTE_CLIENT_ID_HERE.apps.googleusercontent.com",
    "client_secret": "GOCSPX-PASTE_CLIENT_SECRET_HERE",
    "redirect_uris": ["http://localhost"]
  },
  "channel": {
    "channelName": "Mind Melt",
    "channelDescription": "Quiz / trivia / would-you-rather Shorts. Original scripts, original visuals, no copyrighted footage. Comment your score.",
    "defaultCategory": "24",
    "defaultPrivacy": "private",
    "websiteUrl": "",
    "businessEmail": "OWNER_EMAIL_FOR_CHANNEL_1"
  },
  "content": {
    "contentTypes": ["story", "list", "tutorial"],
    "competitorChannels": [],
    "targetAudience": "16-34 general audience, students, casual scrollers, trivia fans, comment-section fighters",
    "postingFrequency": "5-per-week",
    "preferredPostTime": "17:00"
  }
}
```

Notes:

- `defaultCategory: 24` is "Entertainment" in YouTube's category list, which fits Mind Melt. Use 28 ("Science & Technology") for Weird Why.
- `defaultPrivacy: private` is intentional — uploads start private so you can review in YouTube Studio before scheduling.
- `businessEmail` is the channel owner's email so YouTube can reach them.

### 3.2 `config/youtube/weird-why-facts/credentials.json`

```json
{
  "youtube": {
    "client_id": "PASTE_CLIENT_ID_HERE.apps.googleusercontent.com",
    "client_secret": "GOCSPX-PASTE_CLIENT_SECRET_HERE",
    "redirect_uris": ["http://localhost"]
  },
  "channel": {
    "channelName": "Weird Why",
    "channelDescription": "Short, weird-but-true fact explainers — space, biology, psychology, history. Original scripts, fact-checked sources, AI visuals.",
    "defaultCategory": "28",
    "defaultPrivacy": "private",
    "websiteUrl": "",
    "businessEmail": "OWNER_EMAIL_FOR_CHANNEL_2"
  },
  "content": {
    "contentTypes": ["explainer", "story", "tutorial"],
    "competitorChannels": [],
    "targetAudience": "13-30 general audience, science/space/psychology fans, people who save and share 'wait what' content",
    "postingFrequency": "5-per-week",
    "preferredPostTime": "17:00"
  }
}
```

You can use the **same `client_id` and `client_secret`** in both files because we created a single OAuth client for both channels in Phase 1.

### 3.3 Verify the files

Run:

```bash
cd /Users/jarvis/dev/youtube-automation-agent
npm run channels:check
```

You should see `credentials=true tokens=false` for both channels. The `tokens=false` is expected — we generate the token in Phase 4.

---

## Phase 4 — Generate the OAuth token (one per channel)

The token is what proves the local script can act on a specific Brand Account channel. You must do this once per channel because the OAuth grant is tied to the signed-in Google user.

> **Plan:** I'm going to add a small script `scripts/youtube-auth.js` next that wraps this. For now, use the official `google-auth-oauthlib` flow below.

### 4.1 Run the local OAuth flow (manual fallback)

If the helper script is not in place yet, do this:

```bash
cd /Users/jarvis/dev/youtube-automation-agent
node scripts/youtube-auth.js --channel mind-melt-quiz
```

The script will:

1. Read the channel's `config/youtube/mind-melt-quiz/credentials.json`.
2. Open a browser window pointed at Google's OAuth screen.
3. Ask you to sign into the **channel owner's Google account** and approve the scopes.
4. Write the resulting token to `config/youtube/mind-melt-quiz/tokens.json`.

Then:

```bash
node scripts/youtube-auth.js --channel weird-why-facts
```

This time sign into the second owner's account.

### 4.2 If the script does not exist yet

If you see "command not found" or the script has not been added yet, run this one-time bootstrap (paste into your terminal):

```bash
cat > /tmp/auth.js <<'EOF'
const fs = require('fs');
const path = require('path');
const http = require('http');
const { google } = require('googleapis');
const url = require('url');

const channel = process.argv[2];
if (!channel) {
  console.error('Usage: node scripts/youtube-auth.js <channel-id>');
  process.exit(1);
}

const base = path.join(__dirname, '..', 'config', 'youtube', channel);
const credPath = path.join(base, 'credentials.json');
const tokenPath = path.join(base, 'tokens.json');

const cred = JSON.parse(fs.readFileSync(credPath, 'utf8')).youtube;
const oauth2 = new google.auth.OAuth2(cred.client_id, cred.client_secret, 'http://localhost:8765');

const scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly'
];

const authUrl = oauth2.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent' });
console.log('Open this URL in your browser:');
console.log(authUrl);

const server = http.createServer(async (req, res) => {
  const q = url.parse(req.url, true).query;
  if (q.code) {
    const { tokens } = await oauth2.getToken(q.code);
    fs.mkdirSync(base, { recursive: true });
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
    res.end('Token saved. You can close this tab.');
    server.close();
  } else {
    res.end('No code returned.');
  }
});

server.listen(8765, () => console.log('Listening on http://localhost:8765'));
EOF
mkdir -p scripts
cp /tmp/auth.js scripts/youtube-auth.js
```

Then re-run the two `node scripts/youtube-auth.js --channel …` commands above.

> **Important:** When the browser opens, sign in as the **Brand Account owner** for that channel. The grant is per Google account, so if you sign in as the wrong account, the upload will go to that account's main channel — not the Brand Account. To fix that, revoke the grant at https://myaccount.google.com/permissions, then re-run.

### 4.3 Verify tokens

```bash
cd /Users/jarvis/dev/youtube-automation-agent
npm run channels:check
```

You should now see `credentials=true tokens=true` for both channels.

Also smoke-test by listing your channel info:

```bash
node -e "
const { google } = require('googleapis');
const fs = require('fs');
const t = JSON.parse(fs.readFileSync('config/youtube/mind-melt-quiz/tokens.json','utf8'));
const c = JSON.parse(fs.readFileSync('config/youtube/mind-melt-quiz/credentials.json','utf8')).youtube;
const oauth2 = new google.auth.OAuth2(c.client_id, c.client_secret, 'http://localhost:8765');
oauth2.setCredentials(t);
const yt = google.youtube({ version: 'v3', auth: oauth2 });
yt.channels.list({ part: 'snippet', mine: true }).then(r => console.log(JSON.stringify(r.data.items, null, 2)));
"
```

You should see one channel entry with the title **Mind Melt** (or whatever you named it). If the title is wrong, re-do Phase 4 with the correct account.

---

## Phase 5 — Verify end-to-end (still in dry-run, still private)

The agent's safety defaults are:

- `YOUTUBE_UPLOAD_DRY_RUN=true` — uploads return a fake upload receipt, no real YouTube video is created.
- `DEFAULT_PRIVACY_STATUS=private` — when you flip dry-run off, uploads start as private.
- `AUTO_PUBLISH_ENABLED=false` — the publishing scheduler does not run unattended.
- `REQUIRE_MANUAL_APPROVAL=true` — the publishing API throws unless a human sets the approved flag.

Leave all four on for now. Run:

```bash
cd /Users/jarvis/dev/youtube-automation-agent
npm run channels:batch
```

Then do a smoke test of the publishing agent:

```bash
node -e "
const { PublishingSchedulingAgent } = require('./agents/publishing-scheduling-agent');
const { Database } = require('./database/db');
const { CredentialManager } = require('./utils/credential-manager');
(async () => {
  const db = new Database();
  await db.initialize();
  const cm = new CredentialManager();
  await cm.initialize();
  const agent = new PublishingSchedulingAgent(db, cm);
  await agent.initialize();
  console.log('Publishing agent loaded. Dry-run is on. Private is on. Approval is required.');
  await db.close();
})();
"
```

If it prints the message and exits cleanly, the runtime is wired up.

---

## Phase 6 — First real uploads (private only)

When you're ready to actually push the first video to YouTube:

1. Set the safety flags in `.env`:

   ```env
   DEFAULT_PRIVACY_STATUS=private
   YOUTUBE_UPLOAD_DRY_RUN=false
   AUTO_PUBLISH_ENABLED=false
   REQUIRE_MANUAL_APPROVAL=true
   ```

2. The repo's publishing agent still does not have a `node scripts/publish.js` wrapper. Use the API endpoint or add a small wrapper. Recommended first pass:

   ```bash
   node -e "
   const express = require('express');
   const { YouTubeAutomationAgent } = require('./index.js');
   // see index.js: POST /generate and POST /publish/:contentId
   "
   ```

   For now, do this manually:

   1. Run the dashboard with `npm start`.
   2. Open http://localhost:3456.
   3. Click "Generate Content" with the first episode topic.
   4. Inspect the produced `data/scripts/*.json`.
   5. When you're ready to publish, run a script that calls the publishing agent with `metadata.approval.status = 'approved'`.

3. After the video is uploaded as private, open YouTube Studio, watch the video, and verify:
   - title/description/tags are correct
   - thumbnail is correct
   - captions were generated
   - no copyrighted material

4. If everything looks good, change the video to **Scheduled** for a future date or **Public** directly.

---

## Phase 7 — Apply for monetization later

Do this only after 10-20 Shorts are uploaded, you have 1,000+ subscribers, and 4,000+ watch hours (or 10M Shorts views in 90 days).

1. Open https://studio.youtube.com/ as the Brand Account.
2. Left menu → **Monetization**.
3. Accept the YouTube Partner Program terms.
4. Link an AdSense account (or create a new one under the Brand Account owner's email).
5. Wait for review (usually 1-3 weeks).

Until you apply, the channels earn nothing. That is fine for the first 30-60 days because we are collecting data on which niche actually wins.

---

## TL;DR — Files to create

```text
config/youtube/mind-melt-quiz/credentials.json
config/youtube/mind-melt-quiz/tokens.json
config/youtube/weird-why-facts/credentials.json
config/youtube/weird-why-facts/tokens.json
```

Each `credentials.json` is the OAuth client ID/secret plus a channel profile block. Each `tokens.json` is created automatically by the OAuth flow in Phase 4.

## TL;DR — What to give Hermes

After you complete Phase 1-4, the only thing I need from you is:

- The 4 JSON files in `config/youtube/`.
- Confirmation that `npm run channels:check` reports `credentials=true tokens=true` for both channels.

I will then build the per-channel publish wrapper, wire the publishing agent to the right token per channel, and add a "pick episode → preview → approve → upload" CLI.

## Common pitfalls

- **Wrong OAuth client type.** If you create a "Web application" client, the redirect URI handling breaks. Use **Desktop app** every time.
- **Test users not added.** If your OAuth consent screen is "Testing" and the channel owner is not a test user, the flow fails with a 403.
- **App not published to Production.** Not required for your own use, but if the consent screen rejects you, check this.
- **Wrong account during OAuth.** The token is tied to whichever Google account signs in. If you accidentally sign in to your personal Gmail instead of the Brand Account owner, the uploads go to your personal channel, not the Brand Account.
- **Sharing OAuth client between too many apps.** A Desktop OAuth client is fine for our local agent, but if you start a second machine or a second coder, create a second client rather than reusing.
- **Storing client_secret in chat.** Never paste the client_secret into a public chat. The files we save it to (`config/youtube/.../*.json`) are already in `.gitignore`.
