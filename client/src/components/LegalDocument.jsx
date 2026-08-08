/** Affiche un document légal structuré (titre, intro, sections). */
export function LegalDocument({ document }) {
  return (
    <article className="prose-legal">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {document.title}
        </h1>
        {document.subtitle && (
          <p className="mt-2 text-sm font-medium text-brand-700">{document.subtitle}</p>
        )}
        {document.intro && (
          <p className="mt-4 text-base leading-relaxed text-slate-600">{document.intro}</p>
        )}
      </header>

      <div className="flex flex-col gap-8">
        {document.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <div className="mt-3 flex flex-col gap-3">
              {section.paragraphs.map((paragraph, index) => (
                <p key={`${section.title}-${index}`} className="text-sm leading-relaxed text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
