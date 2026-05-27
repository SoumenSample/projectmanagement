import {
  AlignmentType,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  ShadingType,
  ExternalHyperlink,
} from "docx"

// ─── HTML → docx paragraph converter ─────────────────────────────────────────
// The editor uses contentEditable and saves raw HTML.
// We parse that HTML on the server using a lightweight DOM walker
// (works in Node via a simple regex-based extractor, or via jsdom if available).

/**
 * Recursively walk a DOM node and collect { text, bold, italic, underline, color, fontSize } leaf runs.
 */
function walkNode(node, inherited = {}) {
  const runs = []

  if (node.nodeType === 3 /* TEXT_NODE */) {
    const text = node.textContent || ""
    if (text) runs.push({ ...inherited, text })
    return runs
  }

  if (node.nodeType !== 1 /* ELEMENT_NODE */) return runs

  const tag = node.tagName?.toLowerCase() ?? ""
  const style = node.getAttribute?.("style") ?? ""

  // Derive formatting from element
  const ctx = { ...inherited }

  if (["b", "strong"].includes(tag)) ctx.bold = true
  if (["i", "em"].includes(tag)) ctx.italic = true
  if (["u"].includes(tag)) ctx.underline = true
  if (["s", "strike", "del"].includes(tag)) ctx.strike = true

  // Inline style overrides
  if (style.includes("font-weight: bold") || style.includes("font-weight:bold")) ctx.bold = true
  if (style.includes("font-style: italic") || style.includes("font-style:italic")) ctx.italic = true
  if (style.includes("text-decoration: underline") || style.includes("text-decoration:underline")) ctx.underline = true

  const colorMatch = style.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\))/i)
  if (colorMatch) ctx.color = normalizeColor(colorMatch[1])

  const sizeMatch = style.match(/font-size\s*:\s*([\d.]+)(pt|px)/i)
  if (sizeMatch) {
    const val = parseFloat(sizeMatch[1])
    ctx.fontSize = sizeMatch[2] === "px" ? Math.round(val * 0.75) : Math.round(val)
  }

  const fontMatch = style.match(/font-family\s*:\s*([^;,"]+)/i)
  if (fontMatch) ctx.font = fontMatch[1].trim().replace(/['"]/g, "")

  for (const child of Array.from(node.childNodes ?? [])) {
    runs.push(...walkNode(child, ctx))
  }

  return runs
}

function normalizeColor(color) {
  if (color.startsWith("#")) {
    const hex = color.slice(1)
    return hex.length === 3
      ? hex.split("").map(c => c + c).join("")
      : hex
  }
  if (color.startsWith("rgb")) {
    const [r, g, b] = color.match(/\d+/g).map(Number)
    return [r, g, b].map(n => n.toString(16).padStart(2, "0")).join("")
  }
  return "000000"
}

function runsToTextRuns(runs) {
  return runs.map(r => {
    const opts = {
      text: r.text,
      bold: r.bold || false,
      italics: r.italic || false,
      strike: r.strike || false,
    }
    if (r.underline) opts.underline = {}
    if (r.color) opts.color = r.color
    if (r.fontSize) opts.size = r.fontSize * 2  // docx uses half-points
    if (r.font) opts.font = r.font
    return new TextRun(opts)
  })
}

/**
 * Parse an HTML string into an array of docx Paragraph/Table objects.
 * Works in Node.js via the JSDOM parser (peer dep) or falls back to a regex
 * path for plain text if JSDOM is unavailable.
 */
export function parseHtmlToDocxChildren({ title, summary, html }) {
  const children = []

  // Title paragraph
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: String(title || "Untitled document"), bold: true })],
      spacing: { after: 120 },
    })
  )

  // Subtitle / summary
  if (summary) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: String(summary), italics: true, color: "595959" })],
        spacing: { after: 240 },
      })
    )
  }

  // Parse HTML content
  const blocks = parseHtmlBlocks(html || "")
  children.push(...blocks)

  return children
}

/**
 * Parse HTML string into block-level docx elements.
 * Requires a DOM environment. In Next.js API routes (Node), use the
 * `parse5` or `jsdom` package. Here we use a lightweight parse5-style
 * regex walker that covers the tags the editor emits.
 */
function parseHtmlBlocks(html) {
  // Use DOMParser if running in browser (unlikely for API), or a node-safe parser.
  // We implement a simple recursive descent over the tag soup the editor produces.
  const paragraphs = []

  // Normalise br tags and block separators
  const normalized = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")

  // Split into top-level block elements
  const blockPattern = /<(h[1-6]|p|div|ul|ol|li|table|tr|td|th|hr|blockquote)(\s[^>]*)?>|<\/(h[1-6]|p|div|ul|ol|li|table|tr|td|th|blockquote)>/gi
  const blocks = splitIntoBlocks(normalized)

  for (const block of blocks) {
    const para = blockToParagraph(block)
    if (para) paragraphs.push(para)
  }

  return paragraphs
}

/**
 * Very lightweight block splitter — good enough for contentEditable HTML.
 * Splits on block-level opening tags and treats each chunk as one paragraph.
 */
function splitIntoBlocks(html) {
  const BLOCK_TAGS = "h1|h2|h3|h4|h5|h6|p|div|li|hr|table|tr|blockquote"
  const re = new RegExp(`<(${BLOCK_TAGS})(\\s[^>]*)?>([\\s\\S]*?)<\\/\\1>|<hr\\s*\\/?>`, "gi")

  const results = []
  let lastIndex = 0
  let match

  while ((match = re.exec(html)) !== null) {
    // Capture any leading text before this block
    const before = html.slice(lastIndex, match.index).trim()
    if (before && stripTags(before).trim()) {
      results.push({ tag: "p", inner: before, style: "" })
    }
    if (match[0].toLowerCase().startsWith("<hr")) {
      results.push({ tag: "hr", inner: "", style: "" })
    } else {
      results.push({ tag: match[1].toLowerCase(), inner: match[3] || "", style: match[2] || "" })
    }
    lastIndex = match.index + match[0].length
  }

  // Trailing text
  const trailing = html.slice(lastIndex).trim()
  if (trailing && stripTags(trailing).trim()) {
    results.push({ tag: "p", inner: trailing, style: "" })
  }

  // If nothing matched (editor stored plain text or divs), treat whole thing as p
  if (results.length === 0 && html.trim()) {
    results.push({ tag: "p", inner: html, style: "" })
  }

  return results
}

function stripTags(str) {
  return str.replace(/<[^>]*>/g, "")
}

/**
 * Convert a parsed block into a docx Paragraph.
 */
function blockToParagraph({ tag, inner, style }) {
  if (tag === "hr") {
    return new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 1 } },
      spacing: { before: 120, after: 120 },
      children: [],
    })
  }

  // Detect alignment from inline style
  let alignment = AlignmentType.LEFT
  if (style.includes("text-align: center") || style.includes("text-align:center")) alignment = AlignmentType.CENTER
  if (style.includes("text-align: right") || style.includes("text-align:right")) alignment = AlignmentType.RIGHT
  if (style.includes("text-align: justify") || style.includes("text-align:justify")) alignment = AlignmentType.BOTH

  const textRuns = extractTextRuns(inner)

  if (tag === "h1") {
    return new Paragraph({ heading: HeadingLevel.HEADING_1, children: textRuns, alignment, spacing: { before: 240, after: 120 } })
  }
  if (tag === "h2") {
    return new Paragraph({ heading: HeadingLevel.HEADING_2, children: textRuns, alignment, spacing: { before: 200, after: 100 } })
  }
  if (tag === "h3") {
    return new Paragraph({ heading: HeadingLevel.HEADING_3, children: textRuns, alignment, spacing: { before: 160, after: 80 } })
  }
  if (tag === "li") {
    return new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: textRuns,
      alignment,
    })
  }

  // Default: paragraph
  const text = stripTags(inner).trim()
  if (!text) return new Paragraph({ children: [], spacing: { after: 80 } })

  return new Paragraph({ children: textRuns, alignment, spacing: { after: 120 } })
}

/**
 * Extract inline TextRun objects from an HTML snippet,
 * respecting <b>, <strong>, <i>, <em>, <u>, <s>, <span style=...>, <a href=...>
 */
function extractTextRuns(html) {
  const runs = []
  // Simple inline tag tokeniser
  const re = /<(\/?)(\w+)(\s[^>]*)?>|([^<]+)/g
  const stack = [{}]  // formatting context stack
  let match

  while ((match = re.exec(html)) !== null) {
    const [, closing, tag, attrs, text] = match

    if (text !== undefined) {
      const ctx = stack[stack.length - 1]
      const clean = text
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
      if (clean) runs.push(buildTextRun(clean, ctx))
      continue
    }

    const tagLower = tag?.toLowerCase() ?? ""

    if (closing) {
      if (stack.length > 1) stack.pop()
      continue
    }

    // Self-closing / void
    if (["br", "img", "hr"].includes(tagLower)) {
      if (tagLower === "br") {
        const ctx = stack[stack.length - 1]
        runs.push(new TextRun({ ...buildRunProps(ctx), break: 1 }))
      }
      continue
    }

    // Build new context from parent
    const parent = stack[stack.length - 1]
    const ctx = { ...parent }
    const attrStr = attrs || ""

    if (["b", "strong"].includes(tagLower)) ctx.bold = true
    if (["i", "em"].includes(tagLower)) ctx.italic = true
    if (["u"].includes(tagLower)) ctx.underline = true
    if (["s", "strike", "del"].includes(tagLower)) ctx.strike = true

    // Span style parsing
    const styleMatch = attrStr.match(/style\s*=\s*["']([^"']+)["']/i)
    if (styleMatch) {
      const s = styleMatch[1]
      if (/font-weight\s*:\s*bold/i.test(s)) ctx.bold = true
      if (/font-style\s*:\s*italic/i.test(s)) ctx.italic = true
      if (/text-decoration[^:]*:\s*underline/i.test(s)) ctx.underline = true

      const cm = s.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\))/i)
      if (cm) ctx.color = normalizeColor(cm[1])

      const sm = s.match(/font-size\s*:\s*([\d.]+)(pt|px)/i)
      if (sm) {
        const val = parseFloat(sm[1])
        ctx.fontSize = sm[2] === "px" ? Math.round(val * 0.75) : Math.round(val)
      }

      const fm = s.match(/font-family\s*:\s*([^;,"]+)/i)
      if (fm) ctx.font = fm[1].trim().replace(/['"]/g, "")
    }

    // Anchor / hyperlink — handle separately so we can wrap in ExternalHyperlink
    if (tagLower === "a") {
      const hrefMatch = attrStr.match(/href\s*=\s*["']([^"']+)["']/i)
      if (hrefMatch) ctx.href = hrefMatch[1]
    }

    stack.push(ctx)
  }

  return runs.length > 0 ? runs : [new TextRun("")]
}

function buildRunProps(ctx) {
  const opts = {
    bold: ctx.bold || false,
    italics: ctx.italic || false,
    strike: ctx.strike || false,
  }
  if (ctx.underline) opts.underline = {}
  if (ctx.color) opts.color = ctx.color
  if (ctx.fontSize) opts.size = ctx.fontSize * 2
  if (ctx.font) opts.font = ctx.font
  return opts
}

function buildTextRun(text, ctx) {
  const props = buildRunProps(ctx)
  if (ctx.href) {
    return new ExternalHyperlink({
      link: ctx.href,
      children: [new TextRun({ ...props, text, style: "Hyperlink" })],
    })
  }
  return new TextRun({ ...props, text })
}

function parseInlineSegments(html) {
  const segments = []
  const re = /<(\/)?(b|strong|i|em|u|s|strike|del|span|a)(\s[^>]*)?>|([^<]+)/gi
  const stack = [{}]

  let match
  while ((match = re.exec(html)) !== null) {
    const [, closing, tag, attrs, text] = match

    if (text !== undefined) {
      const clean = text
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")

      if (clean) {
        const ctx = stack[stack.length - 1]
        segments.push({
          text: clean,
          bold: !!ctx.bold,
          italic: !!ctx.italic,
        })
      }
      continue
    }

    const tagLower = tag?.toLowerCase() ?? ""
    if (closing) {
      if (stack.length > 1) stack.pop()
      continue
    }

    const parent = stack[stack.length - 1]
    const ctx = { ...parent }
    const attrStr = attrs || ""

    if (tagLower === "b" || tagLower === "strong") ctx.bold = true
    if (tagLower === "i" || tagLower === "em") ctx.italic = true

    if (tagLower === "span") {
      const styleMatch = attrStr.match(/style\s*=\s*["']([^"']+)["']/i)
      if (styleMatch) {
        const style = styleMatch[1]
        if (/font-weight\s*:\s*bold/i.test(style)) ctx.bold = true
        if (/font-style\s*:\s*italic/i.test(style)) ctx.italic = true
      }
    }

    stack.push(ctx)
  }

  return segments
}

function htmlToShareBlocks(html) {
  const normalized = String(html || "")
    .replace(/<br\s*\/?>(\r?\n)?/gi, "\n")
    .replace(/&nbsp;/gi, " ")

  const blockPattern = /<(h[1-3]|p|div|li)(\s[^>]*)?>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi
  const blocks = []
  let lastIndex = 0
  let match

  while ((match = blockPattern.exec(normalized)) !== null) {
    const before = normalized.slice(lastIndex, match.index).trim()
    if (before && stripTags(before).trim()) {
      blocks.push({ type: "paragraph", segments: parseInlineSegments(before) })
    }

    if ((match[0] || "").toLowerCase().startsWith("<hr")) {
      blocks.push({ type: "blank", segments: [] })
    } else {
      const tag = (match[1] || "p").toLowerCase()
      const inner = match[3] || ""

      if (tag === "h1") blocks.push({ type: "heading1", segments: parseInlineSegments(inner) })
      else if (tag === "h2") blocks.push({ type: "heading2", segments: parseInlineSegments(inner) })
      else if (tag === "h3") blocks.push({ type: "heading3", segments: parseInlineSegments(inner) })
      else if (tag === "li") blocks.push({ type: "bullet", segments: parseInlineSegments(inner) })
      else blocks.push({ type: "paragraph", segments: parseInlineSegments(inner) })
    }

    lastIndex = match.index + match[0].length
  }

  const trailing = normalized.slice(lastIndex).trim()
  if (trailing && stripTags(trailing).trim()) {
    blocks.push({ type: "paragraph", segments: parseInlineSegments(trailing) })
  }

  if (blocks.length === 0 && normalized.trim()) {
    blocks.push({ type: "paragraph", segments: parseInlineSegments(normalized) })
  }

  return blocks
}

export function parseDocumentContent(html) {
  return htmlToShareBlocks(html)
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Build a .docx buffer from the document data saved by DocumentStudio.
 * `content` is the raw HTML string from the contentEditable editor.
 */
export function createWordDocumentBuffer({ title, summary, content }) {
  const docChildren = parseHtmlToDocxChildren({ title, summary, html: content })

  const doc = new Document({
    // ── Styles ──────────────────────────────────────────────────────────────
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 24, color: "000000" },  // 12pt body
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 36, bold: true, font: "Calibri", color: "2F5496" },
          paragraph: {
            spacing: { before: 240, after: 120 },
            outlineLevel: 0,
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, font: "Calibri", color: "2F5496" },
          paragraph: {
            spacing: { before: 200, after: 100 },
            outlineLevel: 1,
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: "Calibri", color: "1F3763" },
          paragraph: {
            spacing: { before: 160, after: 80 },
            outlineLevel: 2,
          },
        },
      ],
    },

    // ── Bullet numbering ────────────────────────────────────────────────────
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
        {
          reference: "numbered",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },

    // ── Page layout (US Letter, 1-inch margins) ──────────────────────────────
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240,   // 8.5 inches in DXA
              height: 15840,  // 11 inches in DXA
            },
            margin: {
              top: 1440,      // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: docChildren,
      },
    ],
  })

  return Packer.toBuffer(doc)
}