import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(process.cwd(), 'okf');
const errors = [];
const markdownFiles = [];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (entry.endsWith('.md')) markdownFiles.push(path);
  }
}

function parseFrontmatter(path, source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    errors.push(`${relative(process.cwd(), path)}: missing YAML frontmatter`);
    return;
  }
  const typeLine = match[1].split(/\r?\n/).find((line) => /^type:\s*/.test(line));
  const typeValue = typeLine?.replace(/^type:\s*/, '').trim().replace(/^['"]|['"]$/g, '').trim();
  if (!typeValue) {
    errors.push(`${relative(process.cwd(), path)}: frontmatter type is empty or missing`);
  }
  if (!/^type:\s*["']?[^"']+["']?\s*$/m.test(match[1])) {
    errors.push(`${relative(process.cwd(), path)}: frontmatter type must be a scalar value`);
  }
}

walk(root);
for (const path of markdownFiles) {
  const basename = path.split('/').pop();
  const source = readFileSync(path, 'utf8');
  if (basename === 'index.md' || basename === 'log.md') {
    if (/^---\r?\n/.test(source) && path !== join(root, 'index.md')) {
      errors.push(`${relative(process.cwd(), path)}: reserved files must not contain frontmatter`);
    }
    continue;
  }
  parseFrontmatter(path, source);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`OKF validation passed: ${markdownFiles.length} Markdown files checked.`);
}
