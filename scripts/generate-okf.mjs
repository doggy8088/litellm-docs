import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, posix, relative, sep } from 'node:path';

const repoRoot = process.cwd();
const okfRoot = join(repoRoot, 'okf');
const conceptsRoot = join(okfRoot, 'concepts');

function git(...args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function trackedFiles(pattern) {
  return git('ls-files', '-z', '--', pattern).split('\0').filter(Boolean);
}

function splitFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  return match ? { raw: match[1], body: match[2] } : { raw: '', body: source };
}

function parseSimpleFrontmatter(raw) {
  const values = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match || match[2].startsWith('#')) continue;
    const value = match[2].trim();
    if (!value) {
      values[match[1]] = '';
    } else if (value.startsWith('[') && value.endsWith(']')) {
      values[match[1]] = value.slice(1, -1).split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    } else {
      values[match[1]] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return values;
}

function humanize(filePath) {
  const base = filePath.replace(/\.md$/, '').split('/').pop();
  const value = base === 'index' ? filePath.split('/').at(-2) || 'Repository' : base;
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sourceType(filePath) {
  if (filePath === 'README.md' || filePath === 'CONTRIBUTING.md' || filePath === 'CLAUDE.md') return 'Repository document';
  if (filePath === 'index.md') return 'Blog page';
  if (filePath.startsWith('docs/')) return 'Documentation page';
  if (filePath.startsWith('blog/')) return 'Blog post';
  if (filePath.startsWith('release_notes/')) return 'Release note';
  if (filePath.startsWith('src/pages/')) return 'Standalone page';
  return 'Markdown document';
}

function sourceArea(filePath) {
  if (filePath === 'index.md') return 'blog';
  if (filePath.startsWith('docs/')) return 'docs';
  if (filePath.startsWith('blog/')) return 'blog';
  if (filePath.startsWith('release_notes/')) return 'release-notes';
  if (filePath.startsWith('src/pages/')) return 'pages';
  return 'repository';
}

function outputPath(filePath) {
  let area = sourceArea(filePath);
  let rest = filePath;
  if (area === 'docs') rest = filePath.slice('docs/'.length);
  if (area === 'blog') rest = filePath === 'index.md' ? 'root-index.md' : filePath.slice('blog/'.length);
  if (area === 'release-notes') rest = filePath.slice('release_notes/'.length);
  if (area === 'pages') rest = filePath.slice('src/pages/'.length);
  if (area === 'repository') rest = filePath;
  if (rest === 'index.md') rest = '__index.md';
  if (rest.endsWith('/index.md')) rest = `${rest.slice(0, -'index.md'.length)}__index.md`;
  if (rest === 'log.md') rest = '__log.md';
  if (rest.endsWith('/log.md')) rest = `${rest.slice(0, -'log.md'.length)}__log.md`;
  return join(conceptsRoot, area, rest);
}

function repoUrl() {
  const remote = git('remote', 'get-url', 'origin')
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '');
  return remote;
}

function firstDescription(body, fallback) {
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*(import|export)\s+.*$/gm, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return fallback;
  return plain.length > 180 ? `${plain.slice(0, 177).trimEnd()}...` : plain;
}

function longestFence(source) {
  const runs = source.match(/`+/g) || [];
  return '`'.repeat(Math.max(3, ...runs.map((run) => run.length)) + 1);
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function conceptDocument({ sourcePath, source, revision, origin }) {
  const { raw: sourceFrontmatter, body } = splitFrontmatter(source);
  const parsed = parseSimpleFrontmatter(sourceFrontmatter);
  const type = sourceType(sourcePath);
  const title = parsed.title || humanize(sourcePath);
  const description = parsed.description || firstDescription(body, `Source document at ${sourcePath}.`);
  const area = sourceArea(sourcePath);
  const tags = [area, type.toLowerCase().replace(/\s+/g, '-')];
  const sourceLink = `${origin}/blob/main/${sourcePath}`;
  const fence = longestFence(source);
  const metadataKeys = Object.keys(parsed);
  const frontmatter = [
    '---',
    `type: ${yamlString(type)}`,
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `resource: ${yamlString(sourceLink)}`,
    `tags: ${JSON.stringify(tags)}`,
    `source_path: ${yamlString(sourcePath)}`,
    `source_area: ${yamlString(area)}`,
    `source_revision: ${yamlString(revision)}`,
    `source_frontmatter_keys: ${JSON.stringify(metadataKeys)}`,
    '---',
  ].join('\n');
  const bodyText = [
    '# Source document',
    '',
    `This concept mirrors [\`${sourcePath}\`](${sourceLink}) from Git revision \`${revision}\`.`,
    '',
    'The original file is preserved below so the OKF bundle remains a portable, inspectable representation of the repository documentation.',
    '',
    '## Original content',
    '',
    `${fence}markdown`,
    source.replace(/\s+$/, ''),
    fence,
    '',
  ].join('\n');
  return `${frontmatter}\n${bodyText}`;
}

function writeFile(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

function writeGroupIndex(area, files) {
  const labels = {
    docs: 'Documentation pages',
    blog: 'Blog posts',
    'release-notes': 'Release notes',
    pages: 'Standalone pages',
    repository: 'Repository documents',
  };
  const lines = [
    `# ${labels[area] || area}`,
    '',
    `This directory contains ${files.length} OKF concepts generated from the repository's ${area} Markdown sources.`,
    '',
    `## Concepts (${files.length})`,
    '',
  ];
  for (const sourcePath of files) {
    const destination = relative(join(conceptsRoot, area), outputPath(sourcePath)).split(sep).join('/');
    const { raw } = splitFrontmatter(readFileSync(join(repoRoot, sourcePath), 'utf8'));
    const metadata = parseSimpleFrontmatter(raw);
    const label = metadata.title || humanize(sourcePath);
    lines.push(`- [${label}](${destination}) - \`${sourcePath}\``);
  }
  writeFile(join(conceptsRoot, area, 'index.md'), `${lines.join('\n')}\n`);
}

function writeConceptIndex(groups) {
  const lines = [
    '# Source concept corpus',
    '',
    'The source corpus mirrors every tracked Markdown file outside `okf/`. Files named `index.md` or `log.md` are renamed with a leading double underscore because those names are reserved by OKF.',
    '',
    '## Areas',
    '',
  ];
  for (const [area, files] of Object.entries(groups)) {
    lines.push(`- [${area}](${area}/) - ${files.length} concepts`);
  }
  writeFile(join(conceptsRoot, 'index.md'), `${lines.join('\n')}\n`);
}

function writeInventory(allFiles, markdownFiles, revision, timestamp) {
  const byTopLevel = new Map();
  const byExtension = new Map();
  for (const file of allFiles) {
    const top = file.includes('/') ? file.split('/')[0] : file;
    byTopLevel.set(top, (byTopLevel.get(top) || 0) + 1);
    const extension = extname(file).toLowerCase() || '(none)';
    byExtension.set(extension, (byExtension.get(extension) || 0) + 1);
  }
  const origin = repoUrl();
  const rows = (map) => [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, count]) => `| \`${key}\` | ${count} |`).join('\n');
  const content = [
    '---',
    'type: "Repository inventory"',
    'title: "LiteLLM docs repository inventory"',
    `description: ${yamlString(`Tracked-file inventory for ${origin}.`)}`,
    `resource: ${yamlString(origin)}`,
    'tags: ["repository", "inventory", "provenance"]',
    `source_revision: ${yamlString(revision)}`,
    `timestamp: ${yamlString(timestamp)}`,
    '---',
    '',
    '# Scope',
    '',
    `This inventory was generated from ${origin} at Git revision \`${revision}\`. It covers ${allFiles.length} tracked source files outside \`okf/\`, including ${markdownFiles.length} Markdown files mirrored under [the source concept corpus](concepts/).`,
    '',
    '# Tracked files by top-level path',
    '',
    '| Top-level path | Files |',
    '|---|---:|',
    rows(byTopLevel),
    '',
    '# Tracked files by extension',
    '',
    '| Extension | Files |',
    '|---|---:|',
    rows(byExtension),
    '',
    '# Coverage notes',
    '',
    '- Markdown sources are copied into OKF concept files with source metadata and their original contents.',
    '- Images, stylesheets, JavaScript, TypeScript, JSON, and other non-Markdown files are represented by this inventory, the [complete tracked path list](repository-files.md), and the architecture concepts; they are not duplicated into the bundle.',
    '- The source repository remains authoritative for executable configuration and binary assets.',
    '',
  ].join('\n');
  writeFile(join(okfRoot, 'repository-inventory.md'), content);

  const fileList = [
    '---',
    'type: "Repository file index"',
    'title: "Complete tracked source file list"',
    `description: ${yamlString(`Complete tracked source path list for ${origin}.`)}`,
    `resource: ${yamlString(origin)}`,
    'tags: ["repository", "inventory", "files"]',
    `source_revision: ${yamlString(revision)}`,
    '---',
    '',
    '# Complete tracked source file list',
    '',
    `This list contains all ${allFiles.length} tracked source paths outside the generated \`okf/\` directory at Git revision \`${revision}\`.`,
    '',
  ];
  for (const file of allFiles) fileList.push(`- \`${file}\``);
  fileList.push('');
  writeFile(join(okfRoot, 'repository-files.md'), fileList.join('\n'));
}

const revision = git('rev-parse', 'HEAD');
const timestamp = git('show', '-s', '--format=%cI', 'HEAD');
const origin = repoUrl();
const allFiles = trackedFiles('.').filter((file) => !file.startsWith('okf/'));
const markdownFiles = trackedFiles('*.md').filter((file) => !file.startsWith('okf/'));
const groups = { repository: [], docs: [], blog: [], 'release-notes': [], pages: [] };

rmSync(conceptsRoot, { recursive: true, force: true });
for (const sourcePath of markdownFiles) {
  const area = sourceArea(sourcePath);
  groups[area].push(sourcePath);
  const destination = outputPath(sourcePath);
  const source = readFileSync(join(repoRoot, sourcePath), 'utf8');
  writeFile(destination, conceptDocument({ sourcePath, source, revision, origin }));
}

for (const [area, files] of Object.entries(groups)) {
  files.sort((a, b) => a.localeCompare(b));
  writeGroupIndex(area, files);
}
writeConceptIndex(groups);
writeInventory(allFiles, markdownFiles, revision, timestamp);

console.log(`Generated ${markdownFiles.length} OKF source concepts at ${relative(repoRoot, conceptsRoot)}.`);
