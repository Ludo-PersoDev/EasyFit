<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-8 flex flex-col items-center">
    <div class="w-full max-w-3xl space-y-6">
      
      <!-- BANNIÈRE DE RAPPEL POIDS (Conditionnelle) -->
      <div v-if="showWeightReminder" class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🌱</span>
          <div>
            <h4 class="font-bold text-sm">Petit point sur ta progression ?</h4>
            <p class="text-xs text-indigo-100">Ça fait un petit moment que tu n'as pas mis à jour ton poids. Veux-tu l'enregistrer ?</p>
          </div>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <router-link to="/profile" class="flex-1 sm:flex-none bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-4 py-2 rounded-xl text-xs text-center transition">
            Mettre à jour ⚖️
          </router-link>
          <button @click="dismissWeightReminder" class="text-indigo-200 hover:text-white text-xs font-bold px-2 py-1">
            Plus tard
          </button>
        </div>
      </div>

      <!-- 1. BOUTONS D'ACTION PRINCIPAUX (Format Onglets incluant le Profil) -->
      <div class="grid grid-cols-3 gap-2 sm:gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <router-link 
          to="/workoutlist" 
          class="flex items-center justify-center gap-1.5 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm shadow-md transition active:scale-95 text-center truncate"
        >
          <span>🏋️‍♂️</span> <span class="truncate">Séances</span>
        </router-link>

        <router-link 
          to="/progress" 
          class="flex items-center justify-center gap-1.5 sm:gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm transition border border-indigo-200 text-center truncate"
        >
          <span>📈</span> <span class="truncate">Progrès</span>
        </router-link>

        <router-link 
          to="/profile" 
          class="flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm transition border border-slate-200 text-center truncate"
        >
          <span>⚙️</span> <span class="truncate">Profil</span>
        </router-link>
      </div>

      <!-- En-tête du Planning -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 text-center space-y-2">
        <h2 class="text-xl font-bold text-gray-800">⚡ Mon Planning de la semaine</h2>
        <p class="text-xs text-gray-500">Vos séances sur 7 jours glissants.</p>
        
        <!-- 3. NAVIGATION DES SEMAINES CENTRÉE -->
        <div class="flex items-center justify-center pt-2">
          <div class="inline-flex items-center bg-gray-100 rounded-xl p-1 shadow-inner">
            <button @click="changeWeek(-1)" class="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-white rounded-lg shadow-sm transition cursor-pointer">
              ← Précédente
            </button>
            <span class="px-4 text-xs font-bold text-gray-800 whitespace-nowrap">{{ weekRangeLabel }}</span>
            <button @click="changeWeek(1)" class="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-white rounded-lg shadow-sm transition cursor-pointer">
              Suivante →
            </button>
          </div>
        </div>
      </div>

      <!-- 2. LISTE DES 7 JOURS DE LA SEMAINE CENTRÉE & STRUCTURÉE -->
      <div class="space-y-3">
        <div 
          v-for="(day, index) in rollingDays" 
          :key="index"
          :class="[
            'bg-white p-4 rounded-2xl border transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm',
            day.isToday ? 'ring-2 ring-indigo-600 border-transparent' : 'border-gray-200'
          ]"
        >
          <div class="flex items-center gap-4 min-w-[150px]">
            <div :class="day.isToday ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'" class="w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shadow-inner">
              <span class="text-[10px] uppercase leading-none">{{ day.shortDayName }}</span>
              <span class="text-base leading-tight">{{ day.dayNumber }}</span>
            </div>
            <div>
              <p class="font-bold text-sm text-gray-800 capitalize">{{ day.fullDateName }}</p>
              <p v-if="day.isToday" class="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">Aujourd'hui</p>
            </div>
          </div>

          <div class="flex-1 w-full sm:w-auto space-y-2">
            <div v-if="day.workouts.length === 0" class="text-xs text-gray-400 italic py-2">
              Aucune séance prévue
            </div>

            <div 
              v-for="workout in day.workouts" 
              :key="workout.id"
              class="flex items-center justify-between p-3 rounded-xl border transition gap-2"
              :class="workout.status === 'completed' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-indigo-50/60 border-indigo-200 text-indigo-900'"
            >
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm">{{ workout.workouts?.title || 'Séance d\'entraînement' }}</span>
                <span v-if="workout.hasGps" class="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200" title="Suivi GPS actif ou configuré pour cette séance">
                  🛰️ GPS
                </span>
              </div>

              <div class="flex items-center gap-1.5">
                <button 
                  @click="openExecutionModal(workout.id)"
                  :class="workout.status === 'completed' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'"
                  class="text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
                >
                  {{ workout.status === 'completed' ? '✓ Modifier perfs' : '💪 Faire' }}
                </button>

                <button 
                  @click="confirmDeletion(workout)"
                  class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  title="Supprimer la séance"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Modale de suppression -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
        <h3 class="font-bold text-base text-gray-800">Supprimer la séance</h3>
        <p class="text-xs text-gray-500">
          Souhaitez-vous supprimer uniquement cette séance ou également toutes les occurrences futures de ce programme ?
        </p>

        <div class="space-y-2 pt-2">
          <button @click="deleteWorkout(false)" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">
            Uniquement cette occurrence
          </button>
          <button @click="deleteWorkout(true)" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer">
            Cette séance et toutes les futures
          </button>
          <button @click="isDeleteModalOpen = false" class="w-full text-gray-400 hover:text-gray-600 font-bold py-2 text-xs transition cursor-pointer">
            Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Modale d'exécution -->
    <div v-if="isExecutionModalOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div class="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-none sm:rounded-2xl flex flex-col p-5 shadow-2xl relative">
        
        <!-- En-tête + Minuteurs actifs -->
        <div class="flex justify-between items-center mb-4 border-b pb-3 flex-shrink-0 gap-2">
          <div>
            <h3 class="font-bold text-lg text-gray-800">🔥 Exécuter la séance</h3>
            <p class="text-xs text-gray-400">Validez vos efforts au fur et à mesure</p>
          </div>

          <div class="flex items-center gap-2">
            <div v-if="isEffortTimerActive" class="bg-amber-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md animate-pulse">
              <span class="text-[10px] font-bold uppercase">⚡ {{ isFreeRunMode ? 'Chrono libre :' : 'Effort :' }}</span>
              <span class="text-xs font-extrabold font-mono">
                {{ isFreeRunMode ? formatTime(effortElapsedSeconds) : formatTime(effortTimeRemaining) }}
              </span>
              <button @click="stopEffortTimer" class="ml-1 text-amber-100 hover:text-white text-xs font-bold cursor-pointer" title="Arrêter / Valider l'effort">✓ Arrêter</button>
            </div>

            <div v-if="isTimerActive" class="bg-indigo-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md animate-pulse">
              <span class="text-[10px] font-bold uppercase">⏳ Repos :</span>
              <span class="text-xs font-extrabold font-mono">{{ formatTime(restTimeRemaining) }}</span>
              <button @click="stopRestTimer" class="ml-1 text-indigo-200 hover:text-white text-xs font-bold cursor-pointer">✕</button>
            </div>
          </div>

          <button @click="closeExecutionModal" class="text-gray-400 hover:text-gray-600 font-bold text-lg w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 cursor-pointer">✕</button>
        </div>

        <!-- Chargement -->
        <div v-if="loadingModal" class="text-center py-12 text-gray-400 text-sm">
          Chargement des exercices...
        </div>

        <!-- Liste des blocs -->
        <div v-else class="overflow-y-auto flex-1 space-y-4 pr-1 py-1">
          <div 
            v-for="(block, bIndex) in executionBlocks" 
            :key="bIndex" 
            :class="block.isSupersetGroup ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200' : 'bg-gray-50 border-gray-200'"
            class="p-4 rounded-xl border space-y-4"
          >
            <div v-if="block.isSupersetGroup" class="flex items-center justify-between border-b border-indigo-200 pb-2">
              <span class="text-xs font-extrabold bg-indigo-600 text-white px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                ⚡ Superset enchaîné
              </span>
              <span class="text-[10px] font-bold text-indigo-500">Enchaîner les exercices sans repos intermédiaire</span>
            </div>

            <div v-for="(item, exIndex) in block.exercises" :key="exIndex" class="space-y-3 pt-2 first:pt-0">
              <div class="flex justify-between items-center">
                <span class="font-bold text-sm text-indigo-700">#{{ bIndex + 1 }}.{{ exIndex + 1 }} {{ item.exercise_name }}</span>
                
                <div v-if="exIndex === block.exercises.length - 1" class="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-2xs">
                  <span class="text-[9px] font-bold text-gray-400 uppercase">Repos:</span>
                  <input v-model.number="item.defaultRest" type="number" class="w-8 bg-transparent text-xs font-bold text-gray-700 text-center outline-none" />
                  <span class="text-[9px] text-gray-400">s</span>
                </div>
              </div>

              <!-- BOUTON DE DEMANDE DE SUGGESTION IA SOUS LE NOM DE CHAQUE EXERCICE -->
              <div v-if="!item.is_cardio">
                <button 
                  @click="fetchSingleAiSuggestion(item)" 
                  :disabled="item.isLoadingAi"
                  class="bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Générer une suggestion IA pour cet exercice"
                >
                  <span>✨</span> 
                  <span>{{ item.isLoadingAi ? 'Analyse en cours...' : 'Demander une suggestion IA' }}</span>
                </button>
              </div>

              <!-- CAS 1 : Exercice de Cardio -->
              <div v-if="item.is_cardio" class="bg-white p-3.5 rounded-xl border border-gray-200 space-y-3 shadow-2xs">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-indigo-600">🏃‍♂️ Cardio :</span>
                    <span v-if="item.duration_minutes" class="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-extrabold">
                      ⏱️ {{ item.duration_minutes }} min
                    </span>
                    <span v-else class="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-extrabold">
                      ⏱️ Sortie libre
                    </span>
                    <span v-if="item.distance_km_target" class="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-extrabold">
                      🎯 Cible : {{ item.distance_km_target }} km
                    </span>
                  </div>

                  <div class="flex items-center gap-2">
                    <button 
                      @click="startCardioEffort(block, item)"
                      class="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow transition active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      <span>⏱️ Lancer chrono</span>
                    </button>

                    <button 
                      @click="item.completed = !item.completed"
                      :class="item.completed ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'"
                      class="px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      {{ item.completed ? '✓ Fait' : 'Valider' }}
                    </button>
                  </div>
                </div>

                <div v-if="item.enableGps" class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <span>🛰️ Suivi GPS configuré pour cet exercice</span>
                  </div>
                  <span v-if="isEffortTimerActive && activeGpsWatchId !== null" class="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full animate-pulse">
                    En direct 📡
                  </span>
                </div>

                <div v-if="item.enableGps" class="grid grid-cols-3 gap-2 bg-slate-900 text-white p-3 rounded-xl text-center">
                  <div>
                    <p class="text-[9px] uppercase font-bold text-slate-400">Distance</p>
                    <p class="text-sm font-extrabold text-emerald-400 font-mono">{{ (item.distance_km || 0).toFixed(2) }} <span class="text-[10px]">km</span></p>
                  </div>
                  <div>
                    <p class="text-[9px] uppercase font-bold text-slate-400">Vitesse instantanée</p>
                    <p class="text-sm font-extrabold text-amber-400 font-mono">{{ (item.currentSpeed || 0).toFixed(1) }} <span class="text-[10px]">km/h</span></p>
                  </div>
                  <div>
                    <p class="text-[9px] uppercase font-bold text-slate-400">Allure moy.</p>
                    <p class="text-sm font-extrabold text-indigo-400 font-mono">{{ item.avgPace || '--' }} <span class="text-[10px]">/km</span></p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                  <div>
                    <label class="block text-[10px] font-bold text-gray-400 uppercase">Durée (min)</label>
                    <input v-model.number="item.duration_minutes" type="number" step="0.5" class="w-full bg-gray-50 border border-gray-200 py-1 px-2 rounded-lg text-center text-xs font-bold text-gray-800 outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-gray-400 uppercase">Distance (km)</label>
                    <input v-model.number="item.distance_km" type="number" step="0.1" class="w-full bg-gray-50 border border-gray-200 py-1 px-2 rounded-lg text-center text-xs font-bold text-gray-800 outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>

              <!-- CAS 2 : Exercice de Musculation classique -->
              <div v-else class="space-y-2">
                <!-- BANDEAU DE SUGGESTION IA -->
				<div v-if="item.showAiSuggestion && item.aiRecommendation" class="bg-purple-50 border border-purple-200 p-3 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
				  <div class="flex items-center gap-2 text-xs text-purple-900">
					<span>✨</span>
					<div>
					  <span class="font-bold">Conseil IA :</span> {{ item.aiRecommendation.text }}
					</div>
				  </div>
				  <div class="flex items-center gap-1.5 flex-shrink-0">
					<button @click="applyAiSuggestion(item)" class="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition active:scale-95 cursor-pointer">
					  Appliquer
					</button>
					<button @click="dismissAiSuggestion(item)" class="text-purple-400 hover:text-purple-700 font-bold px-2 py-1.5 text-xs transition cursor-pointer" title="Ignorer">
					  ✕
					</button>
				  </div>
				</div>

                <div class="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-gray-400 px-1">
                  <span class="col-span-2 text-center">Série</span>
                  <span class="col-span-4 text-center">Poids (kg)</span>
                  <span class="col-span-4 text-center">Répétitions</span>
                  <span class="col-span-2 text-center">Valider</span>
                </div>

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
                    <input v-model.number="set.weight" type="number" step="0.5" placeholder="–" class="w-full bg-gray-50 border border-gray-200 py-1.5 px-2 rounded-lg text-center text-xs font-bold text-gray-800 outline-none focus:border-indigo-500" />
                  </div>

                  <div class="col-span-4">
                    <input v-model.number="set.reps" type="number" placeholder="0" class="w-full bg-gray-50 border border-gray-200 py-1.5 px-2 rounded-lg text-center text-xs font-bold text-gray-800 outline-none focus:border-indigo-500" />
                  </div>

                  <div class="col-span-2 flex justify-center">
                    <button 
                      @click="completeSet(block, item, set)"
                      :class="set.completed ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:text-emerald-600 border border-gray-200'"
                      class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition active:scale-95 cursor-pointer"
                    >
                      ✓
                    </button>
                  </div>
                </div>
                
                <button @click="addSet(item)" class="w-full py-2 bg-white hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-xl border border-gray-200 transition cursor-pointer">
                  + Ajouter une série
                </button>
              </div>

            </div>

          </div>
        </div>

        <div class="pt-4 border-t mt-3 flex-shrink-0">
          <button @click="finishWorkout" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition text-sm cursor-pointer">
            Enregistrer et terminer 🎉
          </button>
        </div>

        <!-- BANDEAU / MODALE D'ALARME ACTIVE -->
        <div v-if="isAlarmRinging" class="absolute inset-x-0 bottom-0 bg-red-600 text-white p-4 rounded-b-2xl shadow-2xl flex items-center justify-between z-50 animate-bounce">
          <div class="flex items-center gap-3">
            <span class="text-2xl">⏰</span>
            <div>
              <p class="font-bold text-sm">{{ alarmMessage }}</p>
              <p class="text-xs text-red-100">Préparez la suite</p>
            </div>
          </div>
          <button @click="stopAlarm" class="bg-white text-red-600 font-extrabold px-4 py-2.5 rounded-xl shadow hover:bg-red-50 active:scale-95 transition text-xs uppercase tracking-wider cursor-pointer">
            🛑 Arrêter
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabase'

const scheduledWorkouts = ref([])
const weekOffset = ref(0)
const isExecutionModalOpen = ref(false)
const activeScheduledId = ref(null)
const executionBlocks = ref([])
const loadingModal = ref(false)
const activeWorkoutIdCache = ref(null)

// Gestion du rappel de poids sur le Dashboard
const showWeightReminder = ref(false)

// Minuteur de Repos
const restTimeRemaining = ref(0)
const isTimerActive = ref(false)
let timerInterval = null

// Minuteur / Chrono d'Effort (Cardio)
const effortTimeRemaining = ref(0)
const effortElapsedSeconds = ref(0)
const isEffortTimerActive = ref(false)
const isFreeRunMode = ref(false)
let effortInterval = null

// Alarme & Bips
const isAlarmRinging = ref(false)
const alarmMessage = ref("Temps de repos terminé !")
let alarmInterval = null

// Gestion du suivi GPS couplé au chrono d'effort
let activeGpsWatchId = null
let gpsRoutePoints = []
let lastGpsPosition = null

const calculateGpsDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const startGpsTrackingForExercise = (exercise) => {
  if (!('geolocation' in navigator)) {
    alert("La géolocalisation n'est pas supportée par votre appareil.")
    return
  }

  stopGpsTracking()
  gpsRoutePoints = []
  lastGpsPosition = null

  const targetDistanceKm = Number(exercise.distance_km_target) || 0
  let distanceAlertTriggered = false

  exercise.distance_km = 0
  exercise.currentSpeed = 0
  exercise.maxSpeed = 0
  exercise.avgPace = "--"

  activeGpsWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, speed, timestamp } = position.coords
      const now = timestamp || Date.now()

      let currentSpeedKmH = 0
      if (speed !== null && speed >= 0) {
        currentSpeedKmH = speed * 3.6
        exercise.currentSpeed = currentSpeedKmH
      }

      if (lastGpsPosition) {
        const dist = calculateGpsDistance(
          lastGpsPosition.latitude,
          lastGpsPosition.longitude,
          latitude,
          longitude
        )

        const timeDiffSeconds = (now - lastGpsPosition.time) / 1000
        const calculatedSpeedKmH = timeDiffSeconds > 0 ? (dist / (timeDiffSeconds / 3600)) : 0

        if (dist >= 0.001 && calculatedSpeedKmH < 45) {
          exercise.distance_km = Number(((exercise.distance_km || 0) + dist).toFixed(3))
          gpsRoutePoints.push({ lat: latitude, lng: longitude, time: now })
          
          if (currentSpeedKmH === 0 && calculatedSpeedKmH > 0) {
            exercise.currentSpeed = calculatedSpeedKmH
          }

          const activeSpeed = currentSpeedKmH > 0 ? currentSpeedKmH : calculatedSpeedKmH
          if (activeSpeed > (exercise.maxSpeed || 0) && activeSpeed < 50) {
            exercise.maxSpeed = Number(activeSpeed.toFixed(1))
          }

          if (targetDistanceKm > 0 && exercise.distance_km >= targetDistanceKm && !distanceAlertTriggered) {
            distanceAlertTriggered = true
            triggerAlarm(`Objectif de ${targetDistanceKm} kilomètres atteint ! Continuez sur votre lancée !`)
            exercise.completed = true
          }

          if (exercise.distance_km > 0) {
            const totalMinutesElapsed = isFreeRunMode.value 
              ? (effortElapsedSeconds.value / 60) 
              : (((exercise.duration_minutes || 0) * 60 - effortTimeRemaining.value) / 60)

            if (totalMinutesElapsed > 0) {
              const paceDecimal = totalMinutesElapsed / exercise.distance_km
              const paceMin = Math.floor(paceDecimal)
              const paceSec = Math.round((paceDecimal - paceMin) * 60)
              exercise.avgPace = `${paceMin}'${paceSec.toString().padStart(2, '0')}`
            }
          }
          lastGpsPosition = { latitude, longitude, time: now }
        }
      } else {
        lastGpsPosition = { latitude, longitude, time: now }
        gpsRoutePoints.push({ lat: latitude, lng: longitude, time: now })
      }
    },
    (error) => {
      console.error("Erreur GPS :", error)
    },
    { 
      enableHighAccuracy: true, 
      maximumAge: 0,
      timeout: 3000
    }
  )
}

const stopGpsTracking = () => {
  if (activeGpsWatchId !== null) {
    navigator.geolocation.clearWatch(activeGpsWatchId)
    activeGpsWatchId = null
  }
  lastGpsPosition = null
}

const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4)

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.start()
    oscillator.stop(audioCtx.currentTime + 0.4)
  } catch (e) {}
}

const triggerAlarm = (msg = "Temps de repos terminé !") => {
  alarmMessage.value = msg
  isAlarmRinging.value = true
  
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(msg)
      utterance.lang = 'fr-FR'
      window.speechSynthesis.speak(utterance)
    }
  } catch (e) {}

  playBeep()

  if (alarmInterval) clearInterval(alarmInterval)
  alarmInterval = setInterval(() => {
    playBeep()
  }, 1200)
}

const stopAlarm = () => {
  isAlarmRinging.value = false
  if (alarmInterval) {
    clearInterval(alarmInterval)
    alarmInterval = null
  }
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  } catch (e) {}
}

const startCardioEffort = (block, exercise) => {
  exercise.completed = false
  const effortMinutes = Number(exercise.duration_minutes) || 0
  
  if (exercise.enableGps) {
    startGpsTrackingForExercise(exercise)
  }

  if (effortInterval) {
    clearInterval(effortInterval)
    effortInterval = null
  }
  stopAlarm()

  isEffortTimerActive.value = true

  if (effortMinutes <= 0) {
    isFreeRunMode.value = true
    effortElapsedSeconds.value = 0
    const startTime = Date.now()

    effortInterval = setInterval(() => {
      const secondsElapsed = Math.floor((Date.now() - startTime) / 1000)
      effortElapsedSeconds.value = secondsElapsed
      exercise.duration_minutes = Number((secondsElapsed / 60).toFixed(1))
    }, 200)

  } else {
    isFreeRunMode.value = false
    const effortSeconds = effortMinutes * 60
    const targetTime = Date.now() + effortSeconds * 1000
    effortTimeRemaining.value = effortSeconds

    effortInterval = setInterval(() => {
      const now = Date.now()
      const remainingMs = targetTime - now
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000))
      
      effortTimeRemaining.value = remainingSec

      if (remainingSec <= 0 || remainingMs <= 0) {
        clearInterval(effortInterval)
        effortInterval = null
        isEffortTimerActive.value = false
        
        if (exercise.enableGps) {
          stopGpsTracking()
        }

        triggerAlarm("Effort terminé ! C'est l'heure du repos.")
        exercise.completed = true

        const exerciseIndex = block.exercises.indexOf(exercise)
        const isLastExerciseInBlock = exerciseIndex === block.exercises.length - 1
        if (isLastExerciseInBlock && exercise.defaultRest > 0) {
          startRestTimer(exercise.defaultRest)
        }
      }
    }, 200)
  }
}

const stopEffortTimer = () => {
  if (effortInterval) {
    clearInterval(effortInterval)
    effortInterval = null
  }
  effortTimeRemaining.value = 0
  effortElapsedSeconds.value = 0
  isEffortTimerActive.value = false
  isFreeRunMode.value = false
  stopGpsTracking()
  stopAlarm()
}

const startRestTimer = (seconds) => {
  const safeSeconds = Number(seconds) > 0 ? Number(seconds) : 90
  
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  const targetTime = Date.now() + safeSeconds * 1000
  restTimeRemaining.value = safeSeconds
  isTimerActive.value = true

  timerInterval = setInterval(() => {
    const now = Date.now()
    const remainingMs = targetTime - now
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000))
    
    restTimeRemaining.value = remainingSec

    if (remainingSec <= 0 || remainingMs <= 0) {
      clearInterval(timerInterval)
      timerInterval = null
      isTimerActive.value = false
      triggerAlarm("Repos terminé, c'est reparti !")
    }
  }, 200)
}

const stopRestTimer = () => {
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

const closeExecutionModal = () => {
  stopGpsTracking()
  stopRestTimer()
  stopEffortTimer()
  isExecutionModalOpen.value = false
}

const isDeleteModalOpen = ref(false)
const workoutToDelete = ref(null)

const checkWeightReminder = async (userId) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('track_weight')
    .eq('id', userId)
    .single()

  if (!profile || !profile.track_weight) return

  const { data: measurements } = await supabase
    .from('body_measurements')
    .select('recorded_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(1)

  if (!measurements || measurements.length === 0) {
    showWeightReminder.value = true
  } else {
    const lastDate = new Date(measurements[0].recorded_at)
    const now = new Date()
    const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24)
    if (diffDays > 30) {
      showWeightReminder.value = true
    }
  }
}

const dismissWeightReminder = () => {
  showWeightReminder.value = false
}

const fetchDashboardData = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await checkWeightReminder(user.id)

  const { data: schedData, error } = await supabase
    .from('scheduled_workouts')
    .select(`id, workout_id, scheduled_date, status, workouts ( title )`)
    .eq('user_id', user.id)

  if (error || !schedData) return

  const workoutIds = [...new Set(schedData.map(s => s.workout_id))]
  
  let cardioMap = {}
  if (workoutIds.length > 0) {
    const { data: exData } = await supabase
      .from('workout_exercises')
      .select('workout_id, is_cardio, duration_minutes')
      .in('workout_id', workoutIds)

    if (exData) {
      exData.forEach(ex => {
        if (ex.is_cardio || (ex.duration_minutes !== null && ex.duration_minutes > 0)) {
          cardioMap[ex.workout_id] = true
        }
      })
    }
  }

  scheduledWorkouts.value = schedData.map(s => ({
    ...s,
    hasGps: !!cardioMap[s.workout_id]
  }))
}

const changeWeek = (direction) => {
  weekOffset.value += direction
}

const rollingDays = computed(() => {
  const days = []
  const today = new Date()
  const currentDayOfWeek = today.getDay()
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() + distanceToMonday + (weekOffset.value * 7))
  const todayStr = today.toISOString().split('T')[0]

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const dayNum = String(d.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${dayNum}`

    const shortDayName = d.toLocaleDateString('fr-FR', { weekday: 'short' })
    const fullDateName = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    const dayWorkouts = scheduledWorkouts.value.filter(w => w.scheduled_date === dateStr)

    days.push({
      dateStr,
      dayNumber: d.getDate(),
      shortDayName,
      fullDateName,
      isToday: dateStr === todayStr,
      workouts: dayWorkouts
    })
  }
  return days
})

const weekRangeLabel = computed(() => {
  if (rollingDays.value.length === 0) return ''
  const first = rollingDays.value[0]
  const last = rollingDays.value[6]
  return `${first.dayNumber} au ${last.dayNumber} ${new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
})

// Fonction pour récupérer la suggestion IA spécifique à un exercice donné depuis le bouton sous son nom
const fetchSingleAiSuggestion = async (item) => {
  item.isLoadingAi = true

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    // On cible bien EXCLUSIVEMENT l'historique de cet exercice sur les 4 dernières semaines
    const { data: historyData } = await supabase
      .from('workout_set_logs')
      .select('weight, reps, set_number, created_at')
      .eq('user_id', user.id)
      .eq('exercise_name', item.exercise_name)
      .eq('is_cardio', false)
      .gte('created_at', fourWeeksAgo.toISOString())
      .order('created_at', { ascending: true })

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) return

    // Utilisation d'un modèle flash standard stable pour l'API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`
    
    const prompt = `
      Tu es un coach sportif expert. Analyse l'historique des 4 dernières semaines pour CET EXERCICE UNIQUEMENT (${item.exercise_name}).
      Détermine s'il s'agit d'une progression ou d'une contre-performance, et propose la meilleure surcharge progressive (par le poids ou les répétitions).
      
      HISTORIQUE DE L'EXERCICE : ${JSON.stringify(historyData || [])}
      EXERCICE ACTUEL : ${JSON.stringify({ name: item.exercise_name, sets: item.setsList.length, currentWeight: item.setsList[0]?.weight })}

      Renvoie un objet JSON STRICT avec cette structure exacte :
      { "weight": 62.5, "reps": 10, "text": "Analyse de tes perfs : passe à 62.5kg ou valide tes 10 reps." }
    `

    const aiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    })

    if (aiRes.status === 429) {
      alert("Quota Gemini atteint (429). Patiente quelques secondes.")
      return
    }

    const aiData = await aiRes.json()

    if (aiData.candidates && aiData.candidates[0]) {
      let rawText = aiData.candidates[0].content.parts[0].text.trim()
      rawText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "")
      const rec = JSON.parse(rawText)
      
      item.aiRecommendation = {
        weight: Number(rec.weight) || (item.setsList[0]?.weight || 0),
        reps: Number(rec.reps) || 10,
        text: rec.text
      }
      item.showAiSuggestion = true
    }
  } catch (err) {
    console.error("Erreur suggestion IA :", err)
  } finally {
    item.isLoadingAi = false
  }
}

const openExecutionModal = async (scheduledId) => {
  activeScheduledId.value = scheduledId
  isExecutionModalOpen.value = true
  loadingModal.value = true
  executionBlocks.value = []
  activeWorkoutIdCache.value = null

  try {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: scheduledData, error: schedError } = await supabase
      .from('scheduled_workouts')
      .select('workout_id')
      .eq('id', scheduledId)
      .single()

    if (schedError) throw schedError

    if (scheduledData) {
      activeWorkoutIdCache.value = scheduledData.workout_id

      const { data: existingLogs } = await supabase
        .from('workout_set_logs')
        .select('*')
        .eq('scheduled_workout_id', scheduledId)

      // Si la séance a déjà été validée/enregistrée pour cette occurrence exacte, on recharge ses propres logs
      if (existingLogs && existingLogs.length > 0) {
        const map = {}
        existingLogs.forEach(log => {
          if (!map[log.exercise_name]) {
            map[log.exercise_name] = {
              exercise_name: log.exercise_name,
              defaultRest: 90,
              is_cardio: log.is_cardio || false,
              duration_minutes: log.duration_minutes || 0,
              distance_km: log.distance_km || 0,
              distance_km_target: log.distance_km || 0,
              enableGps: true,
              currentSpeed: 0,
              maxSpeed: log.max_speed || 0,
              avgPace: log.avg_pace || '--',
              setsList: [],
              completed: true
            }
          }
          if (!log.is_cardio && (log.weight > 0 || log.set_number > 0)) {
            map[log.exercise_name].setsList.push({
              weight: log.weight > 0 ? log.weight : null,
              reps: log.reps,
              completed: true
            })
          }
        })
        
        executionBlocks.value = Object.values(map).map(ex => ({
          isSupersetGroup: false,
          exercises: [ex]
        }))
      } else {
        // Sinon, c'est une nouvelle exécution : on va chercher les exercices du modèle
        const { data: exercisesData, error: exError } = await supabase
          .from('workout_exercises')
          .select('*')
          .eq('workout_id', scheduledData.workout_id)

        if (exError) throw exError

        if (exercisesData) {
          let lastLogsMap = {}
          const exerciseNames = exercisesData.filter(ex => !ex.is_cardio && !(ex.duration_minutes > 0)).map(ex => ex.exercise_name)

          if (exerciseNames.length > 0 && user) {
            const fourWeeksAgo = new Date()
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

            const { data: historyData } = await supabase
              .from('workout_set_logs')
              .select('weight, reps, set_number, created_at, exercise_name')
              .eq('user_id', user.id)
              .in('exercise_name', exerciseNames)
              .eq('is_cardio', false)
              .gte('created_at', fourWeeksAgo.toISOString())
              .order('created_at', { ascending: true })

            if (historyData && historyData.length > 0) {
              const groupedByEx = {}
              historyData.forEach(log => {
                if (!groupedByEx[log.exercise_name]) {
                  groupedByEx[log.exercise_name] = []
                }
                groupedByEx[log.exercise_name].push(log)
              })

              Object.keys(groupedByEx).forEach(exName => {
                const logs = groupedByEx[exName]
                const maxDate = logs.reduce((latest, l) => l.created_at > latest ? l.created_at : latest, logs[0].created_at)
                const lastSessionLogs = logs.filter(l => l.created_at === maxDate)
                lastLogsMap[exName] = lastSessionLogs.sort((a, b) => a.set_number - b.set_number)
              })
            }
          }

          const parsedExercises = exercisesData.map((ex) => {
            const isCardio = Boolean(ex.is_cardio || (ex.duration_minutes !== null && ex.duration_minutes > 0))
            let setsArray = []
            let aiRecommendation = null

            if (!isCardio) {
              const cleanExName = ex.exercise_name ? ex.exercise_name.trim().toLowerCase() : ""
              const matchedLastLogKey = Object.keys(lastLogsMap).find(
                k => k.trim().toLowerCase() === cleanExName
              )

              if (matchedLastLogKey && lastLogsMap[matchedLastLogKey].length > 0) {
                const lastSets = lastLogsMap[matchedLastLogKey]
                
                if (lastSets.length > 0) {
                  const lastSet = lastSets[lastSets.length - 1]
                  const suggestedWeight = lastSet.weight > 0 ? lastSet.weight : (ex.weight || 0)
                  const suggestedReps = (lastSet.reps || 10) + 1

                  aiRecommendation = {
                    weight: suggestedWeight,
                    reps: suggestedReps,
                    text: `Basé sur la dernière séance : tenter ${suggestedWeight}kg x ${suggestedReps} reps`
                  }
                }

                lastSets.forEach(s => {
                  setsArray.push({
                    weight: s.weight > 0 ? Number(s.weight) : null,
                    reps: Number(s.reps) || (ex.reps || 10),
                    completed: false
                  })
                })
              } else {
                if (ex.weight > 0) {
                  aiRecommendation = {
                    weight: Number(ex.weight),
                    reps: ex.reps || 10,
                    text: `Objectif de base : ${ex.weight} kg x ${ex.reps || 10} reps`
                  }
                }

                const totalSets = (ex.sets !== null && ex.sets !== undefined) ? Number(ex.sets) : 3
                for (let i = 0; i < totalSets; i++) {
                  setsArray.push({
                    weight: ex.weight > 0 ? Number(ex.weight) : null,
                    reps: ex.reps || 10,
                    completed: false
                  })
                }
              }
            } else {
              setsArray = []
            }

            const initialDistance = ex.distance_km ? Number(ex.distance_km) : 0

            return {
              exercise_name: ex.exercise_name,
              defaultRest: (ex.rest_seconds && !isNaN(ex.rest_seconds)) ? Number(ex.rest_seconds) : 90,
              is_cardio: isCardio,
              duration_minutes: ex.duration_minutes ? Number(ex.duration_minutes) : 0,
              distance_km: initialDistance,
              distance_km_target: initialDistance,
              enableGps: true,
              currentSpeed: 0,
              maxSpeed: 0,
              avgPace: '--',
              is_superset: Boolean(ex.is_superset),
              setsList: setsArray,
              aiRecommendation: aiRecommendation,
              showAiSuggestion: false,
              isLoadingAi: false,
              completed: false
            }
          })

          let blocks = []
          let currentBlock = null

          parsedExercises.forEach((ex, idx) => {
            if (idx === 0 || !ex.is_superset) {
              if (currentBlock) blocks.push(currentBlock)
              currentBlock = {
                isSupersetGroup: false,
                exercises: [ex]
              }
            } else {
              if (currentBlock) {
                currentBlock.isSupersetGroup = true
                currentBlock.exercises.push(ex)
              } else {
                currentBlock = {
                  isSupersetGroup: false,
                  exercises: [ex]
                }
              }
            }
          })
          if (currentBlock) blocks.push(currentBlock)

          executionBlocks.value = blocks
        }
      }
    }
  } catch (err) {
    console.error("Erreur critique :", err)
  } finally {
    loadingModal.value = false
  }
}

const applyAiSuggestion = (item) => {
  if (!item.aiRecommendation) return
  item.setsList.forEach(set => {
    set.weight = item.aiRecommendation.weight
    set.reps = item.aiRecommendation.reps
  })
  item.showAiSuggestion = false
}

const dismissAiSuggestion = (item) => {
  item.showAiSuggestion = false
}

const completeSet = (block, exercise, set) => {
  set.completed = !set.completed
  if (set.completed) {
    const exerciseIndex = block.exercises.indexOf(exercise)
    const isLastExerciseInBlock = exerciseIndex === block.exercises.length - 1
    if (isLastExerciseInBlock) {
      startRestTimer(exercise.defaultRest || 90)
    }
  }
}

const addSet = (exercise) => {
  const last = exercise.setsList[exercise.setsList.length - 1]
  exercise.setsList.push({
    weight: last ? last.weight : null,
    reps: last ? last.reps : 10,
    completed: false
  })
}

const finishWorkout = async () => {
  stopGpsTracking()
  stopRestTimer()
  stopEffortTimer()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('workout_set_logs')
    .delete()
    .eq('scheduled_workout_id', activeScheduledId.value)

  let logsToInsert = []
  executionBlocks.value.forEach(block => {
    block.exercises.forEach(item => {
      if (!item.is_cardio && item.setsList.length > 0) {
        item.setsList.forEach((s, index) => {
          logsToInsert.push({
            user_id: user.id,
            scheduled_workout_id: activeScheduledId.value,
            exercise_name: item.exercise_name,
            set_number: index + 1,
            reps: s.reps,
            weight: s.weight || 0,
            is_cardio: false,
            duration_minutes: null,
            distance_km: null,
            gps_path: null
          })
        })
      } else {
        const finalDist = Number(item.distance_km) || 0
        const finalDuration = Number(item.duration_minutes) || 0

        logsToInsert.push({
          user_id: user.id,
          scheduled_workout_id: activeScheduledId.value,
          exercise_name: item.exercise_name,
          set_number: 1,
          reps: 0,
          weight: 0,
          is_cardio: true,
          duration_minutes: finalDuration,
          distance_km: finalDist,
          gps_path: gpsRoutePoints.length > 0 ? gpsRoutePoints : null,
          avg_speed: (finalDist > 0 && finalDuration > 0) 
            ? Number((finalDist / (finalDuration / 60)).toFixed(1)) 
            : 0,
          max_speed: item.maxSpeed || 0,
          avg_pace: item.avgPace || '--'
        })
      }
    })
  })

  const { error: insertError } = await supabase
    .from('workout_set_logs')
    .insert(logsToInsert)

  if (insertError) {
    alert("Erreur lors de l'enregistrement : " + insertError.message)
    return
  }

  const { error: updateError } = await supabase
    .from('scheduled_workouts')
    .update({ status: 'completed' })
    .eq('id', activeScheduledId.value)

  if (!updateError) {
    isExecutionModalOpen.value = false
    fetchDashboardData()
  }
}

const confirmDeletion = (workout) => {
  workoutToDelete.value = workout
  isDeleteModalOpen.value = true
}

const deleteWorkout = async (deleteAllFuture) => {
  if (!workoutToDelete.value) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  let query = supabase.from('scheduled_workouts').delete().eq('user_id', user.id)

  if (deleteAllFuture) {
    query = query
      .eq('workout_id', workoutToDelete.value.workout_id)
      .gte('scheduled_date', workoutToDelete.value.scheduled_date)
  } else {
    query = query.eq('id', workoutToDelete.value.id)
  }

  const { error } = await query

  if (error) {
    alert("Erreur lors de la suppression : " + error.message)
  } else {
    isDeleteModalOpen.value = false
    workoutToDelete.value = null
    fetchDashboardData()
  }
}

onMounted(() => {
  fetchDashboardData()
})

onUnmounted(() => {
  stopGpsTracking()
  stopRestTimer()
  stopEffortTimer()
  stopAlarm()
})
</script>