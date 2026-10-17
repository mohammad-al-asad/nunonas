import type { ReactNode } from "react";

// Minimal Markdown renderer for admin-edited legal text: headings, paragraphs,
// lists, bold, italic and links. Builds React elements (never raw HTML), so
// stored content can't inject markup or scripts.

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: Extract<Block, { kind: "list" }> | null = null;

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
    if (list) blocks.push(list);
    paragraph = [];
    list = null;
  };

  for (const rawLine of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const bullet = line.match(/^[-*+]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);

    if (!line) {
      flush();
    } else if (heading) {
      flush();
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2] });
    } else if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (paragraph.length || (list && list.ordered !== ordered)) flush();
      list ??= { kind: "list", ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else {
      if (list) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*|_(.+?)_|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = match.index;
    if (match[1] ?? match[2]) {
      nodes.push(<strong key={key}>{match[1] ?? match[2]}</strong>);
    } else if (match[3] ?? match[4]) {
      nodes.push(<em key={key}>{match[3] ?? match[4]}</em>);
    } else {
      const href = match[6];
      const safe = /^(https?:|mailto:|\/)/i.test(href);
      nodes.push(
        safe ? (
          <a key={key} href={href} className="font-medium text-brand-600 underline underline-offset-4">
            {match[5]}
          </a>
        ) : (
          match[5]
        ),
      );
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const headingClass: Record<number, string> = {
  1: "mt-10 text-3xl font-extrabold tracking-tight",
  2: "mt-10 text-2xl font-bold text-brand-800",
  3: "mt-8 text-xl font-semibold text-brand-800",
};

export function Markdown({ source, skipFirstHeading = false }: { source: string; skipFirstHeading?: boolean }) {
  let blocks = parseBlocks(source);
  if (skipFirstHeading && blocks[0]?.kind === "heading") blocks = blocks.slice(1);

  return (
    <div className="[&>*:first-child]:mt-0">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          const Tag = `h${Math.min(block.level + 1, 6)}` as "h2" | "h3" | "h4" | "h5" | "h6";
          return (
            <Tag key={index} className={headingClass[block.level] ?? "mt-6 text-lg font-semibold"}>
              {renderInline(block.text)}
            </Tag>
          );
        }
        if (block.kind === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List
              key={index}
              className={`mt-3 space-y-1.5 pl-6 leading-relaxed text-slate-700 ${block.ordered ? "list-decimal" : "list-disc"}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </List>
          );
        }
        return (
          <p key={index} className="mt-3 leading-relaxed text-slate-700">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
