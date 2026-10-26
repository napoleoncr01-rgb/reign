# REIGN — Phase 1

## Déployer (GitHub Pages, gratuit, HTTPS)
1. Sur ordinateur : github.com → New repository → nom `reign` (public) → Create.
2. « uploading an existing file » → glisse TOUT le contenu du dossier (y compris `icons/`) → Commit changes.
3. Settings → Pages → Source : « Deploy from a branch », branche `main`, dossier `/ (root)` → Save.
4. Après ~1 min : https://TON-PSEUDO.github.io/reign/
(Alternative : app.netlify.com/drop, glisse le dossier.)

## Installer sur iPhone
Safari (pas Chrome) → ouvre l'URL → Partager → « Sur l'écran d'accueil » → Ajouter. Lance REIGN depuis l'icône.

## Tester
- Mode avion, relance l'appli : elle marche (hors ligne).
- Coche « min » sur une habitude : validé (70 %). Coche le rond : complet (100 %).
- Lance la routine du matin : le réveil est enregistré.
- Moi → Exporter, puis Importer : les données reviennent.
- Mettre à jour : modifie `C='reign-v1'` dans sw.js (v2…), renvoie les fichiers.

## Limites connues
Pas de notifications (Phase 3). iOS peut purger le stockage : exporte chaque dimanche. Focus et Objectifs arrivent en Phase 2.
