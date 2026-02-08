import { ContactSchema } from '@/types';
import { GoogleGenAI } from '@google/genai';

// --- ATTENTION ---
// TODO: Remplacez cette clé par votre propre clé API Gemini.
// Il est fortement recommandé de ne pas la stocker en clair dans le code pour une application de production.
// Utilisez des variables d'environnement (par exemple, via un fichier .env et expo-constants).
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
// console.info("gemini api key",API_KEY)
if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
  console.warn(
    'Clé API Gemini non configurée. Le service ne fonctionnera pas. Veuillez ajouter votre clé dans services/geminiService.ts'
  );
}

const genAI = new GoogleGenAI({apiKey: API_KEY});
const MAX_CSV_LINES_FOR_TESTING = 15; // Nouvelle constante pour la limite de données

function limitCsvContent(csvContent: string): string {
  // Séparer le contenu en lignes (en utilisant un regex pour gérer \r\n et \n)
  const lines = csvContent.split(/\r?\n/);

  if (lines.length <= 1) {
    return csvContent; // Moins d'une ligne de données (peut-être juste un en-tête ou vide)
  }

  // 1. Conserver l'en-tête (première ligne)
  const header = lines[0];

  // 2. Conserver au maximum les 15 lignes de données suivantes
  // lines.slice(1) prend toutes les lignes de données après l'en-tête
  const dataLines = lines.slice(1, 1 + MAX_CSV_LINES_FOR_TESTING);

  // 3. Reconstruire le contenu CSV limité
  const limitedLines = [header, ...dataLines];
  
  // Joindre les lignes avec un saut de ligne standard (\n)
  return limitedLines.join('\n');
}

// Nouvelle version de buildPrompt
// function buildPrompt(csvContent: string, schema: ContactSchema): string {
//   // 1. Préparer les règles de priorité (seulement les IDs et les marqueurs de priorité)
//   const keyFields = schema.fields.map((field) => ({
//     targetKey: field.name, // <-- UTILISE LE NOM CONVIVIAL COMME CLÉ
//     isPrimaryPhone: !!field.isPrimaryPhone,
//     isDisplayName: !!field.isDisplayName,
//     // On retire les autres détails pour éviter la confusion du modèle
//   }));
  
//   // 2. Créer l'exemple de sortie attendue
//   const exampleOutput: Record<string, string> = {};
//   keyFields.forEach(field => {
//       exampleOutput[field.targetKey] = `[Valeur extraite du CSV pour le champ ${field.targetKey}]`;
//   });

//   return `
//     Tu es un assistant expert en extraction de données et en déduction. Ta tâche est d'analyser les données CSV brutes suivantes et de les mapper vers une structure de contacts JSON.

//     Voici les données CSV brutes à analyser :
//     ---
//     ${csvContent}
//     ---

//     ### Structure Cible (Noms de Champs et Règles) :
//     Utilise les valeurs de 'targetKey' comme clés dans l'objet JSON de sortie. Les règles de priorité sont incluses :
//     ---
//     ${JSON.stringify(keyFields, null, 2)}
//     ---
    
//     ### Format de Sortie Attendu (Très Important) :
//     Chaque contact dans le tableau DOIT respecter la structure ci-dessous.
    
//     1.  **Utiliser les Noms** : Toutes les autres clés doivent être les valeurs de **'targetKey'** (les noms conviviaux des champs).
//     2.  **NE PAS** inclure de clé 'id' dans la sortie JSON, cela sera géré par l'application.
    
//     Exemple d'UN contact :
//     ---
//     ${JSON.stringify(exampleOutput, null, 2).replace(/"\[.*\]"/g, '"..."')}
//     ---

//     ### Instructions d'Extraction Primordiales :

//     1.  **Mappage Déductif :** Analyse l'en-tête et les premières lignes du CSV. Utilise la déduction et le contexte pour associer la colonne CSV la plus pertinente au **'targetKey'** correspondant.

//     2.  **Règle de Conservation des Enregistrements (Filtre) :** Un contact doit **UNIQUEMENT** être conservé et inclus dans le tableau final s'il contient à la fois :
//         * Une donnée pour le champ marqué comme **"isDisplayName"** (Nom d'affichage).
//         * Une donnée valide pour le champ marqué comme **"isPrimaryPhone"** (Numéro de téléphone principal).
//         Si l'une ou l'autre de ces informations clés est manquante sur une ligne, **ignore toute la ligne**.

//     3.  **Gestion des Données Manquantes (Remplissage) :** Pour les champs valides qui n'ont **PAS** été fournis dans la ligne CSV (mais qui ne sont pas les champs primordiaux mentionnés ci-dessus), tu dois attribuer une **chaîne de caractères vide ("")** comme valeur.

//     4.  **Format de Sortie Strict :**
//         * Le résultat doit être un **tableau JSON valide** (un array d'objets contact).
//         * Ne retourne **RIEN d'autre** que le tableau JSON. Juste le tableau brut, commençant par [ et se terminant par ].
//     `
//   ;
// }
function buildPrompt(csvContent: string, schema: ContactSchema): string {
  // Utiliser les IDs comme clés stables
  const keyFields = schema.fields.map((field) => ({
    id: field.id, 
    label: field.name,
    isPrimaryPhone: !!field.isPrimaryPhone,
    isDisplayName: !!field.isDisplayName,
  }));

  // Exemple de sortie attendu (basé sur les IDs)
  const exampleOutput: Record<string, string> = {};
  keyFields.forEach(field => {
    exampleOutput[field.id] = `Valeur pour "${field.label}"`;
  });

  return `
    Tu es un assistant expert en extraction de données CSV vers JSON.

    Voici le contenu CSV :
    ---
    ${csvContent}
    ---

    ### Structure cible :
    Voici la liste des champs à produire. Utilise **STRICTEMENT les IDs** comme clés dans les objets JSON :
    ---
    ${JSON.stringify(keyFields, null, 2)}
    ---

    ### Exemple d'un objet contact attendu :
    ---
    ${JSON.stringify(exampleOutput, null, 2)}
    ---

    ### Règles d'extraction :

    1. Chaque objet doit contenir **toutes** les clés listées (les IDs des champs).
    2. Si une donnée est absente pour un champ non prioritaire → utilise "".
    3. Un contact n'est valide que s'il contient :
      - une valeur pour le champ isDisplayName: true
      - une valeur pour le champ isPrimaryPhone: true
    4. Le résultat doit être **UN TABLEAU JSON STRICT**, commençant par [ et finissant par ].
    5. N'inclus jamais de clé "id". L'application gérera cela.`
  ;
}


export function mapGeminiResultToType(
  raw: Record<string, any>,
  schema: ContactSchema
) {
  const mapped: Record<string, any> = {};

  schema.fields.forEach(field => {
    mapped[field.id] = raw[field.id] ?? null;
  });

  return mapped;
}


export async function extractContactsFromCsv(
  csvContent: string,
  schema: ContactSchema
): Promise<Record<string, any>[]> {
  const limitedCsvContent = limitCsvContent(csvContent);
  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: buildPrompt(limitedCsvContent, schema),
    config: {
      responseMimeType: 'application/json',
      // responseJsonSchema: contactSchemaToJson(schema), // Non utilisé pour la flexibilité
    }
  });

  const rawText = response.text?.trim() ?? ""; // Supprimer les espaces avant/après
  console.log("api response text: ", rawText);

  // Gérer le cas où la réponse est vide
  if (!rawText) {
    console.log('API returned empty text, returning []');
    return [];
  }

  try {
    const contacts = JSON.parse(rawText);
    console.log('api contact result: ', contacts);
    
    // Assurez-vous que la sortie est un tableau, même si Gemini retourne un objet unique
    return Array.isArray(contacts) ? contacts : [contacts].filter(c => c); 

  } catch (e) {
    // Capturer l'erreur de JSON.parse pour le débogage (ex: Unexpected end of input)
    console.error("Erreur lors de l'analyse JSON de la réponse Gemini. Réponse brute:", rawText);
    // Lance une erreur plus claire au niveau supérieur
    throw new Error(`Erreur d'analyse JSON de l'API: La réponse de l'IA n'était pas un JSON valide.`);
  }
}