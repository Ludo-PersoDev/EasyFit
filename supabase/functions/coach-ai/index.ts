// Fonction Supabase Edge "coach-ai"
// Remplace les appels Gemini faits depuis le navigateur : la clé Anthropic reste côté serveur.
// Deux actions : "generate_program" (génération de séances) et "suggest_progression" (conseil de surcharge).
//
// Secret requis : ANTHROPIC_API_KEY  (supabase secrets set ANTHROPIC_API_KEY=...)
// SUPABASE_URL et SUPABASE_ANON_KEY sont fournis automatiquement par Supabase.

import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "claude-sonnet-5-5";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });

// ---------------------------------------------------------------------------
// Appel à l'API Claude avec sortie structurée (outil forcé)
// ---------------------------------------------------------------------------
type Tool = { name: string; description: string; input_schema: Record<string, unknown> };

async function callClaude(prompt: string, tool: Tool, maxTokens: number) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new HttpError(500, "Service IA non configuré.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error("Erreur API Anthropic", res.status, await res.text());
    if (res.status === 429) throw new HttpError(429, "Trop de demandes à l'IA, réessaie dans un instant.");
    throw new HttpError(502, "Le service IA est indisponible.");
  }

  const data = await res.json();
  if (data.stop_reason === "max_tokens") {
    console.error("Réponse tronquée (max_tokens atteint)");
    throw new HttpError(502, "Réponse IA incomplète, réessaie avec moins de séances.");
  }

  // deno-lint-ignore no-explicit-any
  const block = data.content?.find((b: any) => b.type === "tool_use");
  if (!block?.input) throw new HttpError(502, "Réponse IA invalide.");
  return block.input;
}

// ---------------------------------------------------------------------------
// Validation des entrées
// ---------------------------------------------------------------------------
const SESSION_TYPES = ["MIXED", "HYPERTROPHY", "PURE_STRENGTH", "RUNNING_CARDIO", "MOBILITY", "HIIT"];

function intInRange(value: unknown, min: number, max: number, label: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `Paramètre invalide : ${label}.`);
  }
  return n;
}

// ---------------------------------------------------------------------------
// Action 1 : génération d'un programme
// ---------------------------------------------------------------------------
const PROGRAM_TOOL: Tool = {
  name: "enregistrer_programme",
  description: "Enregistre le programme d'entraînement généré (liste de séances).",
  input_schema: {
    type: "object",
    properties: {
      workouts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Nom de la séance" },
            exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  exercise_name: { type: "string", description: "Nom exact de l'exercice du catalogue" },
                  sets: { type: "integer" },
                  reps: { type: "integer" },
                  duration_minutes: { type: ["number", "null"] },
                  distance_km: { type: ["number", "null"] },
                  rest_seconds: { type: "integer" },
                  is_cardio: { type: "boolean" },
                  is_superset: { type: "boolean" },
                },
                required: [
                  "exercise_name", "sets", "reps", "duration_minutes",
                  "distance_km", "rest_seconds", "is_cardio", "is_superset",
                ],
              },
            },
          },
          required: ["title", "exercises"],
        },
      },
    },
    required: ["workouts"],
  },
};

// deno-lint-ignore no-explicit-any
async function generateProgram(supabase: any, userId: string, body: any) {
  const sessionType = String(body.sessionType ?? "");
  if (!SESSION_TYPES.includes(sessionType)) throw new HttpError(400, "Paramètre invalide : sessionType.");
  const sessionsCount = intInRange(body.sessionsCount, 1, 7, "sessionsCount");
  const sessionDuration = intInRange(body.sessionDuration, 15, 120, "sessionDuration");

  // Les requêtes passent avec le JWT de l'utilisateur : les règles RLS s'appliquent.
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  const { data: exercisesCatalog } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment");

  const prompt = `
Tu es un coach sportif expert. Génère un programme d'entraînement complet en appelant l'outil "enregistrer_programme".

ORIENTATION DEMANDÉE : ${sessionType}

PARAMÈTRES UTILISATEUR :
- Objectif principal : ${profile?.goal || "HEALTH"}
- Niveaux : Muscu (${profile?.level_strength || "INTERMEDIATE"}), Cardio (${profile?.level_cardio || "INTERMEDIATE"}), Mobilité (${profile?.level_mobility || "INTERMEDIATE"})
- Matériel disponible : ${JSON.stringify(profile?.equipment_access || ["Poids du corps"])}
- Contraintes / Blessures : ${JSON.stringify(profile?.injuries_list || [])}
- Format : ${sessionsCount} séances, durée ~${sessionDuration} minutes.

RÈGLES STRICTES SELON L'ORIENTATION DEMANDÉE :
- Si HYPERTROPHY : Conçois exclusivement des séances orientées volume (formats de type 3 à 4 séries de 8 à 12 répétitions, temps de repos modérés de 60 à 90s). Interdiction totale de mettre du cardio ou de la course à pied.
- Si PURE_STRENGTH : Conçois exclusivement des séances de force pure (formats de type 5x5 ou charges lourdes, basées sur des mouvements polyarticulaires, reps basses de 3 à 6, et temps de repos longs de 2 à 3 minutes). Interdiction totale de mettre du cardio ou de la course à pied.
- Si RUNNING_CARDIO : Intègre en priorité de la course à pied, du fractionné ou du cardio.
- Si MOBILITY : Privilégie les étirements et la souplesse.
- Si HIIT : Fais du circuit training dynamique.
- Si MIXED : Fais intelligemment selon l'objectif renseigné sur le profil.

RÈGLES IMPORTANTES POUR LE CARDIO / FRACTIONNÉ (si applicable) :
- Pour les séances de course à pied / fractionné / HIIT, décompose la séance étape par étape sous forme de lignes distinctes.
- Utilise les champs "duration_minutes" et "distance_km" pour chaque occurrence cardio, et laisse-les à null pour la musculation (en utilisant "sets" et "reps").
- RÈGLE ÉCHAUFFEMENT / RETOUR AU CALME : Pour chaque séance de musculation (Hypertrophie ou Force), intègre systématiquement des exercices d'échauffement articulaire ou dynamique au tout début, et des exercices de retour au calme ou d'étirements à la toute fin.

CATALOGUE D'EXERCICES DISPONIBLES (utilise les noms exacts) :
${JSON.stringify(exercisesCatalog || [])}
`;

  const input = await callClaude(prompt, PROGRAM_TOOL, 8000);
  if (!Array.isArray(input.workouts) || input.workouts.length === 0) {
    throw new HttpError(502, "Réponse IA invalide.");
  }
  return { workouts: input.workouts };
}

// ---------------------------------------------------------------------------
// Action 2 : suggestion de progression pour un exercice
// ---------------------------------------------------------------------------
const SUGGESTION_TOOL: Tool = {
  name: "proposer_progression",
  description: "Propose la prochaine charge et le nombre de répétitions pour l'exercice.",
  input_schema: {
    type: "object",
    properties: {
      weight: { type: "number", description: "Charge recommandée en kg" },
      reps: { type: "integer", description: "Répétitions recommandées" },
      text: { type: "string", description: "Analyse courte et conseil, en français, à la deuxième personne" },
    },
    required: ["weight", "reps", "text"],
  },
};

// deno-lint-ignore no-explicit-any
async function suggestProgression(supabase: any, userId: string, body: any) {
  const exerciseName = String(body.exercise_name ?? "").trim();
  if (exerciseName.length === 0 || exerciseName.length > 120) {
    throw new HttpError(400, "Paramètre invalide : exercise_name.");
  }
  const sets = intInRange(body.sets ?? 0, 0, 50, "sets");
  const currentWeight = body.current_weight == null ? null : Number(body.current_weight);
  if (currentWeight !== null && (!Number.isFinite(currentWeight) || currentWeight < 0 || currentWeight > 1000)) {
    throw new HttpError(400, "Paramètre invalide : current_weight.");
  }

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  // Historique de CET exercice uniquement, sur les 4 dernières semaines
  const { data: historyData } = await supabase
    .from("workout_set_logs")
    .select("weight, reps, set_number, created_at")
    .eq("user_id", userId)
    .eq("exercise_name", exerciseName)
    .eq("is_cardio", false)
    .gte("created_at", fourWeeksAgo.toISOString())
    .order("created_at", { ascending: true });

  const prompt = `
Tu es un coach sportif expert. Analyse l'historique des 4 dernières semaines pour CET EXERCICE UNIQUEMENT (${exerciseName}).
Détermine s'il s'agit d'une progression ou d'une contre-performance, et propose la meilleure surcharge progressive (par le poids ou les répétitions).

HISTORIQUE DE L'EXERCICE : ${JSON.stringify(historyData || [])}
EXERCICE ACTUEL : ${JSON.stringify({ name: exerciseName, sets, currentWeight })}

Réponds en appelant l'outil "proposer_progression". Exemple de texte : "Analyse de tes perfs : passe à 62.5kg ou valide tes 10 reps."
`;

  return await callClaude(prompt, SUGGESTION_TOOL, 500);
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    if (req.method !== "POST") throw new HttpError(405, "Méthode non autorisée.");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new HttpError(401, "Non authentifié.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new HttpError(401, "Non authentifié.");

    let body;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Corps de requête invalide.");
    }

    switch (body?.action) {
      case "generate_program":
        return json(await generateProgram(supabase, user.id, body));
      case "suggest_progression":
        return json(await suggestProgression(supabase, user.id, body));
      default:
        throw new HttpError(400, "Action inconnue.");
    }
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error(err);
    return json({ error: "Erreur interne." }, 500);
  }
});
