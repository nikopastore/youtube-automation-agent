#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function firstWords(text, count = 7) {
  return text.split(/\s+/).slice(0, count).join(' ');
}

function makeEpisode(channel, topic, index) {
  const title = topic.length > 95 ? `${topic.slice(0, 92)}...` : topic;
  const hook = makeHook(channel, topic, index);
  const pillar = channel.contentPillars[index % channel.contentPillars.length];
  const disclaimer = channel.id === 'weird-why-facts'
    ? 'Educational and entertainment only. Sources listed in description — verify before sharing.'
    : 'Educational and entertainment only. Pause, replay, and comment your score.';
  const talkingPoints = makeTalkingPoints(channel, topic, index);

  const script = [
    hook,
    '',
    talkingPoints.setup,
    talkingPoints.demo,
    talkingPoints.takeaway,
    '',
    disclaimer,
    '',
    talkingPoints.cta
  ].join('\n');

  return {
    id: `${channel.id}-${String(index + 1).padStart(2, '0')}-${slug(title)}`,
    channelId: channel.id,
    workingChannelName: channel.workingName,
    format: channel.formats[index % channel.formats.length],
    pillar,
    title,
    hook,
    script,
    storyboard: [
      { seconds: '0-3', visual: 'Large hook text, fast zoom, simple icon/metaphor' },
      { seconds: '3-15', visual: 'Show messy current state or source data' },
      { seconds: '15-45', visual: 'Show 2-3 step workflow/demo/chart sequence' },
      { seconds: '45-60', visual: 'Final takeaway card + subscribe CTA' }
    ],
    seo: {
      description: `${title}\n\n${disclaimer}\n\nBuilt as an automated channel experiment.`,
      tags: makeTags(channel, topic),
      categoryHint: channel.id === 'weird-why-facts' ? 'Education / Science & Technology' : 'Entertainment / Education',
      defaultPrivacy: 'private'
    },
    approval: {
      status: 'needs_manual_review',
      checks: [
        'script checked for unsupported factual claims',
        'assets are generated/owned/licensed',
        'metadata reviewed',
        'uploaded private before public scheduling'
      ]
    }
  };
}

function makeTalkingPoints(channel, topic, index) {
  const variants = {
    'mind-melt-quiz': [
      {
        setup: `Round 1: ${topic}. The score is simple — right answers win, wrong answers go in the comments.`,
        demo: 'Show the question, pause to let people answer, then reveal the answer with a one-line explanation or twist.',
        takeaway: 'Quiz loops work because the comment section becomes the game — people argue, defend, and rewatch to prove a point.',
        cta: 'Comment your score. We pick the most wrong / most right answer in the next Short.'
      },
      {
        setup: `${topic} — and 90% of people fail the first one.`,
        demo: 'Start with the hardest version, give a 2-second pause, then flip to an even harder twist question before the reveal.',
        takeaway: 'Replay comes from the gap between confidence and the actual answer; let the pause be longer than feels natural.',
        cta: 'Save this and send it to the friend who thinks they know everything.'
      }
    ],
    'weird-why-facts': [
      {
        setup: `${topic}. And no, the headline version is not the weird part.`,
        demo: "Walk through the real mechanism in plain language, then drop the 'wait what' twist in the last 5 seconds.",
        takeaway: 'The rewatch is the twist; the first watch sells the setup, the second watch is the payoff people share.',
        cta: 'Follow for one weird-but-true fact every day, with a source in the description.'
      },
      {
        setup: `${topic}. Here is the part most explainers skip.`,
        demo: 'Start with the everyday thing people think they know, then rebuild it correctly with one new piece of evidence per beat.',
        takeaway: 'Originality comes from skipping the cliché framing and showing the step most people forget to mention.',
        cta: 'Save this for the next time someone brings it up at dinner.'
      }
    ]
  };
  const list = variants[channel.id] || [{
    setup: `Today’s experiment is ${topic}.`,
    demo: 'Show the problem, show the smallest useful system, then show the result.',
    takeaway: 'Keep what works and cut what does not.',
    cta: 'Subscribe for more experiments.'
  }];
  return list[index % list.length];
}

function makeHook(channel, topic, index) {
  const hooks = {
    'mind-melt-quiz': [
      `Only 1% of people can answer all of these.`,
      `90% fail the first one. You?`,
      `Pause now — the real question is at the end.`,
      `Comment your score before the reveal.`
    ],
    'weird-why-facts': [
      `This fact is going to ruin your day in the best way.`,
      `No, you do not actually know how this works.`,
      `The headline is wrong. Here is what is actually happening.`,
      `Save this before the algorithm buries it.`
    ]
  };
  const list = hooks[channel.id] || [`Here is the useful part of ${firstWords(topic)}.`];
  return list[index % list.length];
}

function makeTags(channel, topic) {
  const base = channel.id.split('-').concat(channel.nicheType.split(/[\s/]+/));
  const topicTags = topic.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  return Array.from(new Set(base.concat(topicTags).filter(t => t.length > 2))).slice(0, 15);
}

function renderPlan(config) {
  const lines = [];
  lines.push('# YouTube Channel Launch Plan');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Safety defaults');
  lines.push('');
  for (const [key, value] of Object.entries(config.postingDefaults || {})) {
    if (Array.isArray(value)) {
      lines.push(`- ${key}:`);
      value.forEach(item => lines.push(`  - ${item}`));
    } else {
      lines.push(`- ${key}: ${value}`);
    }
  }
  lines.push('');
  lines.push('## Channels');
  for (const channel of config.channels) {
    lines.push('');
    lines.push(`### ${channel.workingName} (${channel.id})`);
    lines.push(`- Niche type: ${channel.nicheType}`);
    lines.push(`- Thesis: ${channel.thesis}`);
    lines.push(`- Audience: ${channel.targetAudience}`);
    lines.push(`- Formats: ${channel.formats.join(', ')}`);
    lines.push(`- Credential profile: ${channel.youtubeCredentialProfile}`);
    lines.push('- Pillars:');
    channel.contentPillars.forEach(pillar => lines.push(`  - ${pillar}`));
    lines.push('- First topics:');
    channel.sampleTopics.forEach(topic => lines.push(`  - ${topic}`));
    lines.push('- Risk notes:');
    channel.riskNotes.forEach(note => lines.push(`  - ${note}`));
  }
  lines.push('');
  lines.push('## Launch sequence');
  lines.push('');
  lines.push('1. Create/verify each YouTube Brand Account manually.');
  lines.push('2. Put OAuth files under `config/youtube/<channel-id>/credentials.json` and `tokens.json`.');
  lines.push('3. Generate first batch with `npm run channels:batch`.');
  lines.push('4. Upload private/unlisted first. Review video, metadata, thumbnail, captions.');
  lines.push('5. Only after review, schedule/public. Track CTR, retention, comments, and topic velocity.');
  return lines.join('\n');
}

function writeEpisodeFiles(outDir, config, count) {
  const episodes = [];
  for (const channel of config.channels) {
    const channelDir = path.join(outDir, channel.id);
    ensureDir(channelDir);
    const topics = channel.sampleTopics.length ? channel.sampleTopics : [`First experiment for ${channel.workingName}`];
    for (let i = 0; i < count; i++) {
      const episode = makeEpisode(channel, topics[i % topics.length], i);
      episodes.push(episode);
      const epDir = path.join(channelDir, episode.id);
      ensureDir(epDir);
      fs.writeFileSync(path.join(epDir, 'episode.json'), JSON.stringify(episode, null, 2));
      fs.writeFileSync(path.join(epDir, 'script.md'), renderEpisodeMarkdown(episode));
      fs.writeFileSync(path.join(epDir, 'metadata.json'), JSON.stringify(episode.seo, null, 2));
    }
  }
  fs.writeFileSync(path.join(outDir, 'batch-summary.json'), JSON.stringify({ generatedAt: new Date().toISOString(), countPerChannel: count, episodes }, null, 2));
  return episodes;
}

function renderEpisodeMarkdown(episode) {
  const lines = [];
  lines.push(`# ${episode.title}`);
  lines.push('');
  lines.push(`- Channel: ${episode.workingChannelName} (${episode.channelId})`);
  lines.push(`- Format: ${episode.format}`);
  lines.push(`- Pillar: ${episode.pillar}`);
  lines.push(`- Approval: ${episode.approval.status}`);
  lines.push('');
  lines.push('## Hook');
  lines.push(episode.hook);
  lines.push('');
  lines.push('## Script');
  lines.push(episode.script);
  lines.push('');
  lines.push('## Storyboard');
  episode.storyboard.forEach(scene => lines.push(`- ${scene.seconds}: ${scene.visual}`));
  lines.push('');
  lines.push('## Metadata');
  lines.push(`- Description: ${episode.seo.description.replace(/\n/g, ' / ')}`);
  lines.push(`- Tags: ${episode.seo.tags.join(', ')}`);
  lines.push(`- Default privacy: ${episode.seo.defaultPrivacy}`);
  return lines.join('\n');
}

function checkCredentials(config) {
  return config.channels.map(channel => {
    const base = path.join(process.cwd(), 'config', 'youtube', channel.id);
    return {
      channelId: channel.id,
      workingName: channel.workingName,
      credentials: fs.existsSync(path.join(base, 'credentials.json')),
      tokens: fs.existsSync(path.join(base, 'tokens.json')),
      expectedDirectory: base
    };
  });
}

function main() {
  const [command = 'plan', ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const configPath = path.resolve(args.config || 'config/channels.sample.json');
  const outDir = path.resolve(args.out || 'runs/channel-launch');
  const config = readJson(configPath);
  ensureDir(outDir);

  if (command === 'plan') {
    fs.writeFileSync(path.join(outDir, 'launch-plan.md'), renderPlan(config));
    fs.writeFileSync(path.join(outDir, 'launch-plan.json'), JSON.stringify(config, null, 2));
    console.log(`Wrote launch plan to ${path.join(outDir, 'launch-plan.md')}`);
    return;
  }

  if (command === 'batch') {
    fs.writeFileSync(path.join(outDir, 'launch-plan.md'), renderPlan(config));
    const count = Number(args.count || 3);
    const episodes = writeEpisodeFiles(outDir, config, count);
    console.log(`Generated ${episodes.length} episode packs in ${outDir}`);
    return;
  }

  if (command === 'check-credentials') {
    const checks = checkCredentials(config);
    fs.writeFileSync(path.join(outDir, 'credential-check.json'), JSON.stringify(checks, null, 2));
    for (const check of checks) {
      const status = check.credentials && check.tokens ? 'READY' : 'MISSING';
      console.log(`${status} ${check.channelId} credentials=${check.credentials} tokens=${check.tokens}`);
      if (status === 'MISSING') console.log(`  expected: ${check.expectedDirectory}`);
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

if (require.main === module) main();

module.exports = { makeEpisode, renderPlan, writeEpisodeFiles, checkCredentials };
