<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-8 flex flex-col items-center">
    <!-- CONTENEUR LARGEUR PC OPTIMISÉ (max-w-4xl) -->
    <div class="w-full max-w-md md:max-w-4xl lg:max-w-5xl bg-white sm:bg-transparent md:p-2 sm:shadow-none">
      
      <!-- En-tête -->
      <div class="flex justify-between items-center mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-800">
          {{ isEditing ? '✏️ Modifier la séance' : '✨ Créer une nouvelle séance' }}
        </h2>
        <router-link to="/dashboard" class="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-bold bg-gray-100 px-3.5 py-2 rounded-xl transition">
          ← Retour au tableau de bord
        </router-link>
      </div>

      <!-- Saisie du titre de la séance -->
      <div class="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <label class="text-xs text-gray-400 block mb-1.5 font-bold uppercase tracking-wider">Titre de la séance</label>
        <input v-model="workoutTitle" type="text" placeholder="ex: Haut du corps - Force" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm sm:text-base font-bold text-gray-800 outline-none focus:border-indigo-500 transition" />
      </div>

      <!-- Liste des blocs d'exercices -->
      <div class="space-y-4 mb-6">
        <div 
          v-for="(block, bIndex) in exerciseBlocks" 
          :key="bIndex"
          :class="block.isSupersetGroup ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200' : 'bg-white border-gray-200'"
          class="p-5 rounded-2xl shadow-sm border space-y-4 relative transition-all"
        >
          <!-- Badge Superset si le bloc en contient plusieurs -->
          <div v-if="block.isSupersetGroup" class="flex items-center justify-between border-b border-indigo-200 pb-3">
            <span class="text-xs font-extrabold bg-indigo-600 text-white px-3 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5">
              ⚡ Bloc Superset
            </span>
            <span class="text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
              {{ block.exercises.length }} exercices enchaînés
            </span>
          </div>

          <!-- CONTENEUR DES EXERCICES : GRILLE RESPONSIVE PC -->
          <!-- Si pas superset : 1 colonne propre. Si superset : 2 colonnes côte à côte sur PC ! -->
          <div 
            class="grid gap-4 items-start"
            :class="block.isSupersetGroup ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'"
          >
            <div 
              v-for="(elem, subIndex) in block.exercises" 
              :key="elem.originalIndex" 
              class="space-y-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm relative h-full flex flex-col justify-between"
            >
              <div>
                <!-- En-tête de l'exercice -->
                <div class="flex justify-between items-center mb-3">
                  <span class="font-bold text-indigo-600 text-sm sm:text-base">
                    #{{ bIndex + 1 }}.{{ subIndex + 1 }} {{ elem.item.exercise_name || 'Exercice non défini' }}
                  </span>
                  <button @click="removeExerciseRow(elem.originalIndex)" class="text-red-400 hover:text-red-600 text-xs font-bold transition bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-100">
                    Supprimer
                  </button>
                </div>

                <!-- Bouton Choix d'exercice -->
                <button 
                  v-if="!elem.item.exercise_name" 
                  @click="openExerciseModal(elem.originalIndex)" 
                  class="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2.5 rounded-xl text-sm mb-3 transition border border-indigo-200 border-dashed"
                >
                  🔍 Choisir un exercice
                </button>
                <div v-else class="flex items-center justify-between mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <button 
                    @click="openExerciseModal(elem.originalIndex)" 
                    class="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline block"
                  >
                    Changer d'exercice
                  </button>
                  
                  <!-- Sélecteur manuel Type (Muscu vs Cardio) -->
                  <div class="flex bg-white p-0.5 rounded-lg border border-gray-200 text-xs font-bold shadow-xs">
                    <button 
                      @click="elem.item.is_cardio = false" 
                      :class="!elem.item.is_cardio ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500'" 
                      class="px-3 py-1.5 rounded-md transition"
                    >
                      Muscu
                    </button>
                    <button 
                      @click="elem.item.is_cardio = true" 
                      :class="elem.item.is_cardio ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500'" 
                      class="px-3 py-1.5 rounded-md transition"
                    >
                      Cardio
                    </button>
                  </div>
                </div>

                <!-- Formulaire Cardio -->
                <div v-if="elem.item.is_cardio" class="space-y-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-xs text-gray-400 block mb-1 font-bold">Durée (min)</label>
                      <input v-model.number="elem.item.duration_minutes" type="number" step="0.5" placeholder="ex: 30" class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 font-bold" />
                    </div>
                    <div>
                      <label class="text-xs text-gray-400 block mb-1 font-bold">Distance (km)</label>
                      <input v-model.number="elem.item.distance_km" type="number" step="0.1" placeholder="ex: 5" class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 font-bold" />
                    </div>
                  </div>

                  <!-- Option Suivi GPS -->
                  <div class="pt-1 flex items-center gap-2.5 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                    <input type="checkbox" v-model="elem.item.enable_gps" :id="'gps-'+elem.originalIndex" class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                    <label :for="'gps-'+elem.originalIndex" class="text-xs font-bold text-emerald-800 cursor-pointer select-none flex items-center gap-1">
                      🛰️ Activer le suivi GPS automatique
                    </label>
                  </div>

                  <!-- Case à cocher Superset / Enchaînement -->
                  <div v-if="elem.originalIndex > 0" class="pt-1 flex items-center gap-2.5">
                    <input type="checkbox" v-model="elem.item.is_superset" :id="'superset-'+elem.originalIndex" class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                    <label :for="'superset-'+elem.originalIndex" class="text-xs font-bold text-indigo-600 cursor-pointer select-none">
                      Lier en enchaînement / bloc 🔗
                    </label>
                  </div>
                </div>

                <!-- Formulaire Musculation -->
                <div v-else class="space-y-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="text-xs text-gray-400 block mb-1 font-bold">Séries</label>
                      <input v-model.number="elem.item.sets" type="number" placeholder="ex: 3" class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 font-bold text-gray-800" />
                    </div>
                    <div>
                      <label class="text-xs text-gray-400 block mb-1 font-bold">Répétitions</label>
                      <input v-model.number="elem.item.reps" type="number" placeholder="ex: 10" class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-500 font-bold text-gray-800" />
                    </div>
                  </div>

                  <!-- Case à cocher Superset -->
                  <div v-if="elem.originalIndex > 0" class="pt-1 flex items-center gap-2.5">
                    <input type="checkbox" v-model="elem.item.is_superset" :id="'superset-'+elem.originalIndex" class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                    <label :for="'superset-'+elem.originalIndex" class="text-xs font-bold text-indigo-600 cursor-pointer select-none">
                      Lier en Superset avec le précédent 🔗
                    </label>
                  </div>
                </div>
              </div>

              <!-- Champ Repos (affiché uniquement sous le dernier exercice du bloc) -->
              <div v-if="subIndex === block.exercises.length - 1" class="pt-3 border-t border-gray-100 mt-3 space-y-2.5">
                <div v-if="elem.item.is_cardio" class="flex items-center gap-2">
                  <input type="checkbox" v-model="elem.item.has_rest" :id="'has-rest-'+elem.originalIndex" class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                  <label :for="'has-rest-'+elem.originalIndex" class="text-xs font-bold text-indigo-600 cursor-pointer select-none">
                    ⏱️ Temps de récupération / repos (fractionné)
                  </label>
                </div>
                <div v-else class="text-xs font-bold text-gray-500">
                  ⏱️ Temps de repos après ce bloc
                </div>

                <!-- Sélecteur Minutes / Secondes ergonomique -->
                <div v-if="!elem.item.is_cardio || elem.item.has_rest" class="grid grid-cols-2 gap-2 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                  <div>
                    <label class="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Minutes</label>
                    <select 
                      v-model.number="elem.item.rest_minutes" 
                      @change="updateRestSeconds(elem.item)"
                      class="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-indigo-500"
                    >
                      <option v-for="m in [0, 1, 2, 3, 4, 5, 10]" :key="m" :value="m">{{ m }} min</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-[10px] uppercase font-extrabold text-gray-400 block mb-1">Secondes</label>
                    <select 
                      v-model.number="elem.item.rest_secs_part" 
                      @change="updateRestSeconds(elem.item)"
                      class="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-indigo-500"
                    >
                      <option v-for="s in [0, 15, 30, 45]" :key="s" :value="s">{{ s }} sec</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button @click="addExerciseRow" class="w-full py-3.5 bg-white border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-2xl text-gray-600 hover:text-indigo-600 font-bold mb-6 transition active:scale-95 shadow-xs">
        + Ajouter un exercice
      </button>

      <button @click="saveWorkout" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition text-base">
        {{ isEditing ? 'Mettre à jour la séance' : 'Enregistrer la séance' }}
      </button>
    </div>

    <!-- BANDEAU / MODALE D'ALARME ACTIVE -->
    <div v-if="isAlarmRinging" class="fixed inset-x-0 bottom-0 sm:bottom-6 sm:max-w-md sm:mx-auto bg-red-600 text-white p-4 sm:rounded-2xl shadow-2xl flex items-center justify-between z-50 animate-bounce">
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

    <!-- MODALE DE SÉLECTION D'EXERCICE -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div class="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl">
        
        <div class="flex justify-between items-center mb-4 border-b pb-3 flex-shrink-0">
          <h3 class="font-bold text-lg text-gray-800">Sélectionner un exercice</h3>
          <button @click="isModalOpen = false" class="text-gray-400 hover:text-gray-600 font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">✕</button>
        </div>

        <!-- Étape 1 : Choix de la catégorie -->
        <div v-if="modalStep === 1" class="space-y-3 overflow-y-auto flex-1 py-2">
          <p class="text-xs text-gray-500 uppercase font-bold tracking-wider">1. Choisir la catégorie</p>
          <div class="grid grid-cols-2 gap-3">
            <button v-for="cat in availableCategories" :key="cat" @click="selectBodyCategory(cat)" class="p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 transition text-left shadow-sm capitalize">
              📁 {{ cat }}
            </button>
          </div>
        </div>

        <!-- Étape 2 : Liste des exercices -->
        <div v-if="modalStep === 2" class="space-y-3 flex-1 flex flex-col overflow-hidden py-2">
          <div class="flex items-center justify-between flex-shrink-0">
            <p class="text-xs text-gray-500 uppercase font-bold tracking-wider">2. Exercices ({{ selectedCategory }})</p>
            <button @click="modalStep = 1" class="text-xs text-indigo-600 hover:underline font-bold">← Changer de catégorie</button>
          </div>

          <input v-model="searchQuery" type="text" placeholder="Filtrer par nom..." class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-indigo-500 shadow-inner flex-shrink-0" />

          <div v-if="availableSubGroups.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 flex-shrink-0">
            <button 
              @click="selectMuscleGroup('')" 
              :class="selectedGroup === '' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'" 
              class="px-3 py-2 rounded-lg text-xs font-bold text-center transition shadow-sm border border-transparent"
            >
              Tout afficher
            </button>
            <button 
              v-for="sub in availableSubGroups" 
              :key="sub" 
              @click="selectMuscleGroup(sub)" 
              :class="selectedGroup === sub ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'" 
              class="px-3 py-2 rounded-lg text-xs font-medium text-center transition shadow-sm border border-transparent capitalize hover:border-indigo-200"
            >
              {{ sub }}
            </button>
          </div>

          <div class="overflow-y-auto flex-1 space-y-2 pr-1 mt-1">
            <div v-for="item in filteredExercises" :key="item.id" @click="pickExercise(item)" class="p-3.5 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 border border-gray-200 rounded-xl cursor-pointer transition flex justify-between items-center group">
              <div>
                <p class="font-bold text-sm text-gray-800 group-hover:text-indigo-900">{{ item.name }}</p>
                <p class="text-xs text-gray-400 capitalize">{{ item.muscle_group || item.category || 'Général' }}</p>
              </div>
              <span class="text-indigo-600 font-bold text-sm bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100">Sélectionner</span>
            </div>
            <div v-if="filteredExercises.length === 0" class="text-center py-12 text-gray-400 text-sm">
              Aucun exercice trouvé.
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const workoutId = ref(route.query.id || null)
const isEditing = computed(() => !!workoutId.value)
const workoutTitle = ref('Séance du ' + new Date().toLocaleDateString())

const allExercises = ref([])
const exercises = ref([{ 
  exercise_name: '', 
  is_cardio: false, 
  sets: 3, 
  reps: 10, 
  rest_minutes: 1,
  rest_secs_part: 30,
  rest_seconds: 90, 
  has_rest: true,
  is_superset: false, 
  duration_minutes: null, 
  distance_km: null,
  enable_gps: false 
}])

const isModalOpen = ref(false)
const modalStep = ref(1)
const activeRowIndex = ref(null)
const selectedCategory = ref('')
const selectedGroup = ref('')
const searchQuery = ref('')

const isAlarmRinging = ref(false)
let audioCtx = null
let alarmInterval = null

onMounted(async () => {
  const { data: exData } = await supabase.from('exercises').select('*').order('name')
  if (exData) allExercises.value = exData

  if (workoutId.value) {
    const { data: workoutData, error: wError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', workoutId.value)
      .single()

    if (!wError && workoutData) {
      workoutTitle.value = workoutData.title
    }

    const { data: exercisesData, error: eError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId.value)

    if (!eError && exercisesData && exercisesData.length > 0) {
      exercises.value = exercisesData.map(ex => {
        const totalSecs = ex.rest_seconds || 0
        const isCardio = Boolean(ex.is_cardio || (ex.duration_minutes !== null && ex.duration_minutes > 0))
        return {
          exercise_name: ex.exercise_name,
          is_cardio: isCardio, 
          sets: isCardio ? 0 : (ex.sets ?? 3),
          reps: isCardio ? 0 : (ex.reps ?? 10),
          rest_seconds: totalSecs,
          rest_minutes: Math.floor(totalSecs / 60),
          rest_secs_part: totalSecs % 60,
          has_rest: totalSecs > 0,
          is_superset: ex.is_superset || false,
          duration_minutes: ex.duration_minutes || null,
          distance_km: ex.distance_km || null,
          enable_gps: ex.enable_gps || false
        }
      })
    }
  }
})

onUnmounted(() => {
  stopAlarm()
})

const playBeep = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime)

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.start()
    oscillator.stop(audioCtx.currentTime + 0.3)
  } catch (e) {
    console.log("Erreur audio", e)
  }
}

const triggerAlarm = () => {
  if (isAlarmRinging.value) return
  isAlarmRinging.value = true
  playBeep()
  alarmInterval = setInterval(() => {
    playBeep()
  }, 1000)
}

const stopAlarm = () => {
  isAlarmRinging.value = false
  if (alarmInterval) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
}

const availableCategories = computed(() => {
  const cats = allExercises.value.map(item => item.category).filter(Boolean)
  return [...new Set(cats)]
})

const addExerciseRow = () => {
  exercises.value.push({ 
    exercise_name: '', 
    is_cardio: false, 
    sets: 3, 
    reps: 10, 
    rest_minutes: 1,
    rest_secs_part: 30,
    rest_seconds: 90, 
    has_rest: true,
    is_superset: false, 
    duration_minutes: null, 
    distance_km: null,
    enable_gps: false 
  })
}

const removeExerciseRow = (index) => {
  exercises.value.splice(index, 1)
}

const updateRestSeconds = (item) => {
  const mins = item.rest_minutes || 0
  const secs = item.rest_secs_part || 0
  item.rest_seconds = (mins * 60) + secs
}

const openExerciseModal = (index) => {
  activeRowIndex.value = index
  modalStep.value = 1
  selectedCategory.value = ''
  selectedGroup.value = ''
  searchQuery.value = ''
  isModalOpen.value = true
}

const selectBodyCategory = (cat) => {
  selectedCategory.value = cat
  selectedGroup.value = ''
  modalStep.value = 2
}

const selectMuscleGroup = (group) => {
  selectedGroup.value = group
}

const availableSubGroups = computed(() => {
  const matches = allExercises.value.filter(item => 
    String(item.category || '').trim().toLowerCase() === String(selectedCategory.value).trim().toLowerCase()
  )
  const groups = matches.map(item => String(item.muscle_group || '').trim()).filter(Boolean)
  const uniqueMap = new Map()
  groups.forEach(g => {
    const lower = g.toLowerCase()
    if (!uniqueMap.has(lower)) {
      uniqueMap.set(lower, g)
    }
  })
  return Array.from(uniqueMap.values())
})

const filteredExercises = computed(() => {
  return allExercises.value.filter(item => {
    const itemName = String(item.name || '').toLowerCase()
    const itemCat = String(item.category || '').trim().toLowerCase()
    const itemMuscle = String(item.muscle_group || '').trim().toLowerCase()

    const matchesCategory = itemCat === String(selectedCategory.value).trim().toLowerCase()
    const matchesSearch = itemName.includes(String(searchQuery.value || '').toLowerCase())
    const matchesSubGroup = selectedGroup.value ? itemMuscle === String(selectedGroup.value).trim().toLowerCase() : true

    return matchesCategory && matchesSearch && matchesSubGroup
  })
})

const pickExercise = (item) => {
  if (activeRowIndex.value !== null) {
    const catLower = String(item.category || '').toLowerCase()
    const nameLower = String(item.name || '').toLowerCase()
    const isCardio = catLower.includes('cardio') || nameLower.includes('fractionné') || nameLower.includes('course') || nameLower.includes('cardio')

    exercises.value[activeRowIndex.value].exercise_name = item.name
    exercises.value[activeRowIndex.value].is_cardio = isCardio
    if (isCardio) {
      exercises.value[activeRowIndex.value].sets = 0
      exercises.value[activeRowIndex.value].reps = 0
      exercises.value[activeRowIndex.value].duration_minutes = 15
    }
  }
  isModalOpen.value = false
}

const saveWorkout = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  let currentWorkoutId = workoutId.value

  if (isEditing.value) {
    const { error: updateError } = await supabase
      .from('workouts')
      .update({ title: workoutTitle.value })
      .eq('id', currentWorkoutId)

    if (updateError) return alert(updateError.message)

    await supabase
      .from('workout_exercises')
      .delete()
      .eq('workout_id', currentWorkoutId)

  } else {
    const { data: workout, error: wError } = await supabase
      .from('workouts')
      .insert([{ user_id: user.id, title: workoutTitle.value }])
      .select()
      .single()

    if (wError) return alert(wError.message)
    currentWorkoutId = workout.id
  }

  const exercisesToSave = exercises.value.map(ex => {
    const finalRest = (!ex.is_cardio || ex.has_rest) ? ((ex.rest_minutes || 0) * 60 + (ex.rest_secs_part || 0)) : 0
    return {
      workout_id: currentWorkoutId,
      exercise_name: ex.exercise_name || 'Exercice libre',
      sets: ex.is_cardio ? 0 : (ex.sets || 0),
      reps: ex.is_cardio ? 0 : (ex.reps || 0),
      rest_seconds: finalRest,
      is_superset: ex.is_superset || false,
      is_cardio: ex.is_cardio || false,
      duration_minutes: ex.is_cardio ? (ex.duration_minutes || 0) : null,
      distance_km: ex.is_cardio ? (ex.distance_km || 0) : null,
      enable_gps: ex.is_cardio ? (ex.enable_gps || false) : false,
      weight: 0
    }
  })

  const { error: eError } = await supabase.from('workout_exercises').insert(exercisesToSave)
  
  if (eError) {
    alert("Erreur : " + eError.message)
  } else {
    router.push('/dashboard')
  }
}

const exerciseBlocks = computed(() => {
  let blocks = []
  let currentBlock = null

  exercises.value.forEach((ex, idx) => {
    if (idx === 0 || !ex.is_superset) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = {
        isSupersetGroup: false,
        exercises: [{ item: ex, originalIndex: idx }]
      }
    } else {
      if (currentBlock) {
        currentBlock.isSupersetGroup = true
        currentBlock.exercises.push({ item: ex, originalIndex: idx })
      } else {
        currentBlock = {
          isSupersetGroup: false,
          exercises: [{ item: ex, originalIndex: idx }]
        }
      }
    }
  })
  if (currentBlock) blocks.push(currentBlock)

  return blocks
})
</script>