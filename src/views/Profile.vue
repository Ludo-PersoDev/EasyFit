<template>
  <div class="min-h-screen bg-gray-50 p-4 sm:p-8 flex justify-center">
    <div class="w-full max-w-2xl space-y-6">
      
      <div class="flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900">Mon Profil 👤</h1>
          <p class="text-xs sm:text-sm text-gray-500">Gère tes informations personnelles et ton matériel</p>
        </div>
        <router-link 
          to="/dashboard" 
          class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition"
        >
          ← Retour
        </router-link>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-400 font-medium">
        Chargement de ton profil...
      </div>

      <div v-else class="space-y-6">
        
        <!-- Informations Générales & Genre -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
          <h2 class="text-lg font-bold text-gray-800 border-b pb-3">Informations de base</h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Prénom</label>
              <input v-model="form.firstName" type="text" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-indigo-500 transition" />
            </div>

            <div>
              <label class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Date de naissance</label>
              <input v-model="form.birthDate" type="date" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-indigo-500 transition" />
            </div>

            <div>
              <label class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Genre</label>
              <select v-model="form.gender" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-indigo-500 transition">
                <option value="">Ne pas préciser</option>
                <option value="MALE">Homme</option>
                <option value="FEMALE">Femme</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div>
              <label class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Taille (cm)</label>
              <input v-model.number="form.height" type="number" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-indigo-500 transition" />
            </div>

            <div class="sm:col-span-2">
              <label class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Objectif principal</label>
              <select v-model="form.goal" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-indigo-500 transition">
                <option value="HYPERTROPHY">Hypertrophie (Muscle)</option>
                <option value="STRENGTH">Force</option>
                <option value="WEIGHT_LOSS">Perte de poids</option>
                <option value="HEALTH">Santé / Bien-être</option>
                <option value="ENDURANCE">Endurance / Cardio</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Suivi du Poids Optionnel & Graphique -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
          <div class="flex items-center justify-between border-b pb-3">
            <div>
              <h2 class="text-lg font-bold text-gray-800">Suivi du poids ⚖️</h2>
              <p class="text-xs text-gray-400">Optionnel : active ton suivi pour observer ta progression</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="form.trackWeight" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div v-if="form.trackWeight" class="space-y-6">
            <div>
              <label class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Enregistrer une nouvelle pesée (kg)</label>
              <div class="flex gap-3">
                <input v-model.number="newWeightValue" type="number" step="0.1" placeholder="Ex: 75.5" class="flex-1 bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-indigo-500 transition" />
                <button @click="recordNewWeight" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition shadow-sm active:scale-95">
                  Ajouter ➕
                </button>
              </div>
            </div>

            <!-- Graphique d'évolution Chart.js -->
            <div v-if="chartData.labels.length > 0" class="h-56 bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col justify-center">
              <Line :data="chartData" :options="chartOptions" />
            </div>
            <div v-else class="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-2xl border border-gray-200">
              Aucune pesée enregistrée pour le moment. Ajoute ta première valeur ci-dessus !
            </div>
          </div>
        </div>

        <!-- Matériel Granulaire -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-4">
          <h2 class="text-lg font-bold text-gray-800 border-b pb-3">Matériel disponible</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div 
              v-for="eq in granularEquipmentOptions" 
              :key="eq.value"
              @click="toggleEquipment(eq.value)"
              :class="form.equipment.includes(eq.value) ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 bg-white'"
              class="p-3 rounded-xl border-2 cursor-pointer transition flex items-center justify-between"
            >
              <span class="text-xs font-bold text-gray-800">{{ eq.label }}</span>
              <span v-if="form.equipment.includes(eq.value)" class="text-xs text-indigo-600 font-bold">✓</span>
            </div>
          </div>
        </div>

        <!-- Santé & Contraintes Biomécaniques -->
        <div class="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-4">
          <div class="flex justify-between items-center border-b pb-3">
            <div>
              <h2 class="text-lg font-bold text-gray-800">Santé & Biomécanique 🩺</h2>
              <p class="text-xs text-gray-400">Gère tes sensibilités actuelles et tes anciens traumatismes</p>
            </div>
            <button @click="addInjury" class="text-xs bg-indigo-50 text-indigo-600 font-bold px-3 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition">
              + Ajouter
            </button>
          </div>

          <div v-if="form.injuriesList.length === 0" class="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-2xl border border-gray-200">
            Aucune sensibilité ou séquelle enregistrée. Tout va bien ! 🚀
          </div>

          <div v-for="(item, index) in form.injuriesList" :key="index" class="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 relative">
            <button @click="removeInjury(index)" class="absolute top-3 right-3 text-gray-400 hover:text-red-500 font-bold text-xs">✕</button>
            
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <!-- Type -->
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase">Type</label>
                <select v-model="item.category" @change="onCategoryChange(item)" class="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-800 outline-none">
                  <option value="INJURY">Blessure / Lésion</option>
                  <option value="PAIN">Douleur / Gêne</option>
                  <option value="MEDICAL">Condition médicale</option>
                </select>
              </div>

              <!-- Zone -->
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase">Zone</label>
                <select v-model="item.zone" class="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-800 outline-none">
                  <option disabled value="">Zone</option>
                  <option v-for="z in zoneOptions" :key="z.value" :value="z.value">{{ z.label }}</option>
                </select>
              </div>

              <!-- Côté -->
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase">Côté</label>
                <select v-model="item.side" class="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-800 outline-none">
                  <option v-for="s in sideOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>

              <!-- Statut -->
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase">Statut</label>
                <select v-model="item.status" class="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-800 outline-none">
                  <option v-for="st in statusOptions" :key="st.value" :value="st.value">{{ st.label }}</option>
                </select>
              </div>
            </div>

            <!-- Impact Biomécanique -->
            <div>
              <label class="text-[10px] font-bold text-gray-500 uppercase">Impact biomécanique & Consigne</label>
              <select v-model="item.specificImpact" class="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-800 outline-none">
                <template v-if="item.category === 'INJURY'">
                  <option value="TENDINOPATHY">Tendinopathie (Éviter impacts et tensions excessives)</option>
                  <option value="FRACTURE_REHAB">Fracture / Consolidation (Adapter charges et axes)</option>
                  <option value="TEAR">Déchirure / Élongation</option>
                  <option value="SPRAIN_SEQUELA">Instabilité chronique / Séquelle d'entorse</option>
                </template>
                <template v-else-if="item.category === 'PAIN'">
                  <option value="CHRONIC_PAIN">Douleur chronique (Adapter l'amplitude)</option>
                  <option value="STIFFNESS">Raideur structurelle (Insister sur la mobilité)</option>
                  <option value="COMPENSATION">Zone de compensation biomécanique</option>
                </template>
                <template v-else>
                  <option value="CHRONIC_FATIGUE">Fatigue chronique (Adapter le volume global)</option>
                  <option value="MEDICAL_RESTRICTION">Restriction médicale spécifique</option>
                </template>
              </select>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button 
            @click="restartOnboarding" 
            class="w-full sm:w-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-6 py-3.5 rounded-2xl text-sm transition"
          >
            🔄 Refaire l'onboarding
          </button>

          <button 
            @click="saveProfile" 
            class="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl text-sm shadow-md transition active:scale-95"
          >
            {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications 💾' }}
          </button>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const newWeightValue = ref(null)

const form = reactive({
  firstName: '',
  birthDate: '',
  gender: '',
  height: null,
  goal: 'HEALTH',
  trackWeight: false,
  equipment: [],
  injuriesList: []
})

const chartData = reactive({
  labels: [],
  datasets: [
    {
      label: 'Poids (kg)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      borderColor: '#4f46e5',
      borderWidth: 3,
      pointBackgroundColor: '#4f46e5',
      fill: true,
      data: []
    }
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { grid: { color: '#f3f4f6' } },
    x: { grid: { display: false } }
  }
}

const granularEquipmentOptions = [
  { value: 'DUMBBELLS', label: 'Haltères ajustables' },
  { value: 'BARBELL', label: 'Barre olympique & disques' },
  { value: 'RESISTANCE_BANDS', label: 'Bandes de résistance' },
  { value: 'PULLUP_BAR', label: 'Barre de traction' },
  { value: 'DIP_BARS', label: 'Barres de dips' },
  { value: 'WEIGHTED_VEST', label: 'Gilet lesté' },
  { value: 'KETTLEBELL', label: 'Kettlebell' },
  { value: 'BENCH', label: 'Banc de musculation' },
  { value: 'MAT', label: 'Tapis de sol & Corde' }
]

const zoneOptions = [
  { value: 'NECK', label: 'Cervicales / Cou' },
  { value: 'SHOULDER', label: 'Épaule' },
  { value: 'ELBOW_WRIST', label: 'Coude / Poignet / Main' },
  { value: 'LUMBAR', label: 'Lombaires / Bas du dos' },
  { value: 'HIP', label: 'Hanche / Bassin' },
  { value: 'KNEE', label: 'Genou' },
  { value: 'ANKLE_FOOT', label: 'Cheville / Pied' }
]

const sideOptions = [
  { value: 'BOTH', label: 'Global / Les deux' },
  { value: 'LEFT', label: 'Gauche' },
  { value: 'RIGHT', label: 'Droit' }
]

const statusOptions = [
  { value: 'ACTIVE', label: '🔴 Actif (En cours)' },
  { value: 'LEGACY', label: '🟢 Ancien (Séquelle)' }
]

const toggleEquipment = (val) => {
  const index = form.equipment.indexOf(val)
  if (index > -1) {
    form.equipment.splice(index, 1)
  } else {
    form.equipment.push(val)
  }
}

const addInjury = () => {
  form.injuriesList.push({ 
    category: 'INJURY', 
    zone: 'KNEE', 
    side: 'RIGHT', 
    status: 'ACTIVE', 
    specificImpact: 'TENDINOPATHY' 
  })
}

const onCategoryChange = (item) => {
  if (item.category === 'INJURY') item.specificImpact = 'TENDINOPATHY'
  else if (item.category === 'PAIN') item.specificImpact = 'CHRONIC_PAIN'
  else item.specificImpact = 'CHRONIC_FATIGUE'
}

const removeInjury = (index) => {
  form.injuriesList.splice(index, 1)
}

const fetchWeightHistory = async (userId) => {
  const { data } = await supabase
    .from('body_measurements')
    .select('weight, recorded_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: true })

  if (data && data.length > 0) {
    chartData.labels = data.map(d => new Date(d.recorded_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }))
    chartData.datasets[0].data = data.map(d => d.weight)
  }
}

const recordNewWeight = async () => {
  if (!newWeightValue.value) return
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (user) {
      const { data: lastMeasurements, error: fetchError } = await supabase
        .from('body_measurements')
        .select('recorded_at')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(1)

      if (fetchError) throw fetchError

      if (lastMeasurements && lastMeasurements.length > 0) {
        const lastDate = new Date(lastMeasurements[0].recorded_at)
        const now = new Date()
        const diffTime = now - lastDate
        const diffDays = diffTime / (1000 * 60 * 60 * 24)

        if (diffDays < 7) {
          const daysLeft = Math.ceil(7 - diffDays)
          alert(`Ralentis un peu ! 😉 Tu ne peux enregistrer qu'une pesée par semaine. Réessaie dans ${daysLeft} jour(s).`)
          return
        }
      }

      const { error: insertError } = await supabase.from('body_measurements').insert([{
        user_id: user.id,
        weight: newWeightValue.value,
        recorded_at: new Date()
      }])

      if (insertError) throw insertError

      newWeightValue.value = null
      await fetchWeightHistory(user.id)
      alert('Pesée enregistrée avec succès ! 🎯')
    }
  } catch (err) {
    console.error(err)
    alert("Erreur lors de l'enregistrement du poids.")
  }
}

onMounted(async () => {
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        form.firstName = data.first_name || ''
        form.birthDate = data.birth_date || ''
        form.gender = data.gender || ''
        form.height = data.height || null
        form.goal = data.goal || 'HEALTH'
        form.trackWeight = data.track_weight || false
        form.equipment = data.equipment_access || []
        form.injuriesList = data.injuries_list || []
      }

      await fetchWeightHistory(user.id)
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})

const saveProfile = async () => {
  saving.value = true
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (user) {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: form.firstName,
        birth_date: form.birthDate || null,
        gender: form.gender || null,
        height: form.height || null,
        goal: form.goal,
        track_weight: form.trackWeight,
        equipment_access: form.equipment,
        injuries_list: form.injuriesList,
        updated_at: new Date()
      })
      
      if (error) throw error
      
      alert('Profil mis à jour avec succès ! ✨')
    }
  } catch (err) {
    console.error(err)
    alert("Erreur lors de l'enregistrement.")
  } finally {
    saving.value = false
  }
}

const restartOnboarding = () => {
  router.push('/onboarding')
}
</script>