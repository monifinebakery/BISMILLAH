#!/usr/bin/env node
/**
 * Export in-app tutorials to Markdown for GitBook import.
 * - Reads src/data/tutorials/tutorialData.js
 * - Converts HTML section content to Markdown (basic mapping; preserves tables as raw HTML)
 * - Writes one Markdown file per tutorial to docs/gitbook/tutorials
 * - Generates docs/gitbook/SUMMARY.md
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Resolve project root based on this script location
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// Import tutorial data (ESM)
const tutorialDataPath = path.resolve(projectRoot, 'src/data/tutorials/tutorialData.js')
let tutorialData
try {
const mod = await import(pathToFileURL(tutorialDataPath).href)
  tutorialData = mod.tutorialData
  if (!Array.isArray(tutorialData)) throw new Error('tutorialData is not an array')
} catch (err) {
  console.error('Failed to import tutorial data from', tutorialDataPath)
  console.error(err)
  process.exit(1)
}

// Output directories
const docsRoot = path.resolve(projectRoot, 'docs', 'gitbook')
const tutorialsOutDir = path.resolve(docsRoot, 'tutorials')

await fs.mkdir(tutorialsOutDir, { recursive: true })

// Utilities
function slugify(str) {
  return String(str)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function escapeYaml(str) {
  if (str == null) return ''
  const s = String(str)
  if (/[:\-{}\[\],&*#?]|^\s|\s$|^[$%@`!]|\n/.test(s)) {
    // Quote if contains special YAML chars or leading/trailing space
    return '"' + s.replace(/"/g, '\\"') + '"'
  }
  return s
}

function convertInline(html) {
  let out = html
  // Basic inline replacements first
  out = out.replace(/<br\s*\/?>(\r?\n)?/gi, '\n')
  out = out.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
  out = out.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
  out = out.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
  out = out.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
  return out
}

function stripTagsExceptTables(html) {
  // Remove all tags except table-related ones we want to keep
  // Keep: table, thead, tbody, tr, th, td
  return html.replace(/<(?!\/?(?:table|thead|tbody|tr|th|td)\b)[^>]+>/gi, '')
}

function convertLists(html) {
  // Ordered lists
  html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => {
    const items = []
    const regex = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let m
    let i = 1
    while ((m = regex.exec(inner))) {
      const item = stripTagsExceptTables(convertInline(m[1])).trim()
      items.push(`${i}. ${item}`)
      i++
    }
    return '\n' + items.join('\n') + '\n'
  })

  // Unordered lists
  html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => {
    const items = []
    const regex = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let m
    while ((m = regex.exec(inner))) {
      const item = stripTagsExceptTables(convertInline(m[1])).trim()
      items.push(`- ${item}`)
    }
    return '\n' + items.join('\n') + '\n'
  })

  return html
}

function htmlToMarkdown(html) {
  if (!html) return ''
  let out = html

  // Normalize whitespace
  out = out.replace(/\r\n?/g, '\n')

  // Headings inside content
  out = out.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `\n### ${stripTagsExceptTables(convertInline(t)).trim()}\n\n`)
  out = out.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => `\n#### ${stripTagsExceptTables(convertInline(t)).trim()}\n\n`)
  out = out.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, t) => `\n##### ${stripTagsExceptTables(convertInline(t)).trim()}\n\n`)
  out = out.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, t) => `\n###### ${stripTagsExceptTables(convertInline(t)).trim()}\n\n`)

  // Paragraphs
  out = out.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, t) => `\n\n${stripTagsExceptTables(convertInline(t)).trim()}\n\n`)

  // Lists
  out = convertLists(out)

  // Preserve tables as raw HTML, but add newlines around them for Markdown
  out = out.replace(/<table[\s\S]*?<\/table>/gi, (m) => `\n\n${m}\n\n`)

  // Remove generic containers/spans and any remaining tags except tables
  out = out.replace(/<div[^>]*>/gi, '')
  out = out.replace(/<\/div>/gi, '')
  out = out.replace(/<span[^>]*>/gi, '')
  out = out.replace(/<\/span>/gi, '')

  // Remove any remaining non-table tags
  out = stripTagsExceptTables(out)

  // Collapse excessive blank lines
  out = out.replace(/\n{3,}/g, '\n\n')
  return out.trim() + '\n'
}

function buildFrontmatter(t) {
  const fm = [
    '---',
    `title: ${escapeYaml(t.title)}`,
    t.subtitle ? `description: ${escapeYaml(t.subtitle)}` : null,
    t.duration ? `duration: ${escapeYaml(t.duration)}` : null,
    t.icon ? `icon: ${escapeYaml(String(t.icon))}` : null,
    `id: ${t.id}`,
    '---',
    ''
  ].filter(Boolean).join('\n')
  return fm
}

function sectionAnchor(title) {
  // GitBook-compatible anchor (kebab-case)
  return slugify(title)
}

async function writeTutorialMarkdown(tutorial) {
  const slug = slugify(tutorial.title)
  const fileName = `${tutorial.id}-${slug}.md`
  const outPath = path.join(tutorialsOutDir, fileName)

  const lines = []
  lines.push(buildFrontmatter(tutorial))
  lines.push(`# ${tutorial.title}`)
  if (tutorial.subtitle) lines.push(`\n_${tutorial.subtitle}_\n`)
  if (tutorial.duration) lines.push(`> Durasi: ${tutorial.duration}\n`)

  if (tutorial.sections?.length) {
    lines.push('## Daftar Isi')
    for (const s of tutorial.sections) {
      const anchor = sectionAnchor(s.title)
      lines.push(`- [${s.title}](#${anchor})`)
    }
    lines.push('')

    for (const s of tutorial.sections) {
      lines.push(`\n## ${s.title}`)
      // Convert HTML content to Markdown
      const md = htmlToMarkdown(s.content)
      lines.push(md)
    }
  }

  const content = lines.join('\n')
  await fs.writeFile(outPath, content, 'utf8')
  return { outPath, fileName }
}

async function writeSummary(allTutorials) {
  const lines = ['# Summary', '', '## Tutorials']
  for (const t of allTutorials) {
    const slug = slugify(t.title)
    const fileName = `${t.id}-${slug}.md`
    lines.push(`- [${t.title}](tutorials/${fileName})`)
  }
  lines.push('')
  const summaryPath = path.join(docsRoot, 'SUMMARY.md')
  await fs.writeFile(summaryPath, lines.join('\n'), 'utf8')
  return summaryPath
}

async function main() {
  console.log(`Exporting ${tutorialData.length} tutorials to Markdown...`)
  const results = []
  for (const t of tutorialData) {
    const r = await writeTutorialMarkdown(t)
    results.push(r)
    console.log(`- Wrote ${path.relative(projectRoot, r.outPath)}`)
  }
  const summaryPath = await writeSummary(tutorialData)
  console.log(`- Wrote ${path.relative(projectRoot, summaryPath)}`)
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

