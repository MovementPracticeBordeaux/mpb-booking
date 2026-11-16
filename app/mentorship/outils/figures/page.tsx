import { redirect } from 'next/navigation';

// L'outil Figures (chrono de tenue + minuteur de récupération) faisait doublon
// avec le chrono intégré sous chaque exercice : la page renvoie au Mentorat.
export default function OutilFiguresPage() {
  redirect('/mentorship');
}
