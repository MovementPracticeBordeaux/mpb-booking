import QuizClient from './QuizClient';

export const metadata = {
  title: 'Quel cours te correspond ? — Movement Practice Bordeaux',
  description:
    "Réponds à quelques questions rapides pour découvrir quelle discipline (Handstand, Calisthenics, Locomotion, Altinha, Mobilité) te correspond le mieux, ou si le Mentorat / Coaching individuel est plus adapté à ta situation.",
  openGraph: {
    title: 'Quel cours te correspond ? — Movement Practice Bordeaux',
    description: 'Découvre en quelques questions la discipline qui te correspond le mieux.',
    url: '/quiz',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Movement Practice Bordeaux' }],
  },
};

export default function QuizPage() {
  return <QuizClient />;
}
