<template>
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 max-w-lg mx-auto space-y-5">
    <h3 class="font-bold text-lg text-gray-800">📅 Planifier une séance</h3>

    <!-- Choix des jours de la semaine (sélection multiple) -->
    <div>
      <label class="text-xs text-gray-500 font-bold uppercase block mb-2">Jours de la semaine</label>
      <div class="grid grid-cols-4 gap-2">
        <button 
          v-for="day in weekDays" 
          :key="day.id" 
          @click="toggleDay(day.id)"
          type="button"
          :class="selectedDays.includes(day.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'"
          class="py-2.5 px-2 rounded-xl text-xs font-bold border transition text-center"
        >
          {{ day.label }}
        </button>
      </div>
    </div>

    <!-- Choix de la date de départ (calendrier) -->
    <div>
      <label class="text-xs text-gray-500 font-bold uppercase block mb-2">Date de début</label>
      <input v-model="startDate" type="date" class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-indigo-500 shadow-inner" />
    </div>

    <!-- Choix du nombre de semaines (cycle) -->
    <div>
      <div class="flex justify-between items-center mb-1">
        <label class="text-xs text-gray-500 font-bold uppercase">Nombre de semaines (cycle)</label>
        <span class="text-xs font-extrabold text-indigo-600">{{ weeksCount }} semaines</span>
      </div>
      <input v-model.number="weeksCount" type="range" min="1" max="12" class="w-full accent-indigo-600 cursor-pointer" />
      <div class="flex justify-between text-xs text-gray-400 mt-1">
        <span>1 sem.</span>
        <span>6 sem.</span>
        <span>12 sem.</span>
      </div>
    </div>

    <button @click="handleSchedule" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition">
      Générer le planning
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps({
  workoutId: {
    type: String,
    required: true
  }
})

// Déclaration de l'événement émis vers le parent pour fermer la modale
const emit = defineEmits(['scheduled'])

const weekDays = [
  { id: 1, label: 'Lundi' },
  { id: 2, label: 'Mardi' },
  { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' },
  { id: 5, label: 'Vendredi' },
  { id: 6, label: 'Samedi' },
  { id: 7, label: 'Dimanche' }
]

const selectedDays = ref([1]) // Par défaut Lundi[cite: 1]
const startDate = ref(new Date().toISOString().split('T')[0]) // Date du jour par défaut
const weeksCount = ref(6)  // Par défaut 6 semaines[cite: 1]

// Gestion de la sélection multiple des jours
const toggleDay = (dayId) => {
  if (selectedDays.value.includes(dayId)) {
    selectedDays.value = selectedDays.value.filter(d => d !== dayId)
  } else {
    selectedDays.value.push(dayId)
  }
}

// Fonction de génération des dates récurrente pour chaque jour sélectionné
const generateRecurringDates = (daysList, startInputDate, count) => {
  let allDates = []
  const start = new Date(startInputDate)

  for (let w = 0; w < count; w++) {
    daysList.forEach(targetDay => {
      let current = new Date(start)
      current.setDate(current.getDate() + (w * 7))

      let currentDay = current.getDay()
      currentDay = currentDay === 0 ? 7 : currentDay

      let distance = targetDay - currentDay
      if (distance < 0) {
        distance += 7
      }
      current.setDate(current.getDate() + distance)

      allDates.push(current.toISOString().split('T')[0])
    })
  }

  return allDates
}

// Action d'enregistrement dans Supabase et fermeture de la modale
const handleSchedule = async () => {
  if (selectedDays.value.length === 0) {
    alert("Veuillez sélectionner au moins un jour d'entraînement.")
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const dates = generateRecurringDates(selectedDays.value, startDate.value, weeksCount.value)

  const recordsToInsert = dates.map(date => ({
    user_id: user.id,
    workout_id: props.workoutId,
    scheduled_date: date,
    status: 'pending'
  }))

  const { error } = await supabase
    .from('scheduled_workouts')
    .insert(recordsToInsert)

  if (error) {
    alert("Erreur : " + error.message)
  } else {
    alert(`✅ Planning généré avec succès (${dates.length} séances planifiées) !`)
    // On prévient le parent de fermer la modale
    emit('scheduled')
  }
}
</script>