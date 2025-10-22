# Ya plus qu'à 🚀

Projet généré avec le CLI ultime.

----------------------------------------------------------------------------------------------------
## 🚀 Déploiement

1. Modifier les infos dans le fichier `constants.js`
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `GITHUB_TOKEN`


2. Création du projet Firebase + **Ajout d'une app Web**:
   - Récupérer :
      - `projectId`
      - `apiKey`
      - `authDomain`
   - Alimenter les `constants` :
      - `PUBLIC_FIREBASE_PROJECT_ID`
      - `PUBLIC_FIREBASE_KEY`
      - `PUBLIC_FIREBASE_URL`


3. Lancer :
`node .\bkadmin\first-deploy.js`
   - Créé le repo
   - Ajoute les secrets
   - Fais le premier commit / push
   - Déploie sur le serveur gràace au `deploy.yml`

4. ⚠️⚠️ Il faut impérativement avoir activé le plan Blaze avant d'injecter des functions ⚠️⚠️
   - Paramètres → Utilisation et facturation → **Changer de forfait**
   - Puis lancer :
`node .\bkadmin\functions\deploy-function.js`
   - La fonction :
      - Init le dossier firebase et organise les fichiers nécessaires
      - Injecte les secrets dans la function à déployer `index.js`
      - Installe les dépendences nécessaires au projet Firebase
      - Déploie la cloud function

   - Attendre le déploiement : **Deploy complete!**
   - Récupérer l'URL et alimenter `constants.js`
   - Voir les logs au besoin sur `functions:log --only publishContent` après `cd .firebase`

5. **Crééer et Activer le mode d'authentification par e-mail**
   - Firebase Console → Auth → Méthodes de connexion → Email/Password → **Activer**
   - Modifier si besoin les identifiants et mails de `constants.js`
   - ⚠️⚠️ Il faudra aussi télécharger une nouvelle key et remplacer le contenu de `serviceAccountKey.json`
      - Paramètres → Paramètres du projet → Comptes de service → **Générer une nouvelle clé privée**
   - Puis lancer :
`node .\bkadmin\setup-admin.js`
   Ce script :
   - Créé les users selon les paramètres définis dans `constants.js`
   - Injecte le script `update-content.yml` et les scripts git
   - Créé la branche d'update et y met les fichiers :
      - `content.json` et `schema.json`
      - Le dossier `/img/`

6. **Activer Cloud Firestore API pour pouvoir stocker les quotas de publications par user** : ` https://console.developers.google.com/apis/api/firestore.googleapis.com`
   -  **Initialiser le Firestore Database** Attention : laisser le nom de base (default) sinon ça plante TOCARD
   -  **Réécrire les rules pour accepter la lecture/écriture**
   -  Remplacer `allow read, write: if false;` par `allow read, write: if request.auth != null;`

7. 🍾 Terminé bonsoir

----------------------------------------------------------------------------------------------------
## ###################################### 🛠️ Mode ADMIN ############################################
----------------------------------------------------------------------------------------------------

----------------------------------------------------------------------------------------------------
   ## 🛠️ Firebase Functions 🛠️
----------------------------------------------------------------------------------------------------

1. **Installer firebase-tools** et **Login sur firebase** à faire 1 fois par machine
   - `npm install -g firebase-tools`
   - `firebase login`

2. **Edition de la fonction `functions/index.js`**

3. **Lancement du script de déploiement de function**
   - `node ./functions/deploy-functions.js`
   - Si on veut mettre à jour la fonction:
      - `cd .firebase/`
      - `firebase deploy --only functions`

4. **Voir les logs**
   - `📂 cd .firebase`
   - `functions:log --only publishContent`

5. **Récupérer l'url et alimenter le .env `PUBLIC_PUBLISH_FUNCTION_URL`** + le fichier `constants.js`

----------------------------------------------------------------------------------------------------
   ## 🛠️ Firebase Détails 🛠️
----------------------------------------------------------------------------------------------------

1. **Activer le mode d'authentification par e-mail**
   - Firebase Console → Auth → Méthodes de connexion → Email/Password → **Activer**

2. **Désactiver les inscriptions par les utilisateurs**
   - Auth → ⚙️ Paramètres → **Actions des utilisateurs**
   - Section : Création et suppression de comptes
   - ➖ **Décoche : Autoriser les utilisateurs à créer un compte**
   - 🔒 ➖ Décoche aussi "Permettre la suppression de comptes"

3. **Modifier le modèle d'e-mail**
   - Auth → Modèles d’e-mail → **Réinitialisation du mot de passe**
   - → Personnalisation + **URL de redirection** personnalisée (`https://monsite.com/admin?setmp=true`)

4. **Ajouter le nom de domaine dans les domaines autorisés** Sinon pas de reset de MDP
   - Authentification → Paramètres → **Domaines autorisés**

----------------------------------------------------------------------------------------------------
## 🧠 A surveiller

    - 🔐 Changer régulièrement le FTP_PASSWORD (pas de SFTP sur Hostinger 🤢)

    - 🧽 NE PAS laisser traîner :
        - Les GitHub tokens
        - Les FTP passwords
        - Les MDP users

    - ✅ Vérifie que le dist/ contient seulement ce que tu veux publier

---
© Benjam CLI ✨
