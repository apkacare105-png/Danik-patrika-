import { Fragment } from 'react';
import type { Block } from '@/lib/types';

/** **बोल्ड** इनलाइन फ़ॉर्मैटिंग */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

/**
 * Rich JSON ब्लॉक्स को रेंडर करता है। `afterParagraph` नोड (जैसे <AdSlot/>)
 * 2nd पैराग्राफ़ के बाद अपने-आप इंजेक्ट होता है।
 */
export function ContentRenderer({
  blocks, adNode, adAfter = 2,
}: { blocks: Block[]; adNode?: React.ReactNode; adAfter?: number }) {
  let paragraphs = 0;
  return (
    <div className="article-body">
      {blocks.map((b, i) => {
        let el: React.ReactNode = null;
        if (b.type === 'h2') el = <h2>{b.text}</h2>;
        else if (b.type === 'quote') el = <blockquote><Inline text={b.text ?? ''} /></blockquote>;
        else if (b.type === 'ul') el = <ul>{(b.items ?? []).map((it, j) => <li key={j}><Inline text={it} /></li>)}</ul>;
        else {
          paragraphs += 1;
          el = <p><Inline text={b.text ?? ''} /></p>;
        }
        return (
          <Fragment key={i}>
            {el}
            {b.type === 'p' && paragraphs === adAfter && adNode ? <div className="my-6">{adNode}</div> : null}
          </Fragment>
        );
      })}
    </div>
  );
}
