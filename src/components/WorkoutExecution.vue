<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
    <div class="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col p-5 shadow-2xl relative">
      
      <!-- En-tête + Widget Minuteur de Repos Actif -->
      <div class="flex justify-between items-center mb-4 border-b pb-3 flex-shrink-0">
        <div>
          <h3 class="font-bold text-lg text-gray-800">🔥 Exécuter la séance</h3>
          <p class="text-xs text-gray-400">Validez vos séries au fur et à mesure</p>
        </div>

        <!-- Minuteur de repos flottant dans l'en-tête -->
        <div v-if="isTimerActive" class="bg-indigo-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md animate-pulse">
          <span class="text-[10px] font-bold uppercase">⏳ Repos :</span>
          <span class="text-xs font-extrabold font-mono">{{ formatTime(restTimeRemaining) }}</span>
          <button @click="stopRestTimer" class="ml-1 text-indigo-200 hover:text-white text-xs font-bold">✕</button>
        </div>

        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">✕</button>
      </div>

      <!-- Chargement -->
      <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">
        Chargement des exercices...
      </div>

      <!-- Liste des exercices avec leurs tableaux de séries groupées -->
      <div v-else class="overflow-y-auto flex-1 space-y-4 pr-1 py-1">
        <div 
          v-for="(item, index) in workoutExercises" 
          :key="item.id" 
          class="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3"
        >
          <div class="flex justify-between items-center">
            <span class="font-bold text-sm text-indigo-600">#{{ index + 1 }} {{ item.exercise_name }}</span>
            <!-- Réglage rapide du temps de repos pour cet exercice -->
            <div class="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200">
              <span class="text-[9px] font-bold text-gray-400 uppercase">Repos:</span>
              <input 
                v-model.number="item.defaultRest" 
                type="number" 
                min="5" 
                max="600"
                class="w-10 bg-transparent text-xs font-bold text-gray-700 text-center outline-none" 
              />
              <span class="text-[9px] text-gray-400">s</span>
            </div>
          </div>

          <!-- En-têtes du tableau de séries -->
          <div class="space-y-2">
            <div class="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-gray-400 px-1">
              <span class="col-span-2 text-center">Série</span>
              <span class="col-span-4 text-center">Poids (kg)</span>
              <span class="col-span-4 text-center">Répétitions</span>
              <span class="col-span-2 text-center">Valider</span>
            </div>

            <!-- Liste des séries de l'exercice -->
            <div 
              v-for="(set, sIndex) in item.setsList" 
              :key="sIndex"
              :class="set.completed ? 'bg-emerald-50/80 border-emerald-200' : 'bg-white border-gray-200'"
              class="grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition shadow-2xs"
            >
              <span class="col-span-2 text-center font-bold text-xs text-gray-500">
                #{{ sIndex + 1 }}
              </span>

              <div class="col-span-4">
                <input 
                  v-model.number="set.weight" 
                  type="number" 
                  step="0.5" 
                  placeholder="0" 
                  class="w-full bg-gray-50 border border-gray-200 py-1.5 px-2 rounded-lg text-center text-xs font-bold text-gray-800 outline-none focus:border-indigo-500" 
                />
              </div>

              <div class="col-span-4">
                <input 
                  v-model.number="set.reps" 
                  type="number" 
                  placeholder="0" 
                  class="w-full bg-gray-50 border border-gray-200 py-1.5 px-2 rounded-lg text-center text-xs font-bold text-gray-800 outline-none focus:border-indigo-500" 
                />
              </div>

              <!-- Bouton de validation (Check) de la série -->
              <div class="col-span-2 flex justify-center">
                <button 
                  @click="completeSet(item, set)"
                  :class="set.completed ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:text-emerald-600 border border-gray-200'"
                  class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition active:scale-95"
                >
                  ✓
                </button>
              </div>
            </div>
          </div>

          <!-- Bouton pour ajouter une série supplémentaire à la volée -->
          <button @click="addSet(item)" class="w-full py-2 bg-white hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-xl border border-gray-200 transition">
            + Ajouter une série
          </button>
        </div>
      </div>

      <!-- Bouton de validation finale -->
      <div class="pt-4 border-t mt-3 flex-shrink-0">
        <button 
          @click="finishWorkout" 
          class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition text-sm"
        >
          Enregistrer et terminer 🎉
        </button>
      </div>

      <!-- BANDEAU / MODALE D'ALARME ACTIVE -->
      <div v-if="isAlarmRinging" class="absolute inset-x-0 bottom-0 bg-red-600 text-white p-4 rounded-b-2xl shadow-2xl flex items-center justify-between z-50 animate-bounce">
        <div class="flex items-center gap-3">
          <span class="text-2xl">⏰</span>
          <div>
            <p class="font-bold text-sm">Temps de repos terminé !</p>
            <p class="text-xs text-red-100">Reprenez l'entraînement</p>
          </div>
        </div>
        <button @click="stopAlarm" class="bg-white text-red-600 font-extrabold px-4 py-2.5 rounded-xl shadow hover:bg-red-50 active:scale-95 transition text-xs uppercase tracking-wider">
          🛑 Arrêter
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps({
  isOpen: Boolean,
  scheduledWorkoutId: String
})

const emit = defineEmits(['close', 'saved'])

const workoutExercises = ref([])
const loading = ref(false)

// Minuteur sécurisé par timestamp
const restTimeRemaining = ref(0)
let timerInterval = null
const isTimerActive = ref(false)

// Alarme visuelle et textuelle
const isAlarmRinging = ref(false)

const triggerAlarm = () => {
  console.log("🚨 ALARME DÉCLENCHÉE !")
  isAlarmRinging.value = true
  
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance("Terminé !")
      utterance.lang = 'fr-FR'
      window.speechSynthesis.speak(utterance)
    }
  } catch (e) {
    console.error("Erreur vocale :", e)
  }
}

const stopAlarm = () => {
  isAlarmRinging.value = false
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  } catch (e) {}
}

const startRestTimer = (seconds) => {
  const safeSeconds = Number(seconds) > 0 ? Number(seconds) : 90
  console.log("-> 1. Démarrage du timer demandé pour", safeSeconds, "secondes.")
  
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  stopAlarm() 

  const targetTime = Date.now() + safeSeconds * 1000
  restTimeRemaining.value = safeSeconds
  isTimerActive.value = true

  timerInterval = setInterval(() => {
    const now = Date.now()
    const remainingMs = targetTime - now
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000))
    
    restTimeRemaining.value = remainingSec

    if (remainingSec <= 0 || remainingMs <= 0) {
      console.log("-> 3. CONDITION DE FIN ATTEINTE !")
      clearInterval(timerInterval)
      timerInterval = null
      isTimerActive.value = false
      triggerAlarm()
    }
  }, 200)
}

const stopRestTimer = () => {
  console.log("Arrêt manuel du timer demandé.")
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  restTimeRemaining.value = 0
  isTimerActive.value = false
  stopAlarm()
}

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

watch(() => props.isOpen, async (newVal) => {
  console.log("👀 Le watcher de isOpen s'est déclenché ! Nouvelle valeur :", newVal, "ID:", props.scheduledWorkoutId)
  if (newVal && props.scheduledWorkoutId) {
    await fetchWorkoutDetails()
  } else {
    stopRestTimer()
  }
}, { immediate: true }) // Ajout de { immediate: true } pour forcer l'exécution immédiate au montage

const fetchWorkoutDetails = async () => {
  loading.value = true
  console.log("-> ID de la séance reçue par la modale :", props.scheduledWorkoutId)
  
  try {
    const { data: scheduledData, error: schedError } = await supabase
      .from('scheduled_workouts')
      .select('workout_id')
      .eq('id', props.scheduledWorkoutId)
      .single()

    console.log("-> Données de scheduled_workouts :", scheduledData, "Erreur :", schedError)

    if (schedError) throw schedError

    if (scheduledData) {
      const { data: exercisesData, error: exError } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', scheduledData.workout_id)

      console.log("-> Exercices récupérés pour ce workout :", exercisesData, "Erreur :", exError)

      if (exError) throw exError

      if (exercisesData) {
        workoutExercises.value = exercisesData.map(ex => {
          const totalSets = ex.sets || 3
          const defaultWeight = ex.weight || 0
          const defaultReps = ex.reps || 10
          
          let setsArray = []
          for (let i = 0; i < totalSets; i++) {
            setsArray.push({
              weight: defaultWeight,
              reps: defaultReps,
              completed: false
            })
          }

          return {
            ...ex,
            defaultRest: (ex.rest_seconds && !isNaN(ex.rest_seconds)) ? Number(ex.rest_seconds) : 90,
            setsList: setsArray
          }
        })
        console.log("-> workoutExercises final initialisé avec succès :", workoutExercises.value.length, "exercices.")
      }
    }
  } catch (err) {
    console.error("Erreur lors du chargement des détails de la séance :", err)
  } finally {
    loading.value = false
  }
}

const completeSet = (exercise, set) => {
  console.log("Clic checkmark détecté sur :", exercise.exercise_name, "Repos configuré :", exercise.defaultRest)
  set.completed = !set.completed
  if (set.completed) {
    startRestTimer(exercise.defaultRest || 90)
  }
}

const addSet = (exercise) => {
  const last = exercise.setsList[exercise.setsList.length - 1]
  exercise.setsList.push({
    weight: last ? last.weight : 0,
    reps: last ? last.reps : 10,
    completed: false
  })
}

const finishWorkout = async () => {
  stopRestTimer()

  try {
    for (const item of workoutExercises.value) {
      await supabase
        .from('workout_exercises')
        .update({
          sets: item.setsList.length,
          reps: item.setsList[0]?.reps || 0,
          weight: item.setsList[0]?.weight || 0
        })
        .eq('id', item.id)

      const userId = (await supabase.auth.getUser()).data.user?.id

      for (let i = 0; i < item.setsList.length; i++) {
        const s = item.setsList[i]
        await supabase.from('workout_set_logs').insert({
          user_id: userId,
          scheduled_workout_id: props.scheduledWorkoutId,
          exercise_name: item.exercise_name,
          set_number: i + 1,
          weight: s.weight,
          reps: s.reps
        })
      }
    }

    await supabase
      .from('scheduled_workouts')
      .update({ status: 'completed' })
      .eq('id', props.scheduledWorkoutId)

    emit('saved')
    emit('close')
  } catch (err) {
    console.error("Erreur lors de l'enregistrement de la séance :", err)
  }
}

onUnmounted(() => {
  stopRestTimer()
})
</script>