# Héberger Élan sur Cloudflare (rappels fiables + synchronisation)

L'appli fonctionne partout (GitHub Pages inclus). Hébergée avec ce petit serveur Cloudflare, elle gagne :
- des **rappels par notification même appli fermée** ;
- la **synchronisation chiffrée** entre téléphone et ordinateur.

Tout reste gratuit (plan gratuit Cloudflare). Les fichiers du serveur sont déjà là : `worker.js` et `wrangler.jsonc`.

## 1. Créer le projet
1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Import a repository**.
2. Choisir le dépôt **Habitudes**, nom du projet : `elan`. Laisser la commande de déploiement par défaut. **Deploy**.

## 2. Créer le stockage (KV)
1. **Storage & Databases** → **KV** → **Create a namespace** → nom : `ELAN`.
2. Copier son **ID** et le donner à Claude (ou ajouter dans `wrangler.jsonc`) :
   `"kv_namespaces": [{ "binding": "ELAN", "id": "<ID>" }]`

## 3. Ajouter la clé secrète des notifications
1. Projet `elan` → **Settings** → **Variables and Secrets** → **Add** → type **Secret**.
2. Nom : `VAPID_JWK`. Valeur : tout le contenu du fichier `CLE-SECRETE-ELAN_VAPID_JWK.txt`
   (dans `Site internet`, hors des dépôts : ne jamais le publier ni le committer).

## 4. Vérifier
Ouvrir `https://elan.<ton-sous-domaine>.workers.dev/api/push/key` : une ligne `{"key":"…"}` doit s'afficher.
Dans l'appli : **Paramètres → Notifications** montre « Rappels fiables (serveur) » et **Paramètres → Données** propose la synchronisation.

## Limites du plan gratuit
- KV : 1 000 écritures par jour (l'appli n'écrit que si quelque chose change), 100 000 lectures.
- Déclencheur : ~50 envois de notifications par minute.
