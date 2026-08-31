'use client';

import { useState } from 'react';
import { COULEURS, GRADIENT, POLICE_DISPLAY } from '@/lib/theme';
import { trouverMeilleureReponse } from '@/lib/chat-faq';

type Message = { auteur: 'moi' | 'bot'; texte: string; proposerEmail?: boolean; proposerWhatsApp?: boolean };

function messageAccueil(aUneFormuleActive: boolean): Message {
  return {
    auteur: 'bot',
    texte: aUneFormuleActive
      ? "Salut, je suis l'assistant de Movement Practice Bordeaux 👋 Pose-moi une question (lieu, horaires, tarifs, réservation...), ou contacte directement Sylvain sur WhatsApp si besoin."
      : "Salut, je suis l'assistant de Movement Practice Bordeaux 👋 Pose-moi une question (lieu, horaires, tarifs, réservation...) ou écris directement à Sylvain.",
    proposerWhatsApp: aUneFormuleActive,
  };
}

function trouverReponse(question: string, aUneFormuleActive: boolean): Message {
  const resultat = trouverMeilleureReponse(question);
  if (resultat.trouve) {
    return { auteur: 'bot', texte: resultat.reponse };
  }
  // Pour un élève déjà abonné, WhatsApp est plus direct que l'email — il
  // a déjà ce canal pour ses factures/défis, autant rester cohérent.
  return aUneFormuleActive
    ? { auteur: 'bot', texte: "Je n'ai pas de réponse toute prête pour ça. Le plus rapide, c'est de contacter Sylvain sur WhatsApp :", proposerWhatsApp: true }
    : { auteur: 'bot', texte: "Je n'ai pas de réponse toute prête pour ça. Le mieux est d'écrire directement à Sylvain :", proposerEmail: true };
}

export default function ChatWidget({ aUneFormuleActive }: { aUneFormuleActive: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<Message[]>([messageAccueil(aUneFormuleActive)]);
  const [saisie, setSaisie] = useState('');

  const envoyer = () => {
    const texte = saisie.trim();
    if (!texte) return;
    const reponse = trouverReponse(texte, aUneFormuleActive);
    setMessages((m) => [...m, { auteur: 'moi', texte }, reponse]);
    setSaisie('');
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 50 }}>
      {ouvert && (
        <div
          style={{
            width: 320,
            maxWidth: 'calc(100vw - 40px)',
            height: 420,
            maxHeight: 'calc(100vh - 120px)',
            background: COULEURS.fond,
            border: `1px solid ${COULEURS.bordure}`,
            borderRadius: 16,
            marginBottom: 12,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COULEURS.bordure}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: POLICE_DISPLAY, letterSpacing: 0.5, margin: 0, fontSize: 16 }}>Une question ?</p>
            <button
              onClick={() => setOuvert(false)}
              aria-label="Fermer le chat"
              style={{ background: 'none', border: 'none', color: COULEURS.texteFaible, fontSize: 18, cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.auteur === 'moi' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div
                  style={{
                    background: m.auteur === 'moi' ? GRADIENT : COULEURS.surface,
                    color: m.auteur === 'moi' ? 'white' : COULEURS.texte,
                    borderRadius: 12,
                    padding: '8px 12px',
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {m.texte}
                </div>
                {m.proposerEmail && (
                  <a
                    href="mailto:contact@movementpracticebordeaux.com?subject=Question%20depuis%20le%20site"
                    style={{ display: 'inline-block', marginTop: 6, fontSize: 13, color: '#FF2D78', textDecoration: 'none', fontWeight: 600 }}
                  >
                    ✉️ Écrire à Sylvain
                  </a>
                )}
                {m.proposerWhatsApp && (
                  <a
                    href="https://wa.me/33620477064"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-block', marginTop: 6, fontSize: 13, color: '#FF2D78', textDecoration: 'none', fontWeight: 600 }}
                  >
                    💬 Contacter Sylvain sur WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${COULEURS.bordure}` }}>
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && envoyer()}
              placeholder="Ta question..."
              style={{
                flex: 1,
                background: COULEURS.surface,
                border: `1px solid ${COULEURS.bordure}`,
                borderRadius: 8,
                padding: '8px 10px',
                color: COULEURS.texte,
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              onClick={envoyer}
              aria-label="Envoyer"
              style={{ background: GRADIENT, border: 'none', borderRadius: 8, padding: '8px 14px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              →
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOuvert((o) => !o)}
        aria-label={ouvert ? 'Fermer le chat' : 'Ouvrir le chat'}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: GRADIENT,
          color: 'white',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        }}
      >
        {ouvert ? '✕' : '💬'}
      </button>
    </div>
  );
}
