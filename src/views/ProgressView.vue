<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-8 flex flex-col items-center">
    <div class="w-full max-w-3xl space-y-6">
      
      <!-- En-tête -->
      <div class="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 class="text-xl font-bold text-gray-800">📈 Suivi des Performances & Progrès</h2>
          <p class="text-xs text-gray-500 mt-0.5">Analysez vos records, votre tonnage et vos sessions cardio.</p>
        </div>
        <router-link to="/dashboard" class="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-2 bg-gray-100 rounded-xl transition">
          ← Tableau de bord
        </router-link>
      </div>

      <!-- Filtres de vue (Par Exercice ou Par Séance) -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div class="flex gap-2 border-b pb-3">
          <button 
            @click="filterMode = 'exercise'; resetSelection()"
            :class="filterMode === 'exercise' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            class="flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            🔍 Par Exercice
          </button>
          <button 
            @click="filterMode = 'workout'; resetSelection()"
            :class="filterMode === 'workout' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            class="flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            📋 Par Séance globale
          </button>
        </div>

        <!-- Sélection de la cible -->
        <div>
          <label class="text-xs text-gray-500 font-bold uppercase block mb-1.5">
            {{ filterMode === 'exercise' ? 'Sélectionner un exercice' : 'Sélectionner une séance' }}
          </label>
          <select 
            v-model="selectedTarget" 
            @change="fetchHistory"
            class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-indigo-500"
          >
            <option value="" disabled>-- Choisir dans la liste --</option>
            <option v-for="item in targetList" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Indicateurs clés dynamiques -->
      <div v-if="selectedTarget && historyData.length > 0" class="grid grid-cols-2 gap-4">
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <span class="text-[10px] uppercase font-bold text-gray-400">
            {{ filterMode === 'exercise' ? (isCardioExercise ? '📍 Distance Max' : '🏆 1RM Estimé (Max)') : (isCardioGlobalSession ? '🗺️ Distance Max (Séance)' : '🏋️‍♂️ Tonnage Max (Séance)') }}
          </span>
          <span class="text-2xl font-extrabold text-indigo-600 mt-1">
            {{ filterMode === 'exercise' ? (isCardioExercise ? maxCardioDistance + ' km' : estimated1RM + ' kg') : (isCardioGlobalSession ? maxCardioGlobalDistance + ' km' : maxVolumeGlobal + ' kg') }}
          </span>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <span class="text-[10px] uppercase font-bold text-gray-400">📊 Séances enregistrées</span>
          <span class="text-2xl font-extrabold text-gray-800 mt-1">{{ historyData.length }}</span>
        </div>
      </div>

      <!-- 📊 GRAPHIQUE DE TENDANCE SVG (Intégré sans dépendance) -->
      <div v-if="selectedTarget && chartPoints.length > 1" class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-3">
        <div class="flex justify-between items-center">
          <h3 class="font-bold text-base text-gray-800">📊 Courbe de Progression</h3>
          <span class="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2.5 py-1 rounded-lg">
            {{ filterMode === 'exercise' ? (isCardioExercise ? 'Distance (km)' : '1RM Estimé (kg)') : (isCardioGlobalSession ? 'Distance (km)' : 'Tonnage (kg)') }}
          </span>
        </div>

        <div class="w-full h-48 relative pt-2">
          <svg class="w-full h-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
            <!-- Lignes horizontales de repère en arrière-plan -->
            <line x1="0" y1="20" x2="500" y2="20" stroke="#f3f4f6" stroke-width="1" />
            <line x1="0" y1="70" x2="500" y2="70" stroke="#f3f4f6" stroke-width="1" />
            <line x1="0" y1="120" x2="500" y2="120" stroke="#f3f4f6" stroke-width="1" />

            <!-- Aire sous la courbe (dégradé subtil) -->
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.0" />
              </linearGradient>
            </defs>
            <path :d="chartAreaPath" fill="url(#chartGradient)" />

            <!-- Ligne de tendance principale -->
            <path :d="chartLinePath" fill="none" stroke="#4f46e5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

            <!-- Points interactifs -->
            <g v-for="(pt, idx) in chartPoints" :key="idx">
              <circle 
                :cx="pt.x" 
                :cy="pt.y" 
                r="4.5" 
                class="fill-white stroke-indigo-600 stroke-[3] transition-all duration-200 hover:scale-125 cursor-pointer"
              />
            </g>
          </svg>

          <!-- Infobulles / Valeurs sur l'axe horizontal (Dates min & max) -->
          <div class="flex justify-between items-center text-[10px] font-bold text-gray-400 mt-2">
            <span>{{ chartMinDate }}</span>
            <span>{{ chartMaxDate }}</span>
          </div>
        </div>
      </div>

      <!-- Historique et Progression sous forme de Tuiles -->
      <div v-if="selectedTarget" class="space-y-4">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <h3 class="font-bold text-base text-gray-800 mb-3">
            📅 Historique & Évolution
          </h3>
          
          <div v-if="loadingHistory" class="text-center py-8 text-gray-400 text-sm">
            Chargement de l'historique...
          </div>

          <div v-else-if="historyData.length === 0" class="text-center py-8 text-gray-400 text-sm italic">
            Aucune donnée enregistrée pour cette sélection.
          </div>

          <!-- Liste des sessions (Tuiles condensées) -->
          <div v-else class="space-y-3">
            <div 
              v-for="(session) in historyData" 
              :key="session.groupKey"
              class="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden transition"
            >
              <!-- En-tête de la tuile (Toujours visible) -->
              <div 
                @click="session.expanded = !session.expanded"
                class="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100/60 transition"
              >
                <div class="flex items-center gap-3">
                  <span class="font-bold text-xs text-indigo-600 uppercase">📅 {{ formatDate(session.date) }}</span>
                  <span 
                    v-if="session.evolution !== null" 
                    :class="session.evolution >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
                    class="text-[10px] font-extrabold px-2 py-0.5 rounded-md"
                  >
                    {{ session.evolution >= 0 ? '+' : '' }}{{ session.evolution }}% vs préc.
                  </span>
                </div>

                <div class="flex items-center gap-3">
                  <span class="text-xs font-bold text-gray-700">
                    {{ filterMode === 'exercise' 
                        ? (session.isCardio ? 'Distance : ' + session.distance_km + ' km' : 'Max : ' + session.maxWeight + ' kg (' + session.sets.length + ' séries)') 
                        : (session.isPureCardio ? 'Cardio : ' + session.distance_km + ' km' : 'Tonnage : ' + session.totalVolume + ' kg') }}
                  </span>
                  <span class="text-xs text-gray-400 font-bold transition-transform duration-200" :class="{ 'rotate-180': session.expanded }">
                    ▼
                  </span>
                </div>
              </div>

              <!-- Contenu détaillé (Dépliable) -->
              <div v-if="session.expanded" class="p-4 bg-white border-t border-gray-100 space-y-3">
                
                <!-- CAS 1 : Exercice Cardio -->
                <div v-if="filterMode === 'exercise' && session.isCardio" class="space-y-3">
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span class="text-[10px] uppercase font-bold text-gray-400 block">⏱️ Temps</span>
                      <span class="text-xs font-bold text-gray-800">{{ session.duration_minutes ? session.duration_minutes + ' min' : '--' }}</span>
                    </div>
                    <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span class="text-[10px] uppercase font-bold text-gray-400 block">⚡ Vit. Moy.</span>
                      <span class="text-xs font-bold text-gray-800">{{ session.avg_speed || '0' }} km/h</span>
                    </div>
                    <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span class="text-[10px] uppercase font-bold text-gray-400 block">🏃‍♂️ Allure Moy.</span>
                      <span class="text-xs font-bold text-gray-800">{{ session.avg_pace || '--' }}</span>
                    </div>
                    <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span class="text-[10px] uppercase font-bold text-gray-400 block">🚀 Vit. Max</span>
                      <span class="text-xs font-bold text-gray-800">{{ session.max_speed || '0' }} km/h</span>
                    </div>
                  </div>

                  <div class="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-medium">
                    <div class="flex items-center gap-2">
                      <span>🗺️ Tracé GPS enregistré</span>
                      <span class="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {{ session.gpsPointsCount || 0 }} points
                      </span>
                    </div>
                    <button @click.stop="openMapModal(session)" class="text-indigo-600 hover:underline font-bold text-xs cursor-pointer">
                      Voir la carte →
                    </button>
                  </div>
                </div>

                <!-- CAS 2 : Exercice de Musculation classique -->
                <div v-else-if="filterMode === 'exercise'" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div v-for="set in session.sets" :key="set.id || set.set_number" class="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-center shadow-2xs">
                    <span class="text-[10px] uppercase font-bold text-gray-400 block">Série {{ set.set_number }}</span>
                    <span class="text-xs font-bold text-gray-800">{{ set.weight }} kg × {{ set.reps }} reps</span>
                  </div>
                </div>

                <!-- CAS 3 : Séance Globale (Mixte ou Muscu/Cardio) -->
                <div v-else class="space-y-3">
                  <div v-if="session.sets.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div v-for="set in session.sets" :key="set.id || set.set_number" class="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-center shadow-2xs">
                      <span class="text-[10px] uppercase font-bold text-gray-400 block">Série {{ set.set_number }}</span>
                      <span class="text-xs font-bold text-gray-800">{{ set.weight }} kg × {{ set.reps }} reps</span>
                      <span class="text-[10px] text-indigo-500 block truncate font-medium">{{ set.exercise_name }}</span>
                    </div>
                  </div>

                  <div v-if="session.cardioBlocks && session.cardioBlocks.length > 0" class="space-y-2">
                    <div v-for="cardio in session.cardioBlocks" :key="cardio.id" class="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                      <div class="flex justify-between items-center text-xs font-bold text-gray-700 border-b pb-1">
                        <span>🏃‍♂️ {{ cardio.exercise_name || 'Cardio' }}</span>
                        <div class="flex items-center gap-3">
                          <span class="text-indigo-600">{{ cardio.distance_km !== undefined ? Number(cardio.distance_km).toFixed(3) : 0 }} km</span>
                          <button @click.stop="openMapModal(cardio)" class="text-indigo-600 hover:underline font-bold text-[11px] cursor-pointer">
                            Voir la carte →
                          </button>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div>
                          <span class="text-[9px] uppercase font-bold text-gray-400 block">⏱️ Temps</span>
                          <span class="text-xs font-bold text-gray-800">{{ cardio.duration_minutes ? cardio.duration_minutes + ' min' : '--' }}</span>
                        </div>
                        <div>
                          <span class="text-[9px] uppercase font-bold text-gray-400 block">⚡ Vit. Moy</span>
                          <span class="text-xs font-bold text-gray-800">{{ cardio.avg_speed || 0 }} km/h</span>
                        </div>
                        <div>
                          <span class="text-[9px] uppercase font-bold text-gray-400 block">🏃‍♂️ Allure</span>
                          <span class="text-xs font-bold text-gray-800">{{ cardio.avg_pace || '--' }}</span>
                        </div>
                        <div>
                          <span class="text-[9px] uppercase font-bold text-gray-400 block">🚀 Vit. Max</span>
                          <span class="text-xs font-bold text-gray-800">{{ cardio.max_speed || 0 }} km/h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Modale de visualisation de la carte GPS -->
    <div v-if="isMapModalOpen" class="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="flex justify-between items-center p-5 border-b border-gray-100">
          <div>
            <h3 class="font-bold text-gray-800 text-base">🗺️ Tracé GPS de la session</h3>
            <p class="text-xs text-gray-400" v-if="selectedGpsSession">
              {{ formatDate(selectedGpsSession.date || selectedGpsSession.created_at) }} • {{ selectedGpsSession.distance_km !== undefined ? Number(selectedGpsSession.distance_km).toFixed(3) + ' km' : '' }}
            </p>
          </div>
          <button @click="closeMapModal" class="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full font-bold transition cursor-pointer">
            ✕
          </button>
        </div>

        <div class="p-5 flex-1 overflow-y-auto space-y-4">
          <div class="w-full h-80 bg-gray-100 rounded-xl border border-gray-200 relative overflow-hidden">
            <div ref="mapContainer" class="w-full h-full z-10"></div>
            <div v-if="!selectedGpsSession?.gps_path || selectedGpsSession.gps_path.length === 0" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-center p-6 space-y-2 z-20">
              <span class="text-3xl">📍</span>
              <p class="text-xs font-bold text-gray-700">Aucun point GPS enregistré pour cette session</p>
            </div>
          </div>

          <!-- Légende des allures détaillée -->
          <div v-if="selectedGpsSession && selectedGpsSession.gps_path && selectedGpsSession.gps_path.length > 0" class="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
            <div class="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
              <span>🟢 Lent</span>
              <span>🟡 Modéré</span>
              <span>🟠 Rapide</span>
              <span>🔴 Max</span>
            </div>
            <div class="h-2.5 w-full rounded-full" style="background: linear-gradient(to right, hsl(120, 100%, 45%), hsl(60, 100%, 45%), hsl(30, 100%, 45%), hsl(0, 100%, 45%));"></div>
            <div class="flex justify-between items-center text-[11px] font-extrabold text-gray-700">
              <span>0 km/h</span>
              <span class="text-gray-400">|</span>
              <span>{{ Math.round((Number(selectedGpsSession.max_speed) || 8) * 0.33) }} km/h</span>
              <span class="text-gray-400">|</span>
              <span>{{ Math.round((Number(selectedGpsSession.max_speed) || 8) * 0.66) }} km/h</span>
              <span class="text-gray-400">|</span>
              <span class="text-indigo-600">{{ selectedGpsSession.max_speed || '0' }} km/h</span>
            </div>
          </div>

          <div v-if="selectedGpsSession" class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span class="text-[10px] uppercase font-bold text-gray-400 block">⏱️ Durée</span>
              <span class="text-xs font-bold text-gray-800">{{ selectedGpsSession.duration_minutes ? selectedGpsSession.duration_minutes + ' min' : '--' }}</span>
            </div>
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span class="text-[10px] uppercase font-bold text-gray-400 block">⚡ Vit. Moy.</span>
              <span class="text-xs font-bold text-gray-800">{{ selectedGpsSession.avg_speed || '0' }} km/h</span>
            </div>
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span class="text-[10px] uppercase font-bold text-gray-400 block">🏃‍♂️ Allure Moy.</span>
              <span class="text-xs font-bold text-gray-800">{{ selectedGpsSession.avg_pace || '--' }}</span>
            </div>
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span class="text-[10px] uppercase font-bold text-gray-400 block">🚀 Vitesse Max</span>
              <span class="text-xs font-bold text-gray-800">{{ selectedGpsSession.max_speed || '0' }} km/h</span>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button @click="closeMapModal" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer">
            Fermer
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { supabase } from '../lib/supabase'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const filterMode = ref('exercise')
const targetList = ref([])
const selectedTarget = ref('')
const historyData = ref([])
const loadingHistory = ref(false)

const isMapModalOpen = ref(false)
const selectedGpsSession = ref(null)
const mapContainer = ref(null)
let mapInstance = null

watch(isMapModalOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    setTimeout(() => {
      initMap()
    }, 100)
  } else {
    if (mapInstance) {
      mapInstance.remove()
      mapInstance = null
    }
  }
})

const calculateGpsDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

const initMap = () => {
  if (!mapContainer.value) return
  const path = selectedGpsSession.value?.gps_path
  if (!path || !Array.isArray(path) || path.length === 0) return

  const normalizedPath = path.map(p => Array.isArray(p) ? { lat: p[0], lng: p[1], time: p.time || Date.now() } : p)

  mapInstance = L.map(mapContainer.value).setView([normalizedPath[0].lat, normalizedPath[0].lng], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapInstance)

  const sessionMaxSpeed = Number(selectedGpsSession.value?.max_speed) || 0
  const ceilingSpeed = Math.max(sessionMaxSpeed, 8)

  for (let i = 0; i < normalizedPath.length - 1; i++) {
    const p1 = normalizedPath[i]
    const p2 = normalizedPath[i + 1]

    const distKm = calculateGpsDistance(p1.lat, p1.lng, p2.lat, p2.lng)
    const timeDiffHours = (p2.time && p1.time) ? (p2.time - p1.time) / 3600000 : 0
    
    let speed = timeDiffHours > 0 ? distKm / timeDiffHours : 0
    if (speed > 30) speed = 0

    let ratio = speed / ceilingSpeed
    if (ratio > 1) ratio = 1

    const hue = (1 - ratio) * 120
    const segmentColor = `hsl(${hue}, 100%, 45%)`

    L.polyline(
      [[p1.lat, p1.lng], [p2.lat, p2.lng]],
      {
        color: segmentColor,
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }
    ).addTo(mapInstance)
  }

  const bounds = L.latLngBounds(normalizedPath.map(p => [p.lat, p.lng]))
  mapInstance.fitBounds(bounds, { padding: [40, 40] })
}

const openMapModal = (session) => {
  if (!session) return
  selectedGpsSession.value = {
    ...session,
    duration_minutes: session.duration_minutes || null,
    distance_km: session.distance_km !== undefined ? session.distance_km : 0,
    avg_speed: session.avg_speed || 0,
    avg_pace: session.avg_pace || '--',
    max_speed: session.max_speed || 0,
    gps_path: session.gps_path || [],
    gpsPointsCount: (session.gps_path && Array.isArray(session.gps_path)) ? session.gps_path.length : 0
  }
  isMapModalOpen.value = true
}

const closeMapModal = () => {
  isMapModalOpen.value = false
  selectedGpsSession.value = null
}

const resetSelection = () => {
  selectedTarget.value = ''
  historyData.value = []
  fetchTargetList()
}

const fetchTargetList = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (filterMode.value === 'exercise') {
    const { data, error } = await supabase
      .from('workout_set_logs')
      .select('exercise_name')
      .eq('user_id', user.id)

    if (!error && data) {
      const unique = [...new Set(data.map(item => item.exercise_name))]
      targetList.value = unique.map(name => ({ id: name, name }))
      if (unique.length > 0) {
        selectedTarget.value = unique[0]
        fetchHistory()
      }
    }
  } else {
    const { data, error } = await supabase
      .from('scheduled_workouts')
      .select(`
        workout_id,
        workouts (
          id,
          title
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (!error && data) {
      const map = new Map()
      data.forEach(item => {
        if (item.workouts) {
          map.set(item.workouts.id, item.workouts.title)
        }
      })
      const uniqueWorkouts = Array.from(map, ([id, name]) => ({ id, name }))
      targetList.value = uniqueWorkouts
      if (uniqueWorkouts.length > 0) {
        selectedTarget.value = uniqueWorkouts[0].id
        fetchHistory()
      }
    }
  }
}

const fetchHistory = async () => {
  if (!selectedTarget.value) return
  loadingHistory.value = true

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  let query = supabase
    .from('workout_set_logs')
    .select(`
      *,
      scheduled_workouts (
        scheduled_date,
        workout_id
      )
    `)
    .eq('user_id', user.id)

  if (filterMode.value === 'exercise') {
    query = query.eq('exercise_name', selectedTarget.value)
  } else {
    const { data: scheds } = await supabase
      .from('scheduled_workouts')
      .select('id')
      .eq('workout_id', selectedTarget.value)

    const schedIds = scheds ? scheds.map(s => s.id) : []
    if (schedIds.length === 0) {
      historyData.value = []
      loadingHistory.value = false
      return
    }
    query = query.in('scheduled_workout_id', schedIds)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (!error && data) {
    const grouped = {}
    data.forEach(log => {
      const date = log.scheduled_workouts?.scheduled_date || log.created_at.split('T')[0]
      const schedId = log.scheduled_workout_id || log.id
      const groupKey = `${date}_${schedId}`

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          groupKey,
          date,
          sets: [],
          cardioBlocks: [],
          maxWeight: 0,
          max1RM: 0,
          totalVolume: 0,
          isCardio: false,
          isPureCardio: false,
          distance_km: 0,
          expanded: false
        }
      }

      const distVal = log.distance_km !== null && log.distance_km !== undefined ? Number(log.distance_km) : 0
      const isCardioLog = log.is_cardio === true || distVal > 0 || log.duration_minutes > 0 || (log.weight === 0 && log.reps === 0)

      if (isCardioLog) {
        grouped[groupKey].isCardio = true
        grouped[groupKey].distance_km = distVal
        grouped[groupKey].duration_minutes = log.duration_minutes
        grouped[groupKey].avg_speed = log.avg_speed
        grouped[groupKey].avg_pace = log.avg_pace
        grouped[groupKey].max_speed = log.max_speed
        grouped[groupKey].gps_path = log.gps_path
        grouped[groupKey].gpsPointsCount = log.gps_path ? log.gps_path.length : 0

        grouped[groupKey].cardioBlocks.push({
          ...log,
          distance_km: distVal,
          gpsPointsCount: log.gps_path ? log.gps_path.length : 0
        })
      } else {
        grouped[groupKey].sets.push(log)
        if (log.weight > grouped[groupKey].maxWeight) {
          grouped[groupKey].maxWeight = log.weight
        }

        const set1RM = log.weight * (1 + (log.reps / 30))
        if (set1RM > grouped[groupKey].max1RM) {
          grouped[groupKey].max1RM = Math.round(set1RM)
        }

        grouped[groupKey].totalVolume += (log.weight * log.reps)
      }
    })

    Object.values(grouped).forEach(g => {
      if (g.cardioBlocks.length > 0 && g.sets.length === 0) {
        g.isPureCardio = true
      }
    })

    let sortedSessions = Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(b.date === a.date ? 0 : b.date))

    for (let i = 0; i < sortedSessions.length; i++) {
      const current = sortedSessions[i]
      const previous = sortedSessions[i + 1]

      if (previous) {
        if (filterMode.value === 'exercise') {
          if (current.isCardio && previous.distance_km !== undefined && current.distance_km !== undefined) {
            const currDist = current.distance_km || 0
            const prevDist = previous.distance_km || 0
            if (prevDist > 0) {
              const diff = currDist - prevDist
              current.evolution = Math.round((diff / prevDist) * 100 * 10) / 10
            }
          } else if (!current.isCardio && previous.max1RM > 0) {
            const diff = current.max1RM - previous.max1RM
            current.evolution = Math.round((diff / previous.max1RM) * 100 * 10) / 10
          }
        } else if (filterMode.value === 'workout' && previous.totalVolume > 0 && !current.isPureCardio && !previous.isPureCardio) {
          const diff = current.totalVolume - previous.totalVolume
          current.evolution = Math.round((diff / previous.totalVolume) * 100 * 10) / 10
        }
      }
    }

    historyData.value = sortedSessions
  }
  loadingHistory.value = false
}

const isCardioExercise = computed(() => {
  return historyData.value.length > 0 && historyData.value[0].isCardio
})

const estimated1RM = computed(() => {
  if (filterMode.value !== 'exercise' || isCardioExercise.value || historyData.value.length === 0) return 0
  let max = 0
  historyData.value.forEach(session => {
    if (session.max1RM > max) max = session.max1RM
  })
  return max
})

const maxCardioDistance = computed(() => {
  if (filterMode.value !== 'exercise' || !isCardioExercise.value || historyData.value.length === 0) return 0
  let max = 0
  historyData.value.forEach(session => {
    const dist = session.distance_km !== undefined ? Number(session.distance_km) : 0
    if (dist > max) max = dist
  })
  return Number(max).toFixed(3)
})

const isCardioGlobalSession = computed(() => {
  if (filterMode.value !== 'workout' || historyData.value.length === 0) return false
  return historyData.value[0].isPureCardio
})

const maxVolumeGlobal = computed(() => {
  if (filterMode.value !== 'workout' || historyData.value.length === 0) return 0
  let max = 0
  historyData.value.forEach(s => {
    if (s.totalVolume > max) max = s.totalVolume
  })
  return max
})

const maxCardioGlobalDistance = computed(() => {
  if (filterMode.value !== 'workout' || historyData.value.length === 0) return 0
  let max = 0
  historyData.value.forEach(s => {
    if (s.distance_km > max) max = s.distance_km
  })
  return Number(max).toFixed(3)
})

// --- LOGIQUE DU GRAPHIQUE SVG ---
const chartComputedData = computed(() => {
  if (!historyData.value || historyData.value.length === 0) return { points: [], minDate: '', maxDate: '' }

  // On trie par ordre chronologique croissant (du plus ancien au plus récent) pour le graphique
  const chronological = [...historyData.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  
  const values = chronological.map(session => {
    if (filterMode.value === 'exercise') {
      return isCardioExercise.value ? (Number(session.distance_km) || 0) : (session.max1RM || 0)
    } else {
      return isCardioGlobalSession.value ? (Number(session.distance_km) || 0) : (session.totalVolume || 0)
    }
  })

  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  const svgWidth = 500
  const svgHeight = 140
  const paddingY = 20

  const points = chronological.map((session, index) => {
    const x = chronological.length === 1 ? svgWidth / 2 : (index / (chronological.length - 1)) * svgWidth
    const val = values[index]
    // Inversion de l'axe Y car le SVG part du haut (0 en haut)
    const y = svgHeight - paddingY - ((val - minVal) / range) * (svgHeight - paddingY * 2)
    return { x, y, val, date: session.date }
  })

  const minDate = chronological.length > 0 ? formatDateShort(chronological[0].date) : ''
  const maxDate = chronological.length > 0 ? formatDateShort(chronological[chronological.length - 1].date) : ''

  return { points, minDate, maxDate }
})

const chartPoints = computed(() => chartComputedData.value.points)
const chartMinDate = computed(() => chartComputedData.value.minDate)
const chartMaxDate = computed(() => chartComputedData.value.maxDate)

const chartLinePath = computed(() => {
  const pts = chartPoints.value
  if (pts.length === 0) return ''
  return pts.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '')
})

const chartAreaPath = computed(() => {
  const pts = chartPoints.value
  if (pts.length === 0) return ''
  const first = pts[0]
  const last = pts[pts.length - 1]
  const line = chartLinePath.value
  return `${line} L ${last.x} 150 L ${first.x} 150 Z`
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(dateStr).toLocaleDateString('fr-FR', options)
}

const formatDateShort = (dateStr) => {
  if (!dateStr) return ''
  const options = { month: 'short', day: 'numeric' }
  return new Date(dateStr).toLocaleDateString('fr-FR', options)
}

onMounted(() => {
  fetchTargetList()
})
</script>