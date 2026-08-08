// lib/mentorship-tools.ts
//
// Catalogue des outils vidéo (routines quotidiennes / "armure organique")
// du programme Mentorship. Repris tel quel du Wix. Chaque outil appartient
// à un groupe corporel, et un module du programme (lib/mentorship-modules.ts)
// recommande un ou plusieurs groupes selon la compétence travaillée.
//
// Pour ajouter un outil : donne-moi le nom, le groupe, et le lien YouTube.

export type ToolGroup = 'CV' | 'BC' | 'HC' | 'EP' | 'SC' | 'AB' | 'MI';

export const TOOL_GROUP_LABELS: Record<ToolGroup, string> = {
  CV: 'Colonne vertébrale',
  BC: 'Bas du corps',
  HC: 'Haut du corps',
  EP: 'Épaules',
  SC: 'Scapula',
  AB: 'Avant-bras',
  MI: 'Membres inférieurs',
};

export type MentorshipTool = {
  code: string; // ex: 'CV1', 'BC6'
  groupe: ToolGroup;
  nom: string;
  videoYoutubeId: string;
};

// L'ID YouTube est extrait du lien youtu.be/<id>
const idDepuisLien = (lien: string) => lien.replace('https://youtu.be/', '');

export const MENTORSHIP_TOOLS: MentorshipTool[] = [
  // COLONNE VERTÉBRALE - CV
  { code: 'CV1', groupe: 'CV', nom: 'Colonne 1', videoYoutubeId: idDepuisLien('https://youtu.be/MYl0f4i7Bm0') },
  { code: 'CV2', groupe: 'CV', nom: 'Colonne 2', videoYoutubeId: idDepuisLien('https://youtu.be/fS08l4SM85Q') },
  { code: 'CV3', groupe: 'CV', nom: 'Spinal wave', videoYoutubeId: idDepuisLien('https://youtu.be/hroXD_ie-0M') },

  // BAS DU CORPS - BC
  { code: 'BC1', groupe: 'BC', nom: 'Routine assise - Fragments', videoYoutubeId: idDepuisLien('https://youtu.be/6ETL4STnuJM') },
  { code: 'BC2', groupe: 'BC', nom: 'Routine assise - assemblage', videoYoutubeId: idDepuisLien('https://youtu.be/x2hWwXRc8tA') },
  { code: 'BC3', groupe: 'BC', nom: 'Sit game', videoYoutubeId: idDepuisLien('https://youtu.be/5eFKp3f8OXY') },
  { code: 'BC4', groupe: 'BC', nom: 'Routine stretch actif - Fragments', videoYoutubeId: idDepuisLien('https://youtu.be/rRXI-rQXMBc') },
  { code: 'BC5', groupe: 'BC', nom: 'Routine stretch actif - assemblage', videoYoutubeId: idDepuisLien('https://youtu.be/0XyyLXF1tAo') },
  { code: 'BC6', groupe: 'BC', nom: 'Routine squat', videoYoutubeId: idDepuisLien('https://youtu.be/MQcmU9BQAGY') },
  { code: 'BC7', groupe: 'BC', nom: 'Rota hanches debout', videoYoutubeId: idDepuisLien('https://youtu.be/ZytzE0y3sEo') },
  { code: 'BC8', groupe: 'BC', nom: 'Squat passif', videoYoutubeId: idDepuisLien('https://youtu.be/9PJymG3sedc') },
  { code: 'BC9', groupe: 'BC', nom: 'Routine stretch passif 1', videoYoutubeId: idDepuisLien('https://youtu.be/NpBgqC_1j-4') },
  { code: 'BC10', groupe: 'BC', nom: 'Routine stretch passif 2', videoYoutubeId: idDepuisLien('https://youtu.be/cpM_i7uGklA') },

  // HAUT DU CORPS - HC
  { code: 'HC1', groupe: 'HC', nom: 'Routine haut du corps', videoYoutubeId: idDepuisLien('https://youtu.be/V6JDf7t7vPQ') },
  { code: 'HC2', groupe: 'HC', nom: 'Routine haut du corps 2', videoYoutubeId: idDepuisLien('https://youtu.be/zO24IbMjuP8') },
  { code: 'HC3', groupe: 'HC', nom: 'Suspension 2 bras', videoYoutubeId: idDepuisLien('https://youtu.be/1lpOQnht9jl') },
  { code: 'HC4', groupe: 'HC', nom: 'Suspension 1 bras', videoYoutubeId: idDepuisLien('https://youtu.be/Av2UT-xcGtc') },
  { code: 'HC5', groupe: 'HC', nom: 'Balanciers', videoYoutubeId: idDepuisLien('https://youtu.be/vHKC_KQsRWE') },
  { code: 'HC6', groupe: 'HC', nom: 'Décompression articulaire', videoYoutubeId: idDepuisLien('https://youtu.be/hnfkxthm5d8') },

  // ÉPAULES - EP
  { code: 'EP1', groupe: 'EP', nom: 'Rotation basse élastique', videoYoutubeId: idDepuisLien('https://youtu.be/AEv-lluXYYQ') },
  { code: 'EP2', groupe: 'EP', nom: 'Rotation medium élastique', videoYoutubeId: idDepuisLien('https://youtu.be/Gs-ERcjCe64') },
  { code: 'EP3', groupe: 'EP', nom: 'Rotation haute élastique', videoYoutubeId: idDepuisLien('https://youtu.be/Ql48iLg56DM') },
  { code: 'EP4', groupe: 'EP', nom: 'Élévation latérale élastique', videoYoutubeId: idDepuisLien('https://youtu.be/Wtbuwh-9auM') },
  { code: 'EP5', groupe: 'EP', nom: 'Rotation externe élastique', videoYoutubeId: idDepuisLien('https://youtu.be/oABqjpDjEN4') },
  { code: 'EP6', groupe: 'EP', nom: 'Shield élastique', videoYoutubeId: idDepuisLien('https://youtu.be/7EJqKlRAlgo') },
  { code: 'EP7', groupe: 'EP', nom: 'Rotation externe assis', videoYoutubeId: idDepuisLien('https://youtu.be/Gl6D7Ck3O0Q') },
  { code: 'EP8', groupe: 'EP', nom: 'Rotation externe couché', videoYoutubeId: idDepuisLien('https://youtu.be/Yc_Z1A0lyj0') },
  { code: 'EP9', groupe: 'EP', nom: 'Rotation cubaine', videoYoutubeId: idDepuisLien('https://youtu.be/FjnxcbgCy_8') },
  { code: 'EP10', groupe: 'EP', nom: 'Développé militaire unilatéral', videoYoutubeId: idDepuisLien('https://youtu.be/j9PZNoDGWXg') },
  { code: 'EP11', groupe: 'EP', nom: 'Élévation unilatérale couché', videoYoutubeId: idDepuisLien('https://youtu.be/U-R8rIaQs84') },
  { code: 'EP12', groupe: 'EP', nom: 'Rotation au mur', videoYoutubeId: idDepuisLien('https://youtu.be/qJB_reMTSJY') },
  { code: 'EP13', groupe: 'EP', nom: 'Planche lean', videoYoutubeId: idDepuisLien('https://youtu.be/EsaVeZXqt7U') },
  { code: 'EP14', groupe: 'EP', nom: 'Trap raise 45°', videoYoutubeId: idDepuisLien('https://youtu.be/FjzjHU2BrvA') },
  { code: 'EP15', groupe: 'EP', nom: 'Trap raise 90°', videoYoutubeId: idDepuisLien('https://youtu.be/BeTsJhg6JXI') },
  { code: 'EP16', groupe: 'EP', nom: 'Pec stretch couché', videoYoutubeId: idDepuisLien('https://youtu.be/KdJ5z7G9nY8') },
  { code: 'EP17', groupe: 'EP', nom: 'Lat stretch 1', videoYoutubeId: idDepuisLien('https://youtu.be/9yWo52Z0oGc') },
  { code: 'EP18', groupe: 'EP', nom: 'Lat stretch 2', videoYoutubeId: idDepuisLien('https://youtu.be/nRi6f8En6Y4') },

  // SCAPULA - SC
  { code: 'SC1', groupe: 'SC', nom: 'Protraction élastique', videoYoutubeId: idDepuisLien('https://youtu.be/JEVnX_u5gSw') },
  { code: 'SC2', groupe: 'SC', nom: 'Rétraction élastique', videoYoutubeId: idDepuisLien('https://youtu.be/xSZHSDN3aaM') },
  { code: 'SC3', groupe: 'SC', nom: 'Tirage horizontal élastique', videoYoutubeId: idDepuisLien('https://youtu.be/O0VJspzuX00') },
  { code: 'SC4', groupe: 'SC', nom: 'Sonnette interne élastique', videoYoutubeId: idDepuisLien('https://youtu.be/7h5-rarPp1U') },
  { code: 'SC5', groupe: 'SC', nom: 'Shrug élastique', videoYoutubeId: idDepuisLien('https://youtu.be/miZxQEpkVPc') },
  { code: 'SC6', groupe: 'SC', nom: 'Protraction 1 - Genoux', videoYoutubeId: idDepuisLien('https://youtu.be/oGSCx6rfxP0') },
  { code: 'SC7', groupe: 'SC', nom: 'Protraction 2 - Basique', videoYoutubeId: idDepuisLien('https://youtu.be/Rym0nsHqM2g') },
  { code: 'SC8', groupe: 'SC', nom: 'Protraction 3 - Support', videoYoutubeId: idDepuisLien('https://youtu.be/GlfSSKJpU-k') },
  { code: 'SC9', groupe: 'SC', nom: 'Protraction 4 - Planche ring', videoYoutubeId: idDepuisLien('https://youtu.be/ouHm-Pb-Wec') },
  { code: 'SC10', groupe: 'SC', nom: 'Protraction 5 - Pike', videoYoutubeId: idDepuisLien('https://youtu.be/-QaWV7FDOOI') },
  { code: 'SC11', groupe: 'SC', nom: 'Protraction 6 - Pike support', videoYoutubeId: idDepuisLien('https://youtu.be/p30FKzdALk4') },
  { code: 'SC12', groupe: 'SC', nom: 'Protraction 7 - HS wall', videoYoutubeId: idDepuisLien('https://youtu.be/3QYemTJ91xM') },
  { code: 'SC13', groupe: 'SC', nom: 'Protraction 8 - Dips', videoYoutubeId: idDepuisLien('https://youtu.be/6Ols9v6UA0I') },

  // AVANT-BRAS - AB
  { code: 'AB1', groupe: 'AB', nom: 'Flex/extension élastique', videoYoutubeId: idDepuisLien('https://youtu.be/3dtBRV7MdbY') },
  { code: 'AB2', groupe: 'AB', nom: 'Rotation de coudes', videoYoutubeId: idDepuisLien('https://youtu.be/ByBiD_yxml8') },
  { code: 'AB3', groupe: 'AB', nom: 'Rotation active haltère', videoYoutubeId: idDepuisLien('https://youtu.be/2ZgiNerIqKA') },

  // MEMBRES INFÉRIEURS - MI
  { code: 'MI1', groupe: 'MI', nom: 'Standing 1 pied', videoYoutubeId: idDepuisLien('https://youtu.be/R3a5E8qpvDI') },
  { code: 'MI2', groupe: 'MI', nom: 'Tai chi walk', videoYoutubeId: idDepuisLien('https://youtu.be/CS-OxAwnPAk') },
  { code: 'MI3', groupe: 'MI', nom: 'Stretch passif 1', videoYoutubeId: idDepuisLien('https://youtu.be/cpM_i7uGklA') },
  { code: 'MI4', groupe: 'MI', nom: 'Stretch passif 2', videoYoutubeId: idDepuisLien('https://youtu.be/NpBgqC_1j-4') },
  { code: 'MI5', groupe: 'MI', nom: 'Stretch mollets', videoYoutubeId: idDepuisLien('https://youtu.be/xM9sP2J1d6E') },
  { code: 'MI6', groupe: 'MI', nom: 'Good morning unilatéral 1', videoYoutubeId: idDepuisLien('https://youtu.be/Vf_zMK1oov8') },
  { code: 'MI7', groupe: 'MI', nom: 'Good morning unilatéral 2', videoYoutubeId: idDepuisLien('https://youtu.be/ZuaZuRmmoAI') },
  { code: 'MI8', groupe: 'MI', nom: 'Flexion cheville active', videoYoutubeId: idDepuisLien('https://youtu.be/Q6CHGnGFJRM') },
  { code: 'MI9', groupe: 'MI', nom: 'Fente chargée haltère', videoYoutubeId: idDepuisLien('https://youtu.be/H6-5BMlWHkg') },
  { code: 'MI10', groupe: 'MI', nom: 'Fente chargée surélevée', videoYoutubeId: idDepuisLien('https://youtu.be/VxHa-QBOIwU') },
  { code: 'MI11', groupe: 'MI', nom: 'Diagonal stretch', videoYoutubeId: idDepuisLien('https://youtu.be/2yqAw7LeRlk') },
  { code: 'MI12', groupe: 'MI', nom: 'Jefferson curl', videoYoutubeId: idDepuisLien('https://youtu.be/DpqNwfWy0dA') },
  { code: 'MI13', groupe: 'MI', nom: 'Fermeture balistique 1', videoYoutubeId: idDepuisLien('https://youtu.be/_Jv8ilPl5y8') },
  { code: 'MI14', groupe: 'MI', nom: 'Fermeture balistique 2', videoYoutubeId: idDepuisLien('https://youtu.be/biqh4MW3x_8') },
  { code: 'MI15', groupe: 'MI', nom: 'Papillon', videoYoutubeId: idDepuisLien('https://youtu.be/baLUesFruG0') },
  { code: 'MI16', groupe: 'MI', nom: 'Extension de hanche 90/90°', videoYoutubeId: idDepuisLien('https://youtu.be/_AETBM3WPZo') },
  { code: 'MI17', groupe: 'MI', nom: 'Side split Get up', videoYoutubeId: idDepuisLien('https://youtu.be/ncKMvHELMiA') },
  { code: 'MI18', groupe: 'MI', nom: 'Jefferson curl straddle', videoYoutubeId: idDepuisLien('https://youtu.be/exMdSnDCUyU') },
  { code: 'MI19', groupe: 'MI', nom: 'Pancake avec charge', videoYoutubeId: idDepuisLien('https://youtu.be/-0JIuM_S6zg') },
  { code: 'MI20', groupe: 'MI', nom: 'Horse squat', videoYoutubeId: idDepuisLien('https://youtu.be/sxyP-W2ql2g') },
  { code: 'MI21', groupe: 'MI', nom: 'Front to side splits', videoYoutubeId: idDepuisLien('https://youtu.be/wjFaZOS4SkI') },
  { code: 'MI22', groupe: 'MI', nom: 'Élévation de bassin unilatérale', videoYoutubeId: idDepuisLien('https://youtu.be/yBSKxCsVd68') },
  { code: 'MI23', groupe: 'MI', nom: 'Élévation de bassin sur patin', videoYoutubeId: idDepuisLien('https://youtu.be/-J77rynR1xs') },
  { code: 'MI24', groupe: 'MI', nom: 'Fente ischio actif', videoYoutubeId: idDepuisLien('https://youtu.be/5wWNvHWFmiY') },
  { code: 'MI25', groupe: 'MI', nom: 'Sisi squat progression', videoYoutubeId: idDepuisLien('https://youtu.be/nW1k0BdzyqA') },
  { code: 'MI26', groupe: 'MI', nom: 'Résilience squat', videoYoutubeId: idDepuisLien('https://youtu.be/VHMf8z7ifMU') },
];

export function outilsDuGroupe(groupe: ToolGroup): MentorshipTool[] {
  return MENTORSHIP_TOOLS.filter((o) => o.groupe === groupe);
}
