type SectionPlaceholderProps = {
  title: string;
  description: string;
};

export function SectionPlaceholder({ title, description }: SectionPlaceholderProps) {
  return (
    <section className="placeholder">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
