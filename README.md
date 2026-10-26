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

## Notifications push (Cloudflare, gratuit, ~10 min, depuis un navigateur)
Principe : un mini serveur envoie un « réveil » à ton iPhone aux heures choisies. Il ne stocke que l'abonnement de ton téléphone et les heures/textes des rappels, jamais tes habitudes.
1. dash.cloudflare.com (compte gratuit) → Workers & Pages → Create → « Hello World » → nom `reign-push` → Deploy → Edit code → remplace tout par `cloudflare/worker.js` → Deploy.
2. Ouvre `https://reign-push.TON-SOUS-DOMAINE.workers.dev/keys` : copie les 3 valeurs affichées (VAPID_PUBLIC, VAPID_PRIVATE, TOKEN).
3. Worker → Settings → Variables and Secrets : ajoute `VAPID_PUBLIC` (texte), `VAPID_PRIVATE` (secret), `TOKEN` (secret), `SUBJECT` = mailto:ton@email.
4. Storage & databases → KV → Create namespace `reign`. Worker → Settings → Bindings → Add → KV namespace, nom de variable `KV`.
5. Worker → Settings → Triggers → Cron Triggers → Add → `* * * * *`.
6. Dans REIGN (installée sur l'écran d'accueil) → Moi → Notifications : colle l'URL du Worker, le TOKEN et VAPID_PUBLIC → Activer → autorise → Tester.
Limites : iOS 16.4+ et appli installée obligatoires. Un mode Concentration actif ou une batterie très faible peut retarder une notification. Après mise à jour des fichiers, rouvre l'appli une fois.
