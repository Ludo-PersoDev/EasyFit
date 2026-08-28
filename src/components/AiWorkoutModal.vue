<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative space-y-5">
      
      <!-- Bouton fermer -->
      <button 
        @click="$emit('close')" 
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
      >
        ✕
      </button>

      <div>
        <h3 class="text-lg font-bold text-gray-800">✨ Générateur de programme IA</h3>
        <p class="text-xs text-gray-500 mt-1">L'IA va concevoir tes séances en se basant sur ton profil, ton matériel et ta base d'exercices.</p>
      </div>

      <!-- Formulaire de configuration de la génération -->
      <div class="space-y-4">
        <!-- Type de séance -->
        <div>
          <label class="block text-xs font-bold text-gray-700 mb-1">Orientation / Type de séance</label>
          <select 
            v-model="sessionType" 
            class="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="MIXED">🔄 Mixte / Selon l'objectif du profil</option>
            <option value="HYPERTROPHY">💪 Hypertrophie (Volume & Prise de muscle)</option>
            <option value="PURE_STRENGTH">🏋️‍♂️ Force pure (Charges lourdes & Neuro)</option>
            <option value="RUNNING_CARDIO">🏃‍♂️ Course à pied & Cardio / Endurance</option>
            <option value="MOBILITY">🧘‍♂️ Mobilité, Étirements & Récupération</option>
            <option value="HIIT">⚡ HIIT / Circuit training dynamique</option>
          </select>
        </div>

        <!-- Nombre de séances (Curseur de 1 à 7) -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="block text-xs font-bold text-gray-700">Nombre de séances à générer</label>
            <span class="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{{ sessionsCount }} séance(s)</span>
          </div>
          <input 
            type="range" 
            v-model.number="sessionsCount" 
            min="1" 
            max="7" 
            step="1"
            class="w-full accent-purple-600 cursor-pointer"
          />
          <div class="flex justify-between text-[10px] text-gray-400 px-1 mt-0.5">
            <span>1</span>
            <span>3</span>
            <span>5</span>
            <span>7</span>
          </div>
        </div>

        <!-- Durée estimée par séance (Intervalles sélectionnables) -->
        <div>
          <label class="block text-xs font-bold text-gray-700 mb-1">Durée estimée par séance</label>
          <div class="grid grid-cols-5 gap-1.5">
            <button 
              v-for="duration in durationOptions" 
              :key="duration"
              type="button"
              @click="sessionDuration = duration"
              :class="[
                'py-2 text-xs font-bold rounded-xl border transition',
                sessionDuration === duration 
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              ]"
            >
              {{ duration }}m
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="p-3 bg-red-50 text-red-600 text-xs rounded-xl">
          {{ errorMsg }}
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 pt-2">
        <button 
          @click="$emit('close')" 
          class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
          :disabled="loading"
        >
          Annuler
        </button>
        <button 
          @click="generateAndSaveWorkouts" 
          class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          :disabled="loading"
        >
          <span v-if="loading" class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
          {{ loading ? 'Génération...' : 'Générer' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'saved'])

const sessionType = ref('MIXED')
const sessionsCount = ref(3)
const sessionDuration = ref(45)
const durationOptions = [30, 45, 60, 75, 90]

const loading = ref(false)
const errorMsg = ref('')

const generateAndSaveWorkouts = async () => {
  loading.value = true
  errorMsg.value = ''

  try {
    // 1. Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Utilisateur non authentifié.")

    // 2. Récupérer le profil utilisateur
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 3. Récupérer le catalogue des exercices
    const { data: exercisesCatalog } = await supabase
      .from('exercises')
      .select('id, name, muscle_group, equipment')

    // 4. Appel à l'API Gemini (Modèle 3.5 Flash)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) throw new Error("Clé API Gemini introuvable dans les variables d'environnement.")

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`

    const prompt = `
      Tu es un coach sportif expert. Génère un programme d'entraînement complet sous forme de tableau JSON strict.
      
      ORIENTATION DEMANDÉE : ${sessionType.value}
      
      PARAMÈTRES UTILISATEUR :
      - Objectif principal : ${profile?.goal || 'HEALTH'}
      - Niveaux : Muscu (${profile?.level_strength || 'INTERMEDIATE'}), Cardio (${profile?.level_cardio || 'INTERMEDIATE'}), Mobilité (${profile?.level_mobility || 'INTERMEDIATE'})
      - Matériel disponible : ${JSON.stringify(profile?.equipment_access || ['Poids du corps'])}
      - Contraintes / Blessures : ${JSON.stringify(profile?.injuries_list || [])}
      - Format : ${sessionsCount.value} séances, durée ~${sessionDuration.value} minutes.

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

      CATALOGUE D'EXERCICES DISPONIBLES :
      ${JSON.stringify(exercisesCatalog || [])}

      FORMAT DE RÉPONSE ATTENDU (Uniquement un tableau JSON valide, sans balises markdown, sans texte additionnel) :
      [
        {
          "title": "Nom de la séance",
          "exercises": [
            {
              "exercise_name": "Nom exact de l'exercice",
              "sets": 4,
              "reps": 10,
              "duration_minutes": null,
              "distance_km": null,
              "rest_seconds": 90,
              "is_cardio": false,
              "is_superset": false
            }
          ]
        }
      ]
    `

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    })

    const result = await response.json()

    if (!result.candidates || !result.candidates[0]) {
      throw new Error("Erreur lors de la réponse de l'IA.")
    }

    const jsonString = result.candidates[0].content.parts[0].text
    const generatedWorkouts = JSON.parse(jsonString)

    // 5. Enregistrer en base
    for (const workout of generatedWorkouts) {
      const { data: newWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          title: workout.title
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      if (workout.exercises && workout.exercises.length > 0) {
        const exercisesToInsert = workout.exercises.map((ex) => {
          return {
            workout_id: newWorkout.id,
            exercise_name: ex.exercise_name,
            sets: ex.sets || 1,
            reps: ex.reps || 1,
            duration_minutes: ex.duration_minutes !== undefined ? ex.duration_minutes : null,
            distance_km: ex.distance_km !== undefined ? ex.distance_km : null,
            rest_seconds: ex.rest_seconds || 0,
            is_cardio: ex.is_cardio || false,
            is_superset: ex.is_superset || false
          }
        })

        const { error: exError } = await supabase
          .from('workout_exercises')
          .insert(exercisesToInsert)

        if (exError) throw exError
      }
    }

    emit('saved')
    emit('close')

  } catch (err) {
    console.error(err)
    errorMsg.value = "Erreur : " + err.message
  } finally {
    loading.value = false
  }
}
</script>