import { Post } from '../types.js';

export interface PostFieldDelta {
  field: 'title' | 'text' | 'cta' | 'hashtags';
  chunk: string;
}

export class IncrementalPostParser {
  private buffer = '';
  private emittedLengths: Record<'title' | 'text' | 'cta', number> = {
    title: 0,
    text: 0,
    cta: 0,
  };
  private emittedHashtagsCount = 0;

  public feed(chunk: string): PostFieldDelta[] {
    this.buffer += chunk;
    const deltas: PostFieldDelta[] = [];

    // Parse string fields: title, text, cta
    const fields: Array<'title' | 'text' | 'cta'> = ['title', 'text', 'cta'];
    for (const field of fields) {
      const extracted = this.extractStringField(field);
      if (extracted !== null && extracted.length > this.emittedLengths[field]) {
        const deltaChunk = extracted.slice(this.emittedLengths[field]);
        this.emittedLengths[field] = extracted.length;
        deltas.push({ field, chunk: deltaChunk });
      }
    }

    // Parse hashtags array
    const tags = this.extractHashtagsArray();
    if (tags.length > this.emittedHashtagsCount) {
      const newTags = tags.slice(this.emittedHashtagsCount);
      this.emittedHashtagsCount = tags.length;
      for (const tag of newTags) {
        deltas.push({ field: 'hashtags', chunk: tag });
      }
    }

    return deltas;
  }

  public getFinalPost(): Post | null {
    // Attempt standard JSON parse first
    try {
      // Find JSON block if wrapped in markdown ```json ... ```
      let cleaned = this.buffer.trim();
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/);
      if (codeBlockMatch) {
        cleaned = codeBlockMatch[1].trim();
      }

      // If missing closing brace, try to append
      if (!cleaned.endsWith('}') && cleaned.includes('{')) {
        cleaned += '\n}';
      }

      const parsed = JSON.parse(cleaned);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          title: String(parsed.title || ''),
          text: String(parsed.text || ''),
          cta: String(parsed.cta || ''),
          hashtags: Array.isArray(parsed.hashtags)
            ? parsed.hashtags.map((h: unknown) => String(h).replace(/^#/, ''))
            : [],
        };
      }
    } catch {
      // Fallback: build from extracted fields
    }

    const title = this.extractStringField('title') || '';
    const text = this.extractStringField('text') || '';
    const cta = this.extractStringField('cta') || '';
    const hashtags = this.extractHashtagsArray();

    if (title || text || cta || hashtags.length > 0) {
      return { title, text, cta, hashtags };
    }

    return null;
  }

  private extractStringField(fieldName: string): string | null {
    const keyRegex = new RegExp(`"${fieldName}"\\s*:\\s*"`, 'i');
    const match = this.buffer.match(keyRegex);
    if (!match || match.index === undefined) return null;

    const startIndex = match.index + match[0].length;
    let result = '';
    let isEscaped = false;

    for (let i = startIndex; i < this.buffer.length; i++) {
      const char = this.buffer[i];

      if (isEscaped) {
        if (char === 'n') result += '\n';
        else if (char === 'r') result += '\r';
        else if (char === 't') result += '\t';
        else if (char === '"') result += '"';
        else if (char === '\\') result += '\\';
        else result += char;
        isEscaped = false;
        continue;
      }

      if (char === '\\') {
        isEscaped = true;
        continue;
      }

      if (char === '"') {
        // String completed
        return result;
      }

      result += char;
    }

    return result;
  }

  private extractHashtagsArray(): string[] {
    const keyMatch = this.buffer.match(/"hashtags"\s*:\s*\[/i);
    if (!keyMatch || keyMatch.index === undefined) return [];

    const startIndex = keyMatch.index + keyMatch[0].length;
    const arraySlice = this.buffer.slice(startIndex);

    const tags: string[] = [];
    const itemRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(arraySlice)) !== null) {
      const tag = match[1].replace(/\\"/g, '"').replace(/^#+/, '').trim();
      if (tag) {
        tags.push(tag);
      }
      // Stop if array closing bracket reached before this match
      const closingBracketIndex = arraySlice.indexOf(']');
      if (closingBracketIndex !== -1 && match.index > closingBracketIndex) {
        break;
      }
    }

    return tags;
  }
}
