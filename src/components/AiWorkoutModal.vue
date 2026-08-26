<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 relative">
      <div class="flex justify-between items-center border-b pb-3">
        <h3 class="font-bold text-lg text-gray-800">✨ Générateur de programme IA</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
      </div>

      <!-- Étape 1 : Demande des contraintes de la semaine -->
      <div v-if="!loading && !generatedWorkouts" class="space-y-4">
        <p class="text-xs text-gray-500">
          L'IA va utiliser ton profil (matériel, objectifs) pour concevoir un programme sur-mesure.
        </p>

        <div>
          <label class="text-xs font-bold text-gray-700 uppercase block mb-1">Nombre de séances par semaine</label>
          <input 
            type="number" 
            v-model.number="sessionsCount" 
            min="1" 
            max="7" 
            class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="text-xs font-bold text-gray-700 uppercase block mb-1">Temps disponible par séance (en minutes)</label>
          <input 
            type="number" 
            v-model.number="sessionDuration" 
            min="15" 
            max="180" 
            step="5"
            class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-indigo-500"
          />
        </div>

        <button 
          @click="generateProgram" 
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-md text-sm"
        >
          Générer mon programme
        </button>
      </div>

      <!-- Étape de chargement -->
      <div v-if="loading" class="py-12 text-center space-y-3">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="text-xs text-gray-500 font-medium">L'IA analyse ton profil et crée tes séances...</p>
      </div>

      <!-- Étape 2 : Prévisualisation des séances générées -->
      <div v-if="generatedWorkouts && !loading" class="space-y-3">
        <div class="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
          <h4 class="font-bold text-indigo-900 text-sm">Programme prêt ({generatedWorkouts.length} séances)</h4>
        </div>

        <div class="max-h-60 overflow-y-auto space-y-2">
          <div v-for="(workout, idx) in generatedWorkouts" :key="idx" class="p-3 bg-gray-50 rounded-xl border text-xs space-y-1">
            <span class="font-bold text-indigo-700 block">{{ workout.title }}</span>
            <span class="text-gray-500 block">{{ workout.exercises.length }} exercices prévus</span>
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button @click="generatedWorkouts = null" class="w-1/2 bg-gray-100 hover:bg-gray-200 font-bold py-2.5 rounded-xl text-xs">Recommencer</button>
          <button @click="saveProgram" class="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs">Tout enregistrer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps({ isOpen: Boolean })
const emit = defineEmits(['close', 'saved'])

const sessionsCount = ref(3)
const sessionDuration = ref(45)
const loading = ref(false)
const generatedWorkouts = ref(null)

const generateProgram = async () => {
  loading.value = true

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Récupération dynamique du profil utilisateur (objectifs, matériel, poids, etc.)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 2. Construction du contexte enrichi pour l'IA
    const userContext = {
      objective: profile?.objective || 'Forme générale',
      equipment: profile?.equipment || 'Poids du corps',
      weight: profile?.weight || 'Non renseigné',
      healthInfo: profile?.health_notes || 'Aucune restriction particulière',
      targetSessionsPerWeek: sessionsCount.value,
      maxDurationMinutes: sessionDuration.value
    }

    /* 
      Ici, tu envoies `userContext` à ton API LLM (OpenAI, backend, etc.).
      L'IA doit te retourner un tableau JSON de plusieurs objets 'workout'.
      Exemple de structure attendue en retour de l'IA :
      [
        {
          title: "Séance 1 : Haut du corps",
          exercises: [
            { exercise_name: "Pompes", sets: 3, reps: 10, rest_seconds: 60, is_cardio: false },
            ...
          ]
        },
        ...
      ]
    */

    // Simulation de la réponse de l'IA basée sur le contexte :
    setTimeout(() => {
      generatedWorkouts.value = Array.from({ length: sessionsCount.value }, (_, i) => ({
        title: `Séance IA ${i + 1} (${userContext.objective})`,
        exercises: [
          { exercise_name: "Exercice principal adapté", sets: 4, reps: 10, rest_seconds: 90, is_cardio: false },
          { exercise_name: "Exercice secondaire / Finition", sets: 3, reps: 12, rest_seconds: 60, is_cardio: false }
        ]
      }))
      loading.value = false
    }, 1500)

  } catch (err) {
    console.error(err)
    alert("Erreur lors de la génération du programme.")
    loading.value = false
  }
}

const saveProgram = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !generatedWorkouts.value) return

  // Boucle sur chaque séance générée pour l'insérer dans Supabase
  for (const workoutData of generatedWorkouts.value) {
    // 1. Insertion du workout principal
    const { data: workout, error: wError } = await supabase
      .from('workouts')
      .insert([{ user_id: user.id, title: workoutData.title }])
      .select()
      .single()

    if (wError) continue

    // 2. Insertion des exercices associés de la séance
    const exercisesToSave = workoutData.exercises.map(ex => ({
      workout_id: workout.id,
      exercise_name: ex.exercise_name,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest_seconds,
      is_superset: false,
      is_cardio: false,
      weight: 0
    }))

    await supabase.from('workout_exercises').insert(exercisesToSave)
  }

  emit('saved')
  emit('close')
  generatedWorkouts.value = null
}
</script>