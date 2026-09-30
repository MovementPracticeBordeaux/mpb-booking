import { redirect } from 'next/navigation';

// L'ancienne "Vue d'ensemble" doublonnait le menu et les statistiques : ses
// chiffres clés sont désormais en haut du planning, page d'arrivée de l'admin.
export default function AdminPage() {
  redirect('/admin/planning');
}
