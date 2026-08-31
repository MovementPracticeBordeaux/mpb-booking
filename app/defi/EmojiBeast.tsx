// Petit emoji scintillant, réutilisé partout où le mode Beast est mentionné
// (admin/defis, page défi élève). Même animation que le prénom scintillant
// dans le classement (glow-defi-mythique), les keyframes doivent être
// présentes dans le <style> de la page qui l'utilise — déjà le cas sur
// app/defi/page.tsx, ajoutées aussi sur app/admin/defis/page.tsx.
export default function EmojiBeast() {
  return (
    <span style={{ display: 'inline-block', animation: 'glow-defi-mythique 2s ease-in-out infinite' }}>
      😈
    </span>
  );
}
