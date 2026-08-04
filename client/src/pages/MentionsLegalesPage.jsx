import { Link } from 'react-router-dom';
import { Container, Card } from '../components/ui';
import { MENTIONS_LEGALES } from '../lib/legal/mentionsLegales';

export default function MentionsLegalesPage() {
  return (
    <Container className="py-10">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{MENTIONS_LEGALES.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Dernière mise à jour : {MENTIONS_LEGALES.updatedAt}
        </p>

        <div className="mt-8 flex flex-col gap-6">
          {MENTIONS_LEGALES.sections.map((section) => (
            <Card key={section.heading} className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-3 text-slate-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link to="/" className="font-medium text-brand-700 hover:underline">
            Retour à l'accueil
          </Link>
        </p>
      </article>
    </Container>
  );
}
