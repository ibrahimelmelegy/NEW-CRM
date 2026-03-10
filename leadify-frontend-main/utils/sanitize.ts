import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks.
 * Auto-imported by Nuxt from utils/ directory.
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'b',
      'i',
      'u',
      's',
      'del',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'figure',
      'figcaption',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'colgroup',
      'col',
      'caption',
      'blockquote',
      'pre',
      'code',
      'hr',
      'div',
      'span',
      'section',
      'article',
      'sub',
      'sup',
      'mark',
      'small',
      'dl',
      'dt',
      'dd',
      'input',
      'label'
    ],
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'target',
      'rel',
      'class',
      'id',
      'style',
      'width',
      'height',
      'colspan',
      'rowspan',
      'align',
      'valign',
      'data-*',
      'type',
      'checked',
      'disabled'
    ],
    ALLOW_DATA_ATTR: true
  });
}
