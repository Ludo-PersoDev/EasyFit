<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-8 flex flex-col items-center">
    <div class="w-full max-w-3xl lg:max-w-5xl space-y-6">
      
      <!-- En-tête Desktop repensé avec le bouton IA -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
        <div>
          <h2 class="text-xl lg:text-2xl font-bold text-gray-800">📋 Mes Séances Enregistrées</h2>
          <p class="text-xs lg:text-sm text-gray-500 mt-1">Choisissez une séance pour la planifier, la modifier ou en créer une nouvelle.</p>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          <router-link to="/dashboard" class="text-xs lg:text-sm font-bold text-gray-600 hover:text-gray-800 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition">
            ← Retour
          </router-link>
          
          <!-- Bouton pour déclencher la modale IA -->
          <button 
            @click="isAiModalOpen = true" 
            class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs lg:text-sm shadow-md transition active:scale-95"
          >
            ✨ Générer avec l'IA
          </button>

          <router-link to="/workout" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs lg:text-sm shadow-md transition active:scale-95">
            + Créer une séance
          </router-link>
        </div>
      </div>

      <!-- Liste des modèles de séances en Grille sur PC -->
      <div>
        <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">
          Chargement de vos séances...
        </div>

        <div v-else-if="workouts.length === 0" class="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <p class="text-gray-400 text-sm mb-3">Aucune séance enregistrée pour le moment.</p>
          <router-link to="/workout" class="text-indigo-600 font-bold text-xs hover:underline">
            Créer votre premier modèle de séance →
          </router-link>
        </div>

        <!-- GRILLE DES SÉANCES SUR PC -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="workout in workouts" 
            :key="workout.id" 
            class="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col justify-between shadow-sm hover:border-indigo-300 hover:shadow-md transition group"
          >
            <div class="mb-4">
              <h3 class="font-bold text-base lg:text-lg text-gray-800 group-hover:text-indigo-600 transition">{{ workout.title }}</h3>
              <p class="text-xs text-gray-400 mt-1">Modèle d'entraînement prêt à être planifié</p>
            </div>

            <div class="flex items-center gap-2 justify-end pt-3 border-t border-gray-100 flex-wrap">
              <!-- Bouton Modifier le modèle -->
              <router-link 
                :to="`/workout?id=${workout.id}`" 
                class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3.5 py-2 rounded-xl text-xs transition border border-gray-200 active:scale-95"
              >
                ✏️ Modifier
              </router-link>

              <!-- Bouton Supprimer le modèle -->
              <button 
                @click="confirmDeleteWorkout(workout)" 
                class="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3.5 py-2 rounded-xl text-xs transition border border-red-200 active:scale-95"
              >
                🗑️ Supprimer
              </button>

              <!-- Bouton pour ouvrir la modale de planification -->
              <button 
                @click="openModal(workout.id)" 
                class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-2 rounded-xl text-xs transition border border-indigo-200 active:scale-95"
              >
                📅 Planifier
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Modale de confirmation de suppression -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
        <h3 class="font-bold text-base text-gray-800">Supprimer le modèle</h3>
        <p class="text-xs text-gray-500">
          Voulez-vous vraiment supprimer le modèle de séance <span class="font-bold text-gray-700">"{{ workoutToDelete?.title }}"</span> ? Cette action est irréversible.
        </p>

        <div class="space-y-2 pt-2">
          <button 
            @click="deleteWorkout" 
            class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
          >
            Oui, supprimer définitivement
          </button>
          <button 
            @click="isDeleteModalOpen = false" 
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Modale de planification classique -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden">
        <button 
          @click="isModalOpen = false" 
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 z-10"
        >
          ✕
        </button>
        <ScheduleForm :workoutId="selectedWorkoutId" @scheduled="isModalOpen = false" />
      </div>
    </div>

    <!-- Modale de génération de programme IA -->
    <AiWorkoutModal 
      :isOpen="isAiModalOpen" 
      @close="isAiModalOpen = false" 
      @saved="fetchWorkouts" 
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import ScheduleForm from '../components/ScheduleForm.vue'
import AiWorkoutModal from '../components/AiWorkoutModal.vue'

const workouts = ref([])
const loading = ref(true)

const isModalOpen = ref(false)
const selectedWorkoutId = ref(null)

const isDeleteModalOpen = ref(false)
const workoutToDelete = ref(null)

// État pour la modale IA
const isAiModalOpen = ref(false)

const fetchWorkouts = async () => {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!error && data) {
    workouts.value = data
  }
  loading.value = false
}

const openModal = (workoutId) => {
  selectedWorkoutId.value = workoutId
  isModalOpen.value = true
}

const confirmDeleteWorkout = (workout) => {
  workoutToDelete.value = workout
  isDeleteModalOpen.value = true
}

const deleteWorkout = async () => {
  if (!workoutToDelete.value) return

  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutToDelete.value.id)

  if (error) {
    alert("Erreur lors de la suppression : " + error.message)
  } else {
    isDeleteModalOpen.value = false
    workoutToDelete.value = null
    fetchWorkouts()
  }
}

onMounted(() => {
  fetchWorkouts()
})
</script>