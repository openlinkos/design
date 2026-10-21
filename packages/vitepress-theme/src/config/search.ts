// A CJK-aware tokenizer for the local search. VitePress serializes miniSearch options into the
// client's site data and revives functions from their source text, so the tokenizer must be a
// self-contained named function: it may refer to nothing but its own name and globals.

/**
 * Splits text into words with `Intl.Segmenter` (word granularity, which segments Chinese by
 * dictionary), then splits each word like MiniSearch's default tokenizer does (spaces and
 * punctuation) so that `origin.openlinkos.com` still yields `openlinkos`. Without
 * `Intl.Segmenter` it falls back to MiniSearch's default.
 */
export function openlinkosTokenize(text: string): string[] {
  const split = /[\n\r\p{Z}\p{P}]+/u;
  if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') return text.split(split);
  const self = openlinkosTokenize as typeof openlinkosTokenize & { segmenter?: Intl.Segmenter };
  if (!self.segmenter) self.segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
  const words: string[] = [];
  for (const segment of self.segmenter.segment(text)) {
    if (!segment.isWordLike) continue;
    for (const part of segment.segment.split(split)) if (part) words.push(part);
  }
  return words;
}
