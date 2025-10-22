const fs = require("fs");
const path = require("path");

const defaultPath = path.resolve("src/data/content.json");
const updatedPath = path.resolve("temp-content/content/content.json");

if (!fs.existsSync(defaultPath)) {
  console.error("❌ Schéma par défaut introuvable :", defaultPath);
  process.exit(1);
}

if (!fs.existsSync(updatedPath)) {
  console.warn("⚠️ Aucun content update trouvé, on garde le schéma par défaut");
  process.exit(0);
}

const defaultContent = JSON.parse(fs.readFileSync(defaultPath, "utf8"));
const updatedContent = JSON.parse(fs.readFileSync(updatedPath, "utf8"));

function mergeStrict(schema, source) {
  if (typeof schema !== "object" || schema === null) return source !== undefined ? source : schema;
  
  // Gestion des tableaux
  if (Array.isArray(schema)) {
    if (!Array.isArray(source) || source === undefined) return schema;
    
    if (schema.length > 0 && typeof schema[0] === "object" && schema[0] !== null) {
      return source.map(item => mergeStrict(schema[0], item));
    }
        return source;
  }
  
  // Gestion des objets
  const result = {};
  
  for (const key of Object.keys(schema)) {
    if (typeof schema[key] === "object" && schema[key] !== null && !Array.isArray(schema[key]) &&
        source && typeof source[key] === "object" && source[key] !== null && !Array.isArray(source[key])) {
      // Fusion récursive pour les objets imbriqués
      result[key] = mergeStrict(schema[key], source?.[key]);
    } else {
      result[key] = source && source[key] !== undefined ? source[key] : schema[key];
    }
  }
  return result;
}

const merged = mergeStrict(defaultContent, updatedContent);

// Save merged result into src/data
fs.writeFileSync(defaultPath, JSON.stringify(merged, null, 2), "utf8");

console.log("✅ content.json fusionné avec succès");
