# coach-ai

Fonction Supabase Edge qui appelle l'API Claude pour EasyFit (clé Anthropic côté serveur uniquement).

Actions (`POST`, JWT Supabase obligatoire) :

- `generate_program` : `{ sessionType, sessionsCount (1-7), sessionDuration (15-120) }` → `{ workouts: [...] }`
- `suggest_progression` : `{ exercise_name, sets, current_weight }` → `{ weight, reps, text }`

## Déploiement

```bash
supabase functions deploy coach-ai --project-ref <ton-project-ref>
supabase secrets set ANTHROPIC_API_KEY=<ta-clé-anthropic> --project-ref <ton-project-ref>
```

`SUPABASE_URL` et `SUPABASE_ANON_KEY` sont injectés automatiquement. Le front n'a plus besoin de `VITE_GEMINI_API_KEY` : supprime-la de ton `.env` et de l'hébergeur, puis révoque l'ancienne clé Gemini.
