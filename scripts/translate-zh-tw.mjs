#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {createSlugger} = require('@docusaurus/utils');

const ROOT = path.resolve(import.meta.dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'i18n', 'translation-manifest.zh-tw.json');
const MODEL = process.env.TRANSLATION_MODEL || 'gpt-5.4-mini-2026-03-17';
const CONCURRENCY = Number.parseInt(process.env.TRANSLATION_CONCURRENCY || '10', 10);
const MAX_CHARS = Number.parseInt(process.env.TRANSLATION_CHUNK_CHARS || '9000', 10);
const API_URL = process.env.OPENAI_BASE_URL
  ? `${process.env.OPENAI_BASE_URL.replace(/\/$/, '')}/responses`
  : 'https://api.openai.com/v1/responses';

const CONTENT_ROOTS = [
  {
    name: 'docs',
    localized: 'docs',
    english: 'i18n/en/docusaurus-plugin-content-docs/current',
    copyAll: true,
  },
  {
    name: 'blog',
    localized: 'blog',
    english: 'i18n/en/docusaurus-plugin-content-blog-blog',
    copyAll: true,
  },
  {
    name: 'release_notes',
    localized: 'release_notes',
    english: 'i18n/en/docusaurus-plugin-content-docs-release-notes/current',
    copyAll: true,
  },
  {
    name: 'pages',
    localized: 'src/pages',
    english: 'i18n/en/docusaurus-plugin-content-pages',
    copyAll: false,
  },
];

const SYSTEM_PROMPT = `You are a senior technical translator localizing LiteLLM documentation into Traditional Chinese for Taiwan (zh-TW).

Translate every piece of reader-visible English prose faithfully and completely. A page is not complete while generic English UI or documentation phrases remain. Do not summarize, omit, expand, correct, or add commentary. Return only the translated source chunk, with no surrounding Markdown fence or explanation.

Language and terminology requirements:
- Use natural, professional Traditional Chinese as written in Taiwan. Never use Simplified Chinese.
- Address the reader as「您」when a pronoun is necessary; avoid unnecessary pronouns.
- Use「範例」or「示範」for example,「品質」for quality,「文件」for documentation/document, and「叢集」for cluster.
- Prefer these terms: provider=提供者, deployment=部署, request=請求, response=回應, routing=路由, retry=重試, fallback=備援, cache=快取, load balancing=負載平衡, observability=可觀測性, logging=記錄, guardrail=防護欄, API key=API 金鑰, dashboard=儀表板.
- Keep product names, company names, model IDs, API names, class/function/parameter names, environment variables, file paths, CLI commands, and established technical abbreviations in their original form. Translate generic labels around them: for example, Tutorials=教學, Guides=指南, client=用戶端, callback=回呼, agent=代理程式, gateway=閘道.

Source-preservation requirements:
- Preserve Markdown/MDX structure, frontmatter keys, heading levels, explicit heading IDs, tables, lists, admonitions, HTML/JSX tags, imports, indentation, and formatting.
- Preserve every token matching @@LITELLM_PROTECTED_\\d{6}@@ exactly once, byte for byte, and in its original order.
- Preserve all code, URLs, link destinations, paths, identifiers, version numbers, and JSX expression syntax. Exception: inside a mermaid fenced block, preserve Mermaid syntax and node IDs but translate every reader-visible node or edge label into zh-TW.
- Translate headings, paragraphs, list text, table prose, admonition titles/body, link labels, image alt text, and reader-visible JSX text or label attributes.
- Do not translate frontmatter id, slug, tags, authors, date, image, or other machine-readable metadata. You MUST translate every generic English phrase in frontmatter title, sidebar_label, description, pagination_label, and keywords when present; leaving values such as "Getting Started" in English is an error.
- Preserve existing bold and italic formatting. Do not wrap the response in a code fence.`;

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function isMarkdown(file) {
  return /\.(md|mdx)$/i.test(file);
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(directory) {
  const result = [];
  async function visit(current) {
    for (const entry of await fs.readdir(current, {withFileTypes: true})) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else result.push(absolute);
    }
  }
  if (await exists(directory)) await visit(directory);
  return result.sort();
}

async function copyMarkdownTree(source, destination) {
  for (const file of await listFiles(source)) {
    if (!isMarkdown(file)) continue;
    const relative = path.relative(source, file);
    const target = path.join(destination, relative);
    await fs.mkdir(path.dirname(target), {recursive: true});
    await fs.copyFile(file, target);
  }
}

async function loadManifest() {
  if (!(await exists(MANIFEST_PATH))) {
    return {version: 1, model: MODEL, files: {}};
  }
  return JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
}

let manifestWrite = Promise.resolve();
function saveManifest(manifest) {
  manifestWrite = manifestWrite.then(async () => {
    await fs.mkdir(path.dirname(MANIFEST_PATH), {recursive: true});
    const temp = `${MANIFEST_PATH}.tmp-${process.pid}`;
    await fs.writeFile(temp, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await fs.rename(temp, MANIFEST_PATH);
  });
  return manifestWrite;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args.shift() || 'help';
  let only = '';
  let force = false;
  let strict = false;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--only') only = args[++index] || '';
    else if (args[index] === '--force') force = true;
    else if (args[index] === '--strict') strict = true;
    else throw new Error(`未知參數：${args[index]}`);
  }
  return {command, only, force, strict};
}

async function prepareEnglish({force}) {
  const manifest = await loadManifest();
  if (Object.keys(manifest.files).length > 0 && !force) {
    throw new Error('翻譯清單已有資料；為避免以繁中覆寫英文備份，prepare 已停止。');
  }

  const sample = await fs.readFile(path.join(ROOT, 'docs', 'index.md'), 'utf8');
  const han = (sample.match(/[\u3400-\u9fff]/g) || []).length;
  if (han > 50 && !force) {
    throw new Error('docs/index.md 看似已是中文；為避免覆寫英文備份，prepare 已停止。');
  }

  for (const item of CONTENT_ROOTS) {
    const source = path.join(ROOT, item.localized);
    const destination = path.join(ROOT, item.english);
    await fs.rm(destination, {recursive: true, force: true});
    await fs.mkdir(destination, {recursive: true});
    if (item.copyAll) await fs.cp(source, destination, {recursive: true, force: true});
    else await copyMarkdownTree(source, destination);
    const count = (await listFiles(destination)).filter(isMarkdown).length;
    console.log(`已保存 ${item.name}：${count} 個英文內容檔案`);
  }

  const assetParents = [
    path.join(ROOT, 'i18n/en'),
    path.join(ROOT, 'i18n/en/docusaurus-plugin-content-docs'),
    path.join(ROOT, 'i18n/en/docusaurus-plugin-content-docs-release-notes'),
    path.join(ROOT, 'i18n/en/docusaurus-plugin-content-blog-blog'),
  ];
  for (const parent of assetParents) {
    for (const asset of ['img', 'src', 'static']) {
      const link = path.join(parent, asset);
      await fs.rm(link, {recursive: true, force: true});
      await fs.symlink(path.relative(parent, path.join(ROOT, asset)), link, 'dir');
    }
  }
  console.log('已建立英文內容共用資產連結：img、src、static');
}

function createProtector() {
  const values = [];
  return {
    protectEntry(value) {
      const token = `@@LITELLM_PROTECTED_${String(values.length).padStart(6, '0')}@@`;
      const entry = {token, value};
      values.push(entry);
      return entry;
    },
    protect(value) {
      return this.protectEntry(value).token;
    },
    restore(text) {
      let restored = text;
      for (const {token, value} of [...values].reverse()) restored = restored.split(token).join(value);
      return restored;
    },
    validate(text, expectedTokens = values.map(({token}) => token)) {
      const errors = [];
      for (const token of expectedTokens) {
        const count = text.split(token).length - 1;
        if (count !== 1) errors.push(`${token} 出現 ${count} 次`);
      }
      return errors;
    },
    values,
  };
}

function protectFencedCode(text, protector) {
  const lines = text.match(/.*(?:\n|$)/g)?.filter(Boolean) || [];
  const output = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*(`{3,}|~{3,})([^\n]*)/);
    if (!match) {
      output.push(lines[index]);
      continue;
    }

    const marker = match[1];
    const language = match[2].trim().split(/\s+/)[0].toLowerCase();
    let end = index + 1;
    const closing = new RegExp(`^\\s*${marker[0]}{${marker.length},}\\s*(?:\\n)?$`);
    while (end < lines.length && !closing.test(lines[end])) end += 1;
    if (end >= lines.length) {
      output.push(lines[index]);
      continue;
    }
    const block = lines.slice(index, end + 1).join('');
    output.push(language === 'mermaid' ? block : protector.protect(block));
    index = end;
  }
  return output.join('');
}

function addExplicitHeadingIds(text) {
  const slugger = createSlugger();
  return text
    .split('\n')
    .map((line) => {
      const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
      if (!match || /\s\{#[^}]+\}\s*$/.test(match[2])) return line;
      const id = slugger.slug(match[2]);
      return id ? `${line} {#${id}}` : line;
    })
    .join('\n');
}

function protectFrontmatter(text, protector) {
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) return text;
  const lines = text.split(/(?<=\n)/);
  let inFrontmatter = true;
  let translatableContinuation = false;
  for (let index = 1; index < lines.length && inFrontmatter; index += 1) {
    const raw = lines[index];
    const content = raw.replace(/\r?\n$/, '');
    const newline = raw.slice(content.length);
    if (content === '---') {
      inFrontmatter = false;
      continue;
    }
    const key = content.match(/^([A-Za-z_][\w-]*):/);
    if (key) {
      translatableContinuation = new Set([
        'title',
        'sidebar_label',
        'description',
        'pagination_label',
        'keywords',
      ]).has(key[1]);
    }
    if (!translatableContinuation) lines[index] = `${protector.protect(content)}${newline}`;
  }
  return lines.join('');
}

function protectEsm(text, protector) {
  const lines = text.match(/.*(?:\n|$)/g)?.filter(Boolean) || [];
  const output = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^(?:import|export)\s/.test(lines[index])) {
      output.push(lines[index]);
      continue;
    }
    const block = [lines[index]];
    while (!/[;}][ \t]*(?:\r?\n)?$/.test(block.at(-1)) && index + 1 < lines.length) {
      block.push(lines[++index]);
      if (/^\s*$/.test(block.at(-1))) break;
    }
    output.push(protector.protect(block.join('')));
  }
  return output.join('');
}

function protectMarkdownDestinations(text, protector) {
  let output = '';
  let cursor = 0;
  while (cursor < text.length) {
    const start = text.indexOf('](', cursor);
    if (start === -1) return output + text.slice(cursor);
    output += text.slice(cursor, start + 2);
    let depth = 1;
    let end = start + 2;
    let escaped = false;
    for (; end < text.length; end += 1) {
      const char = text[end];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '(') depth += 1;
      else if (char === ')') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) return output + text.slice(start + 2);
    output += protector.protect(text.slice(start + 2, end));
    output += ')';
    cursor = end + 1;
  }
  return output;
}

function protectDocument(source, {strict = false} = {}) {
  const protector = createProtector();
  let text = protectFencedCode(source, protector);
  text = addExplicitHeadingIds(text);
  const expectedHeadingIds = headingIds(text);
  const headingEntries = [];
  if (strict) {
    text = text
      .split(/(?<=\n)/)
      .map((line) => {
        const match = line.match(/^(#{1,6}\s+)(.*?)(\s+\{#([^}\n]+)\})(\r?\n)?$/);
        if (!match) return line;
        const entry = protector.protectEntry(line.slice(0, line.length - (match[5]?.length || 0)));
        headingEntries.push({
          entry,
          prefix: match[1],
          text: match[2],
          id: match[4],
          newline: match[5] || '',
        });
        return `${entry.token}${match[5] || ''}`;
      })
      .join('');
  } else {
    text = text.replace(/\{#[^}\n]+\}/g, (value) => protector.protect(value));
  }
  text = protectFrontmatter(text, protector);
  text = protectEsm(text, protector);
  text = text.replace(/<!--[\s\S]*?-->/g, (value) => protector.protect(value));
  text = text.replace(/(`+)([^`\n]*?)\1/g, (value) => protector.protect(value));
  text = text.replace(/require\((['"])[^'"\n]+\1\)/g, (value) => protector.protect(value));
  text = protectMarkdownDestinations(text, protector);
  text = text.replace(/^(\s*\[[^\]\n]+\]:\s*)(\S+)/gm, (_, prefix, value) =>
    `${prefix}${protector.protect(value)}`,
  );
  text = text.replace(
    /(\b(?:href|src|to|url|action)\s*=\s*)(["'])([^"'\n]*)\2/g,
    (_, prefix, quote, value) => `${prefix}${quote}${protector.protect(value)}${quote}`,
  );
  text = text.replace(/https?:\/\/[^\s<>"')\]}]+/g, (value) => protector.protect(value));
  return {text, protector, expectedHeadingIds, headingEntries};
}

function splitChunks(text) {
  const units = text.split(/\n{2,}/);
  const chunks = [];
  let current = '';
  const expandedUnits = units.flatMap((unit) => {
    if (unit.length <= MAX_CHARS) return [unit];
    const pieces = [];
    let piece = '';
    for (const line of unit.split('\n')) {
      if (piece && piece.length + line.length + 1 > MAX_CHARS) {
        pieces.push(piece);
        piece = line;
      } else {
        piece = piece ? `${piece}\n${line}` : line;
      }
    }
    if (piece) pieces.push(piece);
    return pieces;
  });
  for (const unit of expandedUnits) {
    if (!unit) continue;
    if (current && current.length + unit.length + 2 > MAX_CHARS) {
      chunks.push(current);
      current = unit;
    } else {
      current = current ? `${current}\n\n${unit}` : unit;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function extractOutput(response) {
  if (response.output_text) return response.output_text;
  return (response.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' || typeof item.text === 'string')
    .map((item) => item.text || '')
    .join('');
}

function parseRetryDelay(value, attempt) {
  if (value) {
    const seconds = Number.parseFloat(value);
    if (Number.isFinite(seconds)) return Math.min(60_000, Math.max(1_000, seconds * 1000));
  }
  return Math.min(60_000, 1500 * 2 ** attempt) + Math.floor(Math.random() * 1000);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function translateChunk(chunk, context, expectedTokens, additionalInstruction = '') {
  let lastError;
  for (let attempt = 0; attempt < 7; attempt += 1) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          reasoning: {effort: 'none'},
          text: {verbosity: 'low'},
          max_output_tokens: Math.min(64_000, Math.max(4000, Math.ceil(chunk.length * 1.5))),
          input: [
            {role: 'system', content: SYSTEM_PROMPT},
            {
              role: 'user',
              content:
                `${additionalInstruction ? `${additionalInstruction}\n\n` : ''}` +
                `File: ${context}\n\n<<<SOURCE>>>\n${chunk}\n<<<END_SOURCE>>>`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        const error = new Error(`OpenAI HTTP ${response.status}: ${detail.slice(0, 500)}`);
        error.retryAfter = response.headers.get('retry-after');
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }

      const data = await response.json();
      if (data.status === 'incomplete') {
        throw new Error(`模型輸出不完整：${JSON.stringify(data.incomplete_details || {})}`);
      }
      let output = extractOutput(data).trim();
      output = output
        .replace(/^<<<SOURCE>>>\s*\n?/, '')
        .replace(/\n?<<<END_SOURCE>>>\s*$/, '');
      if (/^```(?:markdown|md)?\s*\n/i.test(output) && /\n```\s*$/.test(output)) {
        output = output.replace(/^```(?:markdown|md)?\s*\n/i, '').replace(/\n```\s*$/, '');
      }
      if (!output) throw new Error('模型回傳空白內容');

      const tokenErrors = [];
      for (const token of expectedTokens) {
        const count = output.split(token).length - 1;
        if (count !== 1) tokenErrors.push(`${token}:${count}`);
      }
      if (tokenErrors.length) {
        const error = new Error(`保護符號驗證失敗：${tokenErrors.slice(0, 8).join(', ')}`);
        error.retryable = true;
        throw error;
      }

      return {
        output,
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      };
    } catch (error) {
      lastError = error;
      if (attempt === 6 || error.retryable === false) break;
      const delay = parseRetryDelay(error.retryAfter, attempt);
      console.warn(`重試 ${context}，${Math.round(delay / 1000)} 秒後再試：${error.message}`);
      await sleep(delay);
    }
  }
  throw lastError;
}

function protectHeadingText(text, protector) {
  let protectedText = text.replace(/(`+)([^`\n]*?)\1/g, (value) => protector.protect(value));
  protectedText = protectMarkdownDestinations(protectedText, protector);
  protectedText = protectedText.replace(/https?:\/\/[^\s<>"')\]}]+/g, (value) =>
    protector.protect(value),
  );
  return protectedText;
}

async function translateStrictHeadings(entries, context) {
  if (!entries.length) return {inputTokens: 0, outputTokens: 0};
  const protector = createProtector();
  const source = entries.map((entry) => protectHeadingText(entry.text, protector));
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const result = await translateChunk(
        JSON.stringify(source),
        `${context}（標題 JSON 陣列）`,
        protector.values.map(({token}) => token),
      );
      const output = JSON.parse(result.output);
      if (!Array.isArray(output) || output.length !== entries.length) {
        throw new Error(`標題陣列數量不符：預期 ${entries.length}，實際 ${output?.length}`);
      }
      for (let index = 0; index < entries.length; index += 1) {
        if (typeof output[index] !== 'string') throw new Error(`第 ${index + 1} 個標題不是字串`);
        const translated = protector.restore(output[index]);
        entries[index].entry.value =
          `${entries[index].prefix}${translated} {#${entries[index].id}}`;
      }
      return {inputTokens: result.inputTokens, outputTokens: result.outputTokens};
    } catch (error) {
      lastError = error;
      if (attempt < 4) await sleep(1000 * (attempt + 1));
    }
  }
  throw lastError;
}

function headingIds(text) {
  return [...text.matchAll(/^#{1,6}\s+.*?\s\{#([^}]+)\}\s*$/gm)].map((match) => match[1]);
}

function validateTranslation(expectedIds, translated, protector, protectedSource, {allowExtra = false} = {}) {
  const topLevelTokens = protector.values
    .map(({token}) => token)
    .filter((token) => protectedSource.includes(token));
  const errors = protector.validate(translated, topLevelTokens);
  const actualIds = headingIds(protector.restore(translated));
  const preservesExpectedOrder = expectedIds.every((id, index) => actualIds.indexOf(id) >= index);
  if (
    (!allowExtra && JSON.stringify(expectedIds) !== JSON.stringify(actualIds)) ||
    (allowExtra && !preservesExpectedOrder)
  ) {
    errors.push(`標題 ID 不一致：預期 ${expectedIds.length}，實際 ${actualIds.length}`);
  }
  return errors;
}

async function atomicWrite(file, content) {
  await fs.mkdir(path.dirname(file), {recursive: true});
  const temp = `${file}.tmp-${process.pid}`;
  await fs.writeFile(temp, content, 'utf8');
  await fs.rename(temp, file);
}

async function mapContentFiles(only = '') {
  const files = [];
  for (const item of CONTENT_ROOTS) {
    const englishRoot = path.join(ROOT, item.english);
    for (const source of await listFiles(englishRoot)) {
      if (!isMarkdown(source)) continue;
      const relative = path.relative(englishRoot, source);
      const logical = path.posix.join(item.localized, relative.split(path.sep).join('/'));
      if (only && !logical.includes(only)) continue;
      files.push({logical, source, destination: path.join(ROOT, item.localized, relative)});
    }
  }
  return files.sort((a, b) => a.logical.localeCompare(b.logical));
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  async function runner() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({length: Math.min(concurrency, items.length)}, runner));
}

async function translateAll({only, force, strict}) {
  if (!process.env.OPENAI_API_KEY) throw new Error('缺少 OPENAI_API_KEY');
  const manifest = await loadManifest();
  manifest.model = MODEL;
  const files = await mapContentFiles(only);
  if (!files.length) throw new Error('找不到英文來源；請先執行 prepare。');

  let completed = 0;
  let skipped = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  const failures = [];
  const total = files.length;
  const started = Date.now();

  await runPool(files, CONCURRENCY, async (file) => {
    try {
      const source = await fs.readFile(file.source, 'utf8');
      const sourceHash = sha256(source);
      const current = manifest.files[file.logical];
      if (!force && current?.sourceSha256 === sourceHash && (await exists(file.destination))) {
        const destination = await fs.readFile(file.destination, 'utf8');
        if (current.translationSha256 === sha256(destination)) {
          skipped += 1;
          return;
        }
      }

      const {text: protectedSource, protector, expectedHeadingIds, headingEntries} =
        protectDocument(source, {strict});
      const chunks = splitChunks(protectedSource);
      const translatedChunks = [];
      let fileInputTokens = 0;
      let fileOutputTokens = 0;
      if (strict) {
        const headingResult = await translateStrictHeadings(headingEntries, file.logical);
        fileInputTokens += headingResult.inputTokens;
        fileOutputTokens += headingResult.outputTokens;
      }
      for (let index = 0; index < chunks.length; index += 1) {
        const expectedTokens = protector.values
          .map(({token}) => token)
          .filter((token) => chunks[index].includes(token));
        const result = await translateChunk(
          chunks[index],
          `${file.logical} (${index + 1}/${chunks.length})`,
          expectedTokens,
        );
        translatedChunks.push(result.output);
        fileInputTokens += result.inputTokens;
        fileOutputTokens += result.outputTokens;
      }

      const translatedProtected = translatedChunks.join('\n\n');
      const errors = validateTranslation(
        expectedHeadingIds,
        translatedProtected,
        protector,
        protectedSource,
        {allowExtra: strict},
      );
      if (errors.length) throw new Error(`${file.logical} 驗證失敗：${errors.join('；')}`);
      const translated = `${protector.restore(translatedProtected).trimEnd()}\n`;
      await atomicWrite(file.destination, translated);
      manifest.files[file.logical] = {
        sourceSha256: sourceHash,
        translationSha256: sha256(translated),
        inputTokens: fileInputTokens,
        outputTokens: fileOutputTokens,
      };
      await saveManifest(manifest);

      completed += 1;
      inputTokens += fileInputTokens;
      outputTokens += fileOutputTokens;
      const elapsed = Math.max(1, Math.round((Date.now() - started) / 1000));
      console.log(
        `[${Math.min(completed + skipped, total)}/${total}] ${file.logical}｜${chunks.length} 區塊｜` +
          `${fileInputTokens + fileOutputTokens} tokens｜${elapsed} 秒`,
      );
    } catch (error) {
      const attempt = (file.attempt || 0) + 1;
      if (attempt < 3) {
        console.warn(`${file.logical} 整頁驗證失敗，排入第 ${attempt + 1} 次重譯：${error.message}`);
        files.push({...file, attempt});
      } else {
        failures.push(`${file.logical}：${error.message}`);
        console.error(`${file.logical} 重譯失敗：${error.message}`);
      }
    }
  });

  await manifestWrite;
  const estimatedCost = (inputTokens / 1_000_000) * 0.75 + (outputTokens / 1_000_000) * 4.5;
  console.log(
    `完成 ${completed}、略過 ${skipped}；輸入 ${inputTokens}、輸出 ${outputTokens} tokens；` +
      `本次估算 US$${estimatedCost.toFixed(2)}`,
  );
  if (failures.length) throw new Error(`仍有 ${failures.length} 頁失敗：\n${failures.join('\n')}`);
}

function stripProtectedTechnicalText(source) {
  const {text} = protectDocument(source);
  return text.replace(/@@LITELLM_PROTECTED_\d{6}@@/g, '');
}

function isGenericEnglishHeading(heading) {
  const visible = heading
    .replace(/\s+\{#[^}]+\}\s*$/, '')
    .replace(/<[^>]+>/g, '')
    .trim();
  if (!visible || /[\u3400-\u9fff]/.test(visible)) return false;
  if (/^(?:Responses?|Chat Completions?) API$/i.test(visible)) return false;
  return /^(?:getting\s+started|quick\s*start|overview|usage|configuration|examples?|supported(?:\s+.+)?|how\s+to\b.*|prerequisites?|installation|setup(?:\s+.+)?|troubleshooting|features?|authentication(?:\s+.+)?|responses?(?:\s+.+)?|requests?(?:\s+body)?|errors?(?:\s+.+)?|costs?(?:\s+.+)?|logging|security(?:\s+.+)?|benefits?|next\s+steps?|step\s+\d+\b.*|original\s+request|transformed\s+request)$/i.test(
    visible,
  );
}

function isEnglishOnlyVisibleHeading(heading) {
  const visible = heading
    .replace(/\s+\{#[^}]+\}\s*$/, '')
    .replace(/<[^>]+>/g, '')
    .replace(/`[^`]+`/g, '')
    .trim();
  return /[A-Za-z]/.test(visible) && !/[\u3400-\u9fff]/.test(visible);
}

async function repairEnglishHeadings({only, strict}) {
  if (!process.env.OPENAI_API_KEY) throw new Error('缺少 OPENAI_API_KEY');
  const manifest = await loadManifest();
  const files = await mapContentFiles(only);
  let repairedFiles = 0;
  let repairedHeadings = 0;

  await runPool(files, Math.min(CONCURRENCY, 6), async (file) => {
    if (!(await exists(file.destination))) return;
    const translated = await fs.readFile(file.destination, 'utf8');
    const lines = translated.split(/(?<=\n)/);
    const entries = [];
    const replacements = [];
    let fenceMarker = '';

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const fence = line.match(/^\s*(`{3,}|~{3,})/);
      if (fence) {
        if (!fenceMarker) fenceMarker = fence[1][0];
        else if (fence[1][0] === fenceMarker) fenceMarker = '';
        continue;
      }
      if (fenceMarker) continue;
      const newline = line.endsWith('\r\n') ? '\r\n' : line.endsWith('\n') ? '\n' : '';
      const content = newline ? line.slice(0, -newline.length) : line;
      const match = content.match(/^(#{1,6}\s+)(.*?)(\s+\{#([^}\n]+)\})$/);
      if (
        !match ||
        !(strict ? isEnglishOnlyVisibleHeading(match[2]) : isGenericEnglishHeading(match[2]))
      ) {
        continue;
      }
      const entry = {value: content};
      entries.push({
        entry,
        prefix: match[1],
        text: match[2],
        id: match[4],
        newline: '',
      });
      replacements.push({index, entry, newline});
    }

    if (!entries.length) return;
    const usage = await translateStrictHeadings(entries, `${file.logical}（漏翻標題修復）`);
    for (const replacement of replacements) {
      lines[replacement.index] = `${replacement.entry.value}${replacement.newline}`;
    }
    const repaired = lines.join('');
    await atomicWrite(file.destination, repaired);
    if (manifest.files[file.logical]) {
      manifest.files[file.logical].translationSha256 = sha256(repaired);
      manifest.files[file.logical].inputTokens += usage.inputTokens;
      manifest.files[file.logical].outputTokens += usage.outputTokens;
      await saveManifest(manifest);
    }
    repairedFiles += 1;
    repairedHeadings += entries.length;
    console.log(`${file.logical}：補譯 ${entries.length} 個標題`);
  });

  await manifestWrite;
  console.log(`完成：${repairedFiles} 個檔案、${repairedHeadings} 個讀者可見標題。`);
}

async function repairReleaseCommits({only}) {
  if (!process.env.OPENAI_API_KEY) throw new Error('缺少 OPENAI_API_KEY');
  const manifest = await loadManifest();
  const files = (await mapContentFiles(only)).filter((file) =>
    file.logical.startsWith('release_notes/'),
  );
  let repairedFiles = 0;
  let repairedLines = 0;
  const commitPattern = /^(\s*-\s+(?:feat|fix|chore|build|perf|refactor|docs|test|ci)(?:\([^)]*\))?:\s+)(.*?)(\s+-\s+\[PR\s+#[^\]]+\]\([^)]+\)\s*)?$/i;

  await runPool(files, Math.min(CONCURRENCY, 6), async (file) => {
    if (!(await exists(file.destination))) return;
    const translated = await fs.readFile(file.destination, 'utf8');
    const lines = translated.split(/(?<=\n)/);
    const protector = createProtector();
    const entries = [];

    for (let index = 0; index < lines.length; index += 1) {
      const newline = lines[index].endsWith('\r\n') ? '\r\n' : lines[index].endsWith('\n') ? '\n' : '';
      const content = newline ? lines[index].slice(0, -newline.length) : lines[index];
      const match = content.match(commitPattern);
      const prBullet = content.match(/^(\s*-\s+)(.+)$/);
      if (
        (!match || /[\u3400-\u9fff]/.test(match[2])) &&
        (!prBullet || !/\[PR\s+#[^\]]+\]\([^)]+\)/.test(prBullet[2]) || /[\u3400-\u9fff]/.test(prBullet[2]))
      ) {
        continue;
      }
      entries.push({
        index,
        prefix: match ? match[1] : prBullet[1],
        source: protectHeadingText(match ? match[2] : prBullet[2], protector),
        suffix: match ? match[3] || '' : '',
        newline,
      });
    }
    if (!entries.length) return;

    const result = await translateChunk(
      JSON.stringify(entries.map((entry) => entry.source)),
      `${file.logical}（發布說明提交摘要）`,
      protector.values.map(({token}) => token),
      '輸入是發布說明中讀者可見的提交摘要 JSON 字串陣列，可能是 Conventional Commit 摘要或附有 PR 連結的一般項目。將英文敘述完整翻成 zh-TW；保留 Conventional Commit 前綴、產品名稱、程式識別字、PR 編號、Markdown 結構與保護符號。只回傳元素數量與順序完全相同的 JSON 字串陣列。',
    );
    const output = JSON.parse(result.output);
    if (!Array.isArray(output) || output.length !== entries.length) {
      throw new Error(`${file.logical}：發布說明摘要陣列數量不符`);
    }
    for (let index = 0; index < entries.length; index += 1) {
      if (typeof output[index] !== 'string') throw new Error(`${file.logical}：摘要不是字串`);
      const entry = entries[index];
      lines[entry.index] =
        `${entry.prefix}${protector.restore(output[index])}${entry.suffix}${entry.newline}`;
    }

    const repaired = lines.join('');
    await atomicWrite(file.destination, repaired);
    if (manifest.files[file.logical]) {
      manifest.files[file.logical].translationSha256 = sha256(repaired);
      manifest.files[file.logical].inputTokens += result.inputTokens;
      manifest.files[file.logical].outputTokens += result.outputTokens;
      await saveManifest(manifest);
    }
    repairedFiles += 1;
    repairedLines += entries.length;
    console.log(`${file.logical}：補譯 ${entries.length} 筆提交摘要`);
  });

  await manifestWrite;
  console.log(`完成：${repairedFiles} 個發布說明、${repairedLines} 筆提交摘要。`);
}

async function repairImageAltText({only}) {
  if (!process.env.OPENAI_API_KEY) throw new Error('缺少 OPENAI_API_KEY');
  const manifest = await loadManifest();
  const files = await mapContentFiles(only);
  let repairedFiles = 0;
  let repairedAltTexts = 0;

  await runPool(files, Math.min(CONCURRENCY, 6), async (file) => {
    if (!(await exists(file.destination))) return;
    const translated = await fs.readFile(file.destination, 'utf8');
    const lines = translated.split(/(?<=\n)/);
    const entries = [];
    let fenceMarker = '';
    let inComment = false;

    for (let index = 0; index < lines.length; index += 1) {
      if (inComment) {
        if (lines[index].includes('-->')) inComment = false;
        continue;
      }
      if (lines[index].includes('<!--')) {
        if (!lines[index].includes('-->')) inComment = true;
        continue;
      }
      const fence = lines[index].match(/^\s*(`{3,}|~{3,})/);
      if (fence) {
        if (!fenceMarker) fenceMarker = fence[1][0];
        else if (fence[1][0] === fenceMarker) fenceMarker = '';
        continue;
      }
      if (fenceMarker) continue;
      lines[index] = lines[index].replace(/!\[([^\]]+)\](\([^)]+\))/g, (full, alt, destination) => {
        const wordCount = (alt.match(/[A-Za-z]+/g) || []).length;
        if (wordCount < 2 || /[\u3400-\u9fff]/.test(alt)) return full;
        const entryIndex = entries.length;
        entries.push(alt);
        return `![@@LITELLM_ALT_${String(entryIndex).padStart(4, '0')}@@]${destination}`;
      });
    }
    if (!entries.length) return;

    const result = await translateChunk(
      JSON.stringify(entries),
      `${file.logical}（圖片替代文字）`,
      [],
      '輸入是圖片替代文字的 JSON 字串陣列。將每個讀者可見的英文替代文字翻成精簡自然的 zh-TW；保留產品名稱、模型名稱與技術識別字。只回傳元素數量與順序完全相同的 JSON 字串陣列。',
    );
    const output = JSON.parse(result.output);
    if (!Array.isArray(output) || output.length !== entries.length) {
      throw new Error(`${file.logical}：圖片替代文字陣列數量不符`);
    }
    let repaired = lines.join('');
    for (let index = 0; index < entries.length; index += 1) {
      if (typeof output[index] !== 'string') throw new Error(`${file.logical}：替代文字不是字串`);
      const token = `@@LITELLM_ALT_${String(index).padStart(4, '0')}@@`;
      repaired = repaired.replace(token, output[index]);
    }
    await atomicWrite(file.destination, repaired);
    if (manifest.files[file.logical]) {
      manifest.files[file.logical].translationSha256 = sha256(repaired);
      manifest.files[file.logical].inputTokens += result.inputTokens;
      manifest.files[file.logical].outputTokens += result.outputTokens;
      await saveManifest(manifest);
    }
    repairedFiles += 1;
    repairedAltTexts += entries.length;
    console.log(`${file.logical}：補譯 ${entries.length} 筆圖片替代文字`);
  });

  await manifestWrite;
  console.log(`完成：${repairedFiles} 個檔案、${repairedAltTexts} 筆圖片替代文字。`);
}

async function repairBoldLabels({only}) {
  if (!process.env.OPENAI_API_KEY) throw new Error('缺少 OPENAI_API_KEY');
  const manifest = await loadManifest();
  const files = await mapContentFiles(only);
  let repairedFiles = 0;
  let repairedLabels = 0;

  await runPool(files, Math.min(CONCURRENCY, 6), async (file) => {
    if (!(await exists(file.destination))) return;
    const translated = await fs.readFile(file.destination, 'utf8');
    const lines = translated.split(/(?<=\n)/);
    const protector = createProtector();
    const entries = [];
    let fence = null;
    let inComment = false;

    for (let index = 0; index < lines.length; index += 1) {
      if (inComment) {
        if (lines[index].includes('-->')) inComment = false;
        continue;
      }
      if (lines[index].includes('<!--')) {
        if (!lines[index].includes('-->')) inComment = true;
        continue;
      }
      const marker = lines[index].match(/^\s*(`{3,}|~{3,})(.*?)(?:\r?\n)?$/);
      if (marker) {
        if (!fence) fence = {char: marker[1][0], length: marker[1].length};
        else if (
          marker[1][0] === fence.char &&
          marker[1].length >= fence.length &&
          /^\s*$/.test(marker[2])
        ) {
          fence = null;
        }
        continue;
      }
      if (fence) continue;
      const newline = lines[index].endsWith('\r\n') ? '\r\n' : lines[index].endsWith('\n') ? '\n' : '';
      const content = newline ? lines[index].slice(0, -newline.length) : lines[index];
      const match = content.match(/^(\s*(?:-\s+)?\*\*)(.+?)(\*\*\s*)$/);
      if (!match || /[\u3400-\u9fff]/.test(match[2]) || !/[A-Za-z]/.test(match[2])) continue;
      entries.push({
        index,
        prefix: match[1],
        source: protectHeadingText(match[2], protector),
        suffix: match[3],
        newline,
      });
    }
    if (!entries.length) return;

    const result = await translateChunk(
      JSON.stringify(entries.map((entry) => entry.source)),
      `${file.logical}（粗體分類標籤）`,
      protector.values.map(({token}) => token),
      '輸入是文件中讀者可見的粗體分類或小節標籤 JSON 字串陣列。將一般英文標籤完整翻成精簡自然的 zh-TW；純產品名稱、API 名稱、模型名稱與程式識別字維持原文。保留 Markdown 連結與保護符號。只回傳元素數量與順序完全相同的 JSON 字串陣列。',
    );
    const output = JSON.parse(result.output);
    if (!Array.isArray(output) || output.length !== entries.length) {
      throw new Error(`${file.logical}：粗體標籤陣列數量不符`);
    }
    for (let index = 0; index < entries.length; index += 1) {
      if (typeof output[index] !== 'string') throw new Error(`${file.logical}：粗體標籤不是字串`);
      const entry = entries[index];
      lines[entry.index] =
        `${entry.prefix}${protector.restore(output[index])}${entry.suffix}${entry.newline}`;
    }
    const repaired = lines.join('');
    await atomicWrite(file.destination, repaired);
    if (manifest.files[file.logical]) {
      manifest.files[file.logical].translationSha256 = sha256(repaired);
      manifest.files[file.logical].inputTokens += result.inputTokens;
      manifest.files[file.logical].outputTokens += result.outputTokens;
      await saveManifest(manifest);
    }
    repairedFiles += 1;
    repairedLabels += entries.length;
    console.log(`${file.logical}：補譯 ${entries.length} 個粗體標籤`);
  });

  await manifestWrite;
  console.log(`完成：${repairedFiles} 個檔案、${repairedLabels} 個粗體標籤。`);
}

async function verifyAll({only}) {
  const manifest = await loadManifest();
  const files = await mapContentFiles(only);
  const errors = [];
  let englishHeadingCount = 0;
  const genericEnglishHeadings = [];
  let translatedCount = 0;
  for (const file of files) {
    if (!(await exists(file.destination))) {
      errors.push(`${file.logical}：缺少繁中檔案`);
      continue;
    }
    const source = await fs.readFile(file.source, 'utf8');
    const translated = await fs.readFile(file.destination, 'utf8');
    const expectedIds = protectDocument(source).expectedHeadingIds;
    const actualIds = headingIds(translated);
    let lastHeadingIndex = -1;
    const preservesHeadingIds = expectedIds.every((id) => {
      const index = actualIds.indexOf(id, lastHeadingIndex + 1);
      if (index < 0) return false;
      lastHeadingIndex = index;
      return true;
    });
    if (!preservesHeadingIds) errors.push(`${file.logical}：英文標題錨點未完整保留`);
    const record = manifest.files[file.logical];
    if (!record) errors.push(`${file.logical}：缺少翻譯清單記錄`);
    else {
      if (record.sourceSha256 !== sha256(source)) errors.push(`${file.logical}：英文原文已有變更`);
      if (record.translationSha256 !== sha256(translated)) errors.push(`${file.logical}：繁中檔案雜湊不符`);
    }

    const sourceProse = stripProtectedTechnicalText(source);
    const translatedProse = stripProtectedTechnicalText(translated);
    const englishLetters = (sourceProse.match(/[A-Za-z]/g) || []).length;
    const hanCharacters = (translatedProse.match(/[\u3400-\u9fff]/g) || []).length;
    if (englishLetters > 200 && hanCharacters < 10) errors.push(`${file.logical}：未偵測到足夠繁中內容`);
    if (englishLetters > 200 && source === translated) errors.push(`${file.logical}：內容仍與英文原文相同`);
    const visibleHeadings = [...translatedProse.matchAll(/^#{1,6}\s+([^\n]+)$/gm)];
    englishHeadingCount += visibleHeadings.filter((match) => /[A-Za-z]/.test(match[1])).length;
    for (const match of visibleHeadings) {
      if (isGenericEnglishHeading(match[1])) {
        genericEnglishHeadings.push(`${file.logical}：${match[1].trim()}`);
      }
    }
    translatedCount += 1;
  }

  console.log(
    `已檢查 ${translatedCount}/${files.length} 個內容頁；` +
      `含英文字母的可見標題 ${englishHeadingCount} 個；通用英文標題 ${genericEnglishHeadings.length} 個。`,
  );
  if (genericEnglishHeadings.length) {
    console.error(genericEnglishHeadings.slice(0, 100).join('\n'));
    errors.push(`仍有 ${genericEnglishHeadings.length} 個通用英文標題`);
  }
  if (errors.length) {
    console.error(errors.slice(0, 100).join('\n'));
    throw new Error(`完整性檢查失敗，共 ${errors.length} 項`);
  }
  console.log('翻譯檔案、來源雜湊與內容覆蓋率檢查通過。');
}

async function showStatus({only}) {
  const manifest = await loadManifest();
  const files = await mapContentFiles(only);
  let current = 0;
  for (const file of files) {
    const source = await fs.readFile(file.source, 'utf8');
    const record = manifest.files[file.logical];
    if (record?.sourceSha256 !== sha256(source) || !(await exists(file.destination))) continue;
    const translated = await fs.readFile(file.destination, 'utf8');
    if (record.translationSha256 === sha256(translated)) current += 1;
  }
  console.log(`翻譯進度：${current}/${files.length}；模型：${manifest.model || MODEL}`);
}

function showHelp() {
  console.log(`用法：
  node scripts/translate-zh-tw.mjs prepare
  node scripts/translate-zh-tw.mjs translate [--only path-fragment] [--force] [--strict]
  node scripts/translate-zh-tw.mjs repair-headings [--only path-fragment] [--strict]
  node scripts/translate-zh-tw.mjs repair-release-commits [--only path-fragment]
  node scripts/translate-zh-tw.mjs repair-alt-text [--only path-fragment]
  node scripts/translate-zh-tw.mjs repair-bold-labels [--only path-fragment]
  node scripts/translate-zh-tw.mjs verify [--only path-fragment]
  node scripts/translate-zh-tw.mjs status [--only path-fragment]

環境變數：
  OPENAI_API_KEY                 必填
  TRANSLATION_MODEL              預設 ${MODEL}
  TRANSLATION_CONCURRENCY        預設 ${CONCURRENCY}
  TRANSLATION_CHUNK_CHARS        預設 ${MAX_CHARS}`);
}

const options = parseArgs();
try {
  if (options.command === 'prepare') await prepareEnglish(options);
  else if (options.command === 'translate') await translateAll(options);
  else if (options.command === 'repair-headings') await repairEnglishHeadings(options);
  else if (options.command === 'repair-release-commits') await repairReleaseCommits(options);
  else if (options.command === 'repair-alt-text') await repairImageAltText(options);
  else if (options.command === 'repair-bold-labels') await repairBoldLabels(options);
  else if (options.command === 'verify') await verifyAll(options);
  else if (options.command === 'status') await showStatus(options);
  else showHelp();
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}
