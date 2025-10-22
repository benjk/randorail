const admin = require("firebase-admin");
const fs = require("fs");

const deployId = process.env.DEPLOY_ID;
const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const status = (process.env.DEPLOY_STATUS || "error").toLowerCase();

if (!deployId || !keyFilePath) {
  console.error("❌ DEPLOY_ID ou clé manquante");
  process.exit(1);
}

const key = JSON.parse(fs.readFileSync(keyFilePath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(key),
});

const db = admin.firestore();

(async () => {
  try {
    await db.collection("deployments").doc("current").set(
      {
        status: status,
        endedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );
    console.log("✅ Firestore: statut mis à jour");
    process.exit(0);
  } catch (e) {
    console.error("❌ Firestore update failed:", e.message);
    // Nouvelle tentative pour marquer le déploiement comme échoué
    try {
      const update = {
        status,
        endedAt: admin.firestore.Timestamp.now(),
      };

      if (status === "error") {
        update.error = "Déploiement échoué (déclaré explicitement)";
      }

      await db
        .collection("deployments")
        .doc("current")
        .set(update, { merge: true });
      console.log("✅ Firestore: statut mis à jour");
      process.exit(0);
    } catch (e) {
      console.error(
        "❌ Impossible de notifier l'erreur à Firestore:",
        inner.message
      );
    }

    process.exit(1);
  }
})();
