#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sampleConfig } from './sample.js';
import { runClipsReport, runExperiment, runTrendResearchReport } from './runner.js';

function getFlag(args: string[], name: string, fallback?: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

async function initSample(): Promise<void> {
  const configDir = 'config';
  await mkdir(configDir, { recursive: true });
  const target = path.join(configDir, 'niches.sample.json');
  await writeFile(target, JSON.stringify(sampleConfig, null, 2));
  console.log(`Created ${target}`);
}

async function run(args: string[]): Promise<void> {
  const config = getFlag(args, '--config');
  const out = getFlag(args, '--out', 'runs/latest');
  if (!config) throw new Error('Missing --config <file>');
  const report = await runExperiment(config, out ?? 'runs/latest');
  console.log(`Wrote ${out}/report.json and ${out}/summary.md`);
  console.log(`Top niche: ${report.rankedReports[0]?.niche.name} (${report.rankedReports[0]?.score}/10)`);
}

async function clips(args: string[]): Promise<void> {
  const input = getFlag(args, '--input');
  const out = getFlag(args, '--out');
  if (!input) throw new Error('Missing --input <file>');
  if (!out) throw new Error('Missing --out <dir>');
  const report = await runClipsReport(input, out);
  console.log(`Wrote ${out}/report.json and ${out}/summary.md`);
  console.log(`Top clip: ${report.candidates[0]?.sourceId} ${report.candidates[0]?.startSeconds}s-${report.candidates[0]?.endSeconds}s (${report.candidates[0]?.score}/10)`);
}

async function trends(args: string[]): Promise<void> {
  const input = getFlag(args, '--input') ?? getFlag(args, '--config');
  const out = getFlag(args, '--out');
  if (!input) throw new Error('Missing --input <file> or --config <file>');
  if (!out) throw new Error('Missing --out <dir>');
  const report = await runTrendResearchReport(input, out);
  console.log(`Wrote ${out}/trend-report.json and ${out}/trend-summary.md`);
  console.log(`Top trend: ${report.rankedTrends[0]?.topic} (${report.rankedTrends[0]?.score}/10)`);
}

async function demo(): Promise<void> {
  await initSample();
  await run(['--config', 'config/niches.sample.json', '--out', 'runs/demo']);
}

async function demoIntel(): Promise<void> {
  await clips(['--input', 'config/video-intel.sample.json', '--out', 'runs/demo-intel/clips']);
  await trends(['--input', 'config/video-intel.sample.json', '--out', 'runs/demo-intel/trends']);
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'init-sample') return initSample();
  if (command === 'run') return run(args);
  if (command === 'clips' || command === 'clip') return clips(args);
  if (command === 'trends' || command === 'trend-watch') return trends(args);
  if (command === 'demo') return demo();
  if (command === 'demo-intel') return demoIntel();
  console.log(`YouTube Niche Lab

Commands:
  init-sample
  run --config <file> --out <dir>
  clip --input <file> --out <dir>
  clips --input <file> --out <dir>
  trend-watch --config <file> --out <dir>
  trends --input <file> --out <dir>
  demo
  demo-intel`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
