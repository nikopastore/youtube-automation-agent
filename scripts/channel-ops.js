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
  const disclaimer = channel.id === 'probability-briefs'
    ? 'Educational only — not financial advice. Check source data before acting.'
    : channel.id === 'classroom-workflow-lab'
      ? 'Use with your own classroom policies. Do not include real student data.'
      : 'Verify tools and claims in your own workflow before adopting.';
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
      categoryHint: channel.id === 'probability-briefs' ? 'News & Politics / Education' : 'Education / Science & Technology',
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
    'agent-ops-lab': [
      {
        setup: `I picked one real business task: ${topic}. The test is not whether the demo looks impressive — it is whether the agent leaves receipts.`,
        demo: 'Score it on four things: the plan it made, the files or outputs it changed, the checks it ran, and the exact failure it reported instead of hiding.',
        takeaway: 'If you cannot inspect the run log, tests, and final diff, you do not have an autonomous workflow — you have a black box.',
        cta: 'Follow for one practical AI-agent test every week, with the boring operational details included.'
      },
      {
        setup: `${topic} sounds like a small detail, but it is the difference between useful autonomy and chaos.`,
        demo: 'My rule: no agent publishes, deploys, or messages a customer until the approval gate checks source, claim, owner, rollback, and test result.',
        takeaway: 'Autonomy works better when the default path is draft → verify → approve, not draft → publish → apologize.',
        cta: 'Subscribe if you want agent workflows that survive contact with real work.'
      }
    ],
    'probability-briefs': [
      {
        setup: `${topic}. Here is the key: a market price is not a prophecy — it is a live estimate of probability.`,
        demo: 'Look at the implied odds, the recent move, and the reason the move happened. If the price changed but the source did not, be careful.',
        takeaway: 'The useful question is not “is the market right?” It is “what would need to happen for this price to be obviously wrong?”',
        cta: 'Follow for simple market reads without the hype.'
      },
      {
        setup: `${topic}. The headline tells one story; the odds tell another.`,
        demo: 'Start with the current price, convert it to probability, compare it to consensus, then write down the one data point that would change your mind.',
        takeaway: 'That habit keeps you from treating every price move like a prediction and every headline like evidence.',
        cta: 'Subscribe for one probability brief at a time.'
      }
    ],
    'classroom-workflow-lab': [
      {
        setup: `${topic}. The goal is not another teacher app — it is fewer open loops before Monday morning.`,
        demo: 'Use three buckets: must teach, must prep, and can reuse. Then turn the reusable piece into a template before you make anything new.',
        takeaway: 'The win is repeatability: one good template should save time every week, not just today.',
        cta: 'Follow for teacher workflows that protect your planning time.'
      },
      {
        setup: `${topic}. This works because it starts with the classroom routine, not the tool.`,
        demo: 'Pick one repeated task, write the decision rules, make the first version manually, and only then automate the boring parts.',
        takeaway: 'Automation should make the teacher more present, not turn the classroom into a dashboard.',
        cta: 'Subscribe for practical classroom systems teachers can actually use.'
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
    'agent-ops-lab': [
      `Most AI-agent demos hide this part.`,
      `This is where autonomous agents usually fail.`,
      `I tested the workflow so you do not have to.`
    ],
    'probability-briefs': [
      `This market is pricing something the headlines missed.`,
      `The odds just moved — here is the simple read.`,
      `One chart explains the whole market.`
    ],
    'classroom-workflow-lab': [
      `Teachers: steal this workflow.`,
      `This saves prep time without adding another app.`,
      `Here is a classroom system I would automate first.`
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
