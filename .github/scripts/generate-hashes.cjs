const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const imgDir = "public/img";
const hashFilePath = path.join(imgDir, "hashes.json");

// Fonction de hash SHA-1 sur le contenu
const computeHash = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 8);
};

// Si aucun argument → traiter toutes les images du dossier
const modified =
  process.argv.length > 2
    ? process.argv.slice(2)
    : fs
        .readdirSync(imgDir)
        .filter((f) => /\.(jpe?g|png|gif|webp|svg)$/i.test(f)); // filtre optionnel

const hashes = fs.existsSync(hashFilePath)
  ? JSON.parse(fs.readFileSync(hashFilePath, "utf8"))
  : {};

let changed = false;

for (const filename of modified) {
  if (filename === "hashes.json") continue;
  const filePath = path.join(imgDir, filename);
  if (!fs.existsSync(filePath)) continue;

  const newHash = computeHash(filePath);
  const cleanName = path.basename(filename);
  if (hashes[cleanName] !== newHash) {
    hashes[cleanName] = newHash;
    changed = true;
  }
}

if (changed || !fs.existsSync(hashFilePath)) {
  fs.writeFileSync(hashFilePath, JSON.stringify(hashes, null, 2), "utf8");
  console.log("✅ hashes.json mis à jour");
} else {
  console.log("✅ Aucun changement détecté dans les images");
}
