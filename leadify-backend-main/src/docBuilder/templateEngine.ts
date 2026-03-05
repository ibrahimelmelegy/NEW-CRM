/**
 * Simple template engine for document builder.
 * Supports: {{variable}}, {{#if condition}}...{{/if}}, {{#each items}}...{{/each}}
 */

interface BrandSettings {
  companyName?: string;
  logo?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyTaxId?: string;
  brandFooterText?: string;
}

/**
 * Resolve a dotted path like "item.name" from a data object.
 */
function resolvePath(obj: Record<string, any>, path: string): unknown {
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

/**
 * Escape HTML entities to prevent XSS.
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Process a single {{#each}} block body for one item, replacing scoped variables
 * and recursively handling any nested {{#each}} blocks within.
 */
function renderEachItem(body: string, item: any, index: number, parentData: Record<string, any>): string {
  let rendered = body;

  // Replace {{@index}} and {{@number}}
  rendered = rendered.replace(/\{\{@index\}\}/g, String(index));
  rendered = rendered.replace(/\{\{@number\}\}/g, String(index + 1));

  // Build a merged context: parent data + current item properties (item takes priority)
  const itemContext: Record<string, any> = { ...parentData };
  if (typeof item === 'object' && item !== null) {
    Object.assign(itemContext, item);
  }

  // Recursively process any nested {{#each}} blocks using the merged item context
  rendered = processEachBlocks(rendered, itemContext);

  // Replace {{this.field}} with item.field
  rendered = rendered.replace(/\{\{this\.(\w+(?:\.\w+)*)\}\}/g, (_m: string, field: string) => {
    const val = resolvePath(item, field);
    return val != null ? escapeHtml(String(val)) : '';
  });

  // Replace {{field}} that matches item keys (scoped to current item)
  if (typeof item === 'object' && item !== null) {
    for (const key of Object.keys(item)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, item[key] != null ? escapeHtml(String(item[key])) : '');
    }
  }

  return rendered;
}

/**
 * Process {{#each items}}...{{/each}} blocks with support for nested loops.
 * Inside the block, {{this.field}} or {{field}} references the current item.
 * {{@index}} gives the 0-based index, {{@number}} gives 1-based.
 *
 * Nesting strategy: the regex matches only leaf-level (innermost) blocks.
 * For each outer block, after expanding its items, inner {{#each}} blocks are
 * recursively processed with the child item's data merged into the context.
 * This supports at least 2 levels of nesting (e.g. items -> item.subItems).
 */
function processEachBlocks(template: string, data: Record<string, any>): string {
  // Match outermost {{#each}} blocks by finding the opening tag and then
  // manually locating the matching {{/each}} (accounting for nesting depth).
  const openTag = /\{\{#each\s+(\w+(?:\.\w+)*)\}\}/g;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = openTag.exec(template)) !== null) {
    const arrayPath = match[1];
    const bodyStart = match.index + match[0].length;

    // Find the matching {{/each}} by counting nesting depth
    let depth = 1;
    const openRe = /\{\{#each\s+\w+(?:\.\w+)*\}\}/g;
    const closeRe = /\{\{\/each\}\}/g;

    // Collect all open and close tag positions after bodyStart
    const tags: { pos: number; type: 'open' | 'close'; length: number }[] = [];

    openRe.lastIndex = bodyStart;
    let tagMatch: RegExpExecArray | null;
    while ((tagMatch = openRe.exec(template)) !== null) {
      tags.push({ pos: tagMatch.index, type: 'open', length: tagMatch[0].length });
    }
    closeRe.lastIndex = bodyStart;
    while ((tagMatch = closeRe.exec(template)) !== null) {
      tags.push({ pos: tagMatch.index, type: 'close', length: tagMatch[0].length });
    }
    tags.sort((a, b) => a.pos - b.pos);

    let bodyEnd = -1;
    let closeEnd = -1;
    for (const tag of tags) {
      if (tag.type === 'open') {
        depth++;
      } else {
        depth--;
        if (depth === 0) {
          bodyEnd = tag.pos;
          closeEnd = tag.pos + tag.length;
          break;
        }
      }
    }

    if (bodyEnd === -1) {
      // Malformed template — no matching close tag; skip this block
      result += template.substring(lastIndex, match.index + match[0].length);
      lastIndex = match.index + match[0].length;
      continue;
    }

    // Append everything before this {{#each}} block
    result += template.substring(lastIndex, match.index);

    const body = template.substring(bodyStart, bodyEnd);
    const items = resolvePath(data, arrayPath);

    if (Array.isArray(items) && items.length > 0) {
      result += items.map((item, index) => renderEachItem(body, item, index, data)).join('');
    }

    lastIndex = closeEnd;
    // Reset openTag regex to continue after the close tag
    openTag.lastIndex = closeEnd;
  }

  // Append any remaining template after the last block
  result += template.substring(lastIndex);

  return result;
}

/**
 * Process {{#if condition}}...{{else}}...{{/if}} blocks.
 * condition is truthy check on the data value.
 */
function processIfBlocks(template: string, data: Record<string, any>): string {
  // Handle if/else
  const ifElseRegex = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g;
  let result = template.replace(ifElseRegex, (_match, condition: string, trueBlock: string, falseBlock: string) => {
    const value = resolvePath(data, condition);
    return value ? trueBlock : falseBlock;
  });

  // Handle if without else
  const ifRegex = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(ifRegex, (_match, condition: string, block: string) => {
    const value = resolvePath(data, condition);
    return value ? block : '';
  });

  return result;
}

/**
 * Replace simple {{variable}} placeholders with data values.
 */
function replaceVariables(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, path: string) => {
    const val = resolvePath(data, path);
    return val != null ? escapeHtml(String(val)) : '';
  });
}

/**
 * Main render function: processes a template string with data and brand settings.
 *
 * Processing order:
 * 1. Inject brand settings as {{brand.*}} variables
 * 2. Process {{#each}} blocks
 * 3. Process {{#if}} blocks
 * 4. Replace {{variable}} placeholders
 */
export function renderTemplate(template: string, data: Record<string, any>, brand?: BrandSettings): string {
  // Merge brand settings into data under "brand" namespace
  const mergedData: Record<string, any> = {
    ...data,
    brand: {
      companyName: brand?.companyName || data.companyName || '',
      logo: brand?.logo || '',
      primaryColor: brand?.primaryColor || '#7c3aed',
      accentColor: brand?.accentColor || '#a855f7',
      fontFamily: brand?.fontFamily || "'Segoe UI', system-ui, sans-serif",
      companyAddress: brand?.companyAddress || data.companyAddress || '',
      companyPhone: brand?.companyPhone || data.companyPhone || '',
      companyEmail: brand?.companyEmail || data.companyEmail || '',
      companyTaxId: brand?.companyTaxId || data.companyTaxId || '',
      footerText: brand?.brandFooterText || 'Generated by Leadify CRM'
    }
  };

  let result = template;
  result = processEachBlocks(result, mergedData);
  result = processIfBlocks(result, mergedData);
  result = replaceVariables(result, mergedData);

  return result;
}

/**
 * Render a full document using a DocumentTemplate layout + content data + brand settings.
 * The template layout contains an HTML string with {{placeholders}}.
 */
export function renderFromTemplate(
  templateHtml: string,
  content: Record<string, any>,
  brand?: BrandSettings
): string {
  // Parse items financial data if present
  const items = content.items || [];
  const currency = content.currency || 'SAR';
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity || 0) * (item.rate || 0), 0);
  const discountAmount =
    content.discountType === 'percent' ? subtotal * ((content.discount || 0) / 100) : content.discount || 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * ((content.taxRate || 0) / 100);
  const total = taxableAmount + taxAmount;

  const enrichedContent = {
    ...content,
    currency,
    subtotal: subtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    total: total.toFixed(2),
    hasDiscount: discountAmount > 0,
    hasTax: (content.taxRate || 0) > 0,
    hasItems: items.length > 0,
    hasBank: !!content.bankName,
    hasPaymentTerms: !!content.paymentTerms,
    hasTerms: !!content.termsAndConditions,
    hasNotes: !!content.notes,
    // Format dates
    formattedDate: content.date ? new Date(content.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
    formattedDueDate: content.dueDate ? new Date(content.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
    formattedValidUntil: content.validUntil ? new Date(content.validUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
    // Enrich items with computed lineTotal
    items: items.map((item: any, i: number) => ({
      ...item,
      index: i + 1,
      lineTotal: ((item.quantity || 0) * (item.rate || 0)).toFixed(2)
    }))
  };

  return renderTemplate(templateHtml, enrichedContent, brand);
}

export type { BrandSettings };
