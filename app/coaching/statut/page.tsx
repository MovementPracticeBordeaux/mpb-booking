import { redirect } from 'next/navigation';

// Cette page a été fusionnée dans /profil, qui centralise le statut de
// toutes les formules (cours collectifs comme coaching). On redirige pour
// ne pas casser d'éventuels liens déjà partagés.
export default function CoachingStatutRedirect() {
  redirect('/profil');
}
