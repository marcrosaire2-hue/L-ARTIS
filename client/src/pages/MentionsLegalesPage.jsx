import { Link } from 'react-router-dom';
import { Card, Container } from '../components/ui';
import { LegalDocument } from '../components/LegalDocument';
import { mentionsLegales } from '../lib/legal/mentionsLegales';

export default function MentionsLegalesPage() {
  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-800">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          Mentions légales
        </p>

        <Card className="p-6 sm:p-10">
          <LegalDocument document={mentionsLegales} />

          <nav className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm">
            <p className="font-medium text-slate-900">Documents associés</p>
            <Link to="/reglement/client" className="text-brand-700 hover:underline">
              Règlement clients
            </Link>
            <Link to="/reglement/artisan" className="text-brand-700 hover:underline">
              Règlement artisans
            </Link>
          </nav>
        </Card>
      </div>
    </Container>
  );
}
