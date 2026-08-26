<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-10 space-y-8 relative overflow-hidden">
      
      <!-- En-tête avec barre de progression -->
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Étape {{ step }} sur 4
          </span>
          <span class="text-xs font-bold text-gray-400">
            {{ Math.round((step / 4) * 100) }}% complété
          </span>
        </div>

        <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            class="bg-indigo-600 h-full transition-all duration-300 ease-out rounded-full"
            :style="{ width: `${(step / 4) * 100}%` }"
          ></div>
        </div>

        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
            {{ stepTitles[step - 1].title }}
          </h2>
          <p class="text-xs sm:text-sm text-gray-500 mt-1">
            {{ stepTitles[step - 1].subtitle }}
          </p>
        </div>
      </div>

      <!-- Contenu des étapes -->
      <div class="py-2">
        
        <!-- Étape 1 : Infos de base & Genre -->
        <div v-if="step === 1" class="space-y-4 animate-fadeIn">
          <div>
            <label class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Prénom</label>
            <input v-model="form.firstName" type="text" placeholder="Ex: Alexandre" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm sm:text-base font-bold text-gray-800 outline-none focus:border-indigo-500 transition shadow-inner" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Date de naissance</label>
              <input v-model="form.birthDate" type="date" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm sm:text-base font-bold text-gray-800 outline-none focus:border-indigo-500 transition shadow-inner" />
            </div>
            <div>
              <label class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Genre</label>
              <select v-model="form.gender" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm sm:text-base font-bold text-gray-800 outline-none focus:border-indigo-500 transition shadow-inner">
                <option value="">Ne pas préciser</option>
                <option value="MALE">Homme</option>
                <option value="FEMALE">Femme</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Taille (cm)</label>
              <input v-model.number="form.height" type="number" placeholder="Ex: 175" class="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-sm sm:text-base font-bold text-gray-800 outline-none focus:border-indigo-500 transition shadow-inner" />
            </div>
            <div>
              <label class="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Poids actuel (kg)</label>
              <input 
                v-model.number="form.weight" 
                type="number" 
                step="0.1" 
                :disabled="!form.enableWeight" 
                :placeholder="weightPlaceholder" 
                :class="weightInputClass" 
              />
            </div>
          </div>

          <!-- Case à cocher pour activer la saisie du poids -->
          <div class="pt-1">
            <label class="flex items-center gap-2.5 cursor-pointer group">
              <div 
                class="w-4 h-4 rounded border-2 flex items-center justify-center transition shrink-0" 
                :class="form.enableWeight ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white group-hover:border-indigo-400'"
              >
                <span v-if="form.enableWeight" class="text-[10px] font-bold">✓</span>
              </div>
              <input type="checkbox" v-model="form.enableWeight" class="hidden" @change="handleWeightToggle" />
              <span class="text-xs text-gray-600 select-none font-medium">Renseigner mon poids actuel</span>
            </label>
          </div>

          <p class="text-xs text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center gap-2">
            <span>🌱</span> Optionnel : tu pourras modifier ces données à tout moment depuis ton profil.
          </p>
        </div>

        <!-- Étape 2 : Objectifs -->
        <div v-if="step === 2" class="space-y-3 animate-fadeIn">
          <div 
            v-for="goalOption in goalOptions" 
            :key="goalOption.value"
            @click="form.goal = goalOption.value"
            :class="form.goal === goalOption.value ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'"
            class="p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between group"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ goalOption.icon }}</span>
              <div>
                <p class="font-bold text-sm sm:text-base text-gray-800 group-hover:text-indigo-600 transition">{{ goalOption.label }}</p>
                <p class="text-xs text-gray-500">{{ goalOption.desc }}</p>
              </div>
            </div>
            <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center" :class="form.goal === goalOption.value ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'">
              <span v-if="form.goal === goalOption.value" class="text-xs">✓</span>
            </div>
          </div>
        </div>

        <!-- Étape 3 : Matériel Granulaire -->
        <div v-if="step === 3" class="space-y-3 animate-fadeIn max-h-[320px] overflow-y-auto pr-1">
          <p class="text-xs text-gray-500 mb-2">Sélectionne le matériel dont tu disposes pour adapter automatiquement les exercices proposés :</p>
          <div 
            v-for="eq in granularEquipmentOptions" 
            :key="eq.value"
            @click="toggleEquipment(eq.value)"
            :class="form.equipment.includes(eq.value) ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'"
            class="p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between group"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">{{ eq.icon }}</span>
              <div>
                <p class="font-bold text-sm text-gray-800 group-hover:text-indigo-600 transition">{{ eq.label }}</p>
              </div>
            </div>
            <div class="w-5 h-5 rounded-lg border-2 flex items-center justify-center transition" :class="form.equipment.includes(eq.value) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300'">
              <span v-if="form.equipment.includes(eq.value)" class="text-xs font-bold">✓</span>
            </div>
          </div>
        </div>

        <!-- Étape 4 : Santé & Biomécanique -->
        <div v-if="step === 4" class="space-y-4 animate-fadeIn max-h-[340px] overflow-y-auto pr-1">
          <div class="flex justify-between items-center">
            <label class="text-xs font-bold text-gray-600 uppercase tracking-wider">Santé & Biomécanique</label>
            <button @click="addInjury" class="text-xs bg-indigo-50 text-indigo-600 font-bold px-3 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition">
              + Ajouter
            </button>
          </div>

          <div v-if="form.injuriesList.length === 0" class="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            Aucune contrainte signalée. Tout est OK ! 🚀
          </div>

          <div v-for="(item, index) in form.injuriesList" :key="index" class="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 relative">
            <button @click="removeInjury(index)" class="absolute top-3 right-3 text-gray-400 hover:text-red-500 font-bold text-xs">✕ Supprimer</button>
            
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase">Type</label>
                <select v-model="item.category" @change="onCategoryChange(item)" class="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-gray-800">
                  <option value="INJURY">Blessure / Lésion</option>
                  <option value="PAIN">Douleur / Gêne</option>
                  <option value="MEDICAL">Condition médicale</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase">Zone</label>
                <select v-model="item.zone" class="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-gray-800">
                  <option disabled value="">Zone</option>
                  <option v-for="z in zoneOptions" :key="z.value" :value="z.value">{{ z.label }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase">Côté</label>
                <select v-model="item.side" class="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-gray-800">
                  <option v-for="s in sideOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-bold text-gray-500 uppercase">Statut</label>
                <select v-model="item.status" class="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-gray-800">
                  <option v-for="st in statusOptions" :key="st.value" :value="st.value">{{ st.label }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="text-[10px] font-bold text-gray-500 uppercase">Impact biomécanique & Consigne</label>
              <select v-model="item.specificImpact" class="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-gray-800">
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

      </div>

      <!-- Boutons de navigation -->
      <div class="flex items-center gap-3 pt-2">
        <button 
          v-if="step > 1" 
          @click="step--" 
          class="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl text-sm transition active:scale-95"
        >
          Retour
        </button>
        <button 
          @click="nextStep" 
          :class="step > 1 ? 'w-2/3' : 'w-full'"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition active:scale-95"
        >
          {{ step === 4 ? 'Terminer & Accéder au Dashboard 🚀' : 'Suivant' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const step = ref(1)

const form = reactive({
  firstName: '', 
  birthDate: '', 
  gender: '',
  height: null, 
  weight: null,
  enableWeight: false,
  goal: 'HEALTH', 
  equipment: [], 
  injuriesList: []
})

const weightPlaceholder = computed(() => form.enableWeight ? 'Ex: 70' : 'Non renseigné')

const weightInputClass = computed(() => [
  'w-full border border-gray-200 p-3.5 rounded-xl text-sm sm:text-base font-bold text-gray-800 outline-none focus:border-indigo-500 transition shadow-inner',
  !form.enableWeight ? 'opacity-50 bg-gray-100 cursor-not-allowed' : 'bg-gray-50'
])

const handleWeightToggle = () => {
  if (!form.enableWeight) {
    form.weight = null
  }
}

const stepTitles = [
  { title: "Faisons connaissance !", subtitle: "Renseigne tes informations de base." },
  { title: "Quel est ton objectif principal ?", subtitle: "Cela orientera tes programmes d'entraînement." },
  { title: "Ton matériel disponible", subtitle: "Coche les équipements que tu as sous la main." },
  { title: "Santé & Biomécanique", subtitle: "Personnalise tes zones de vigilance et antécédents." }
]

const goalOptions = [
  { value: 'HYPERTROPHY', label: 'Hypertrophie', desc: 'Prendre du muscle et sculpter sa silhouette', icon: '🔥' },
  { value: 'STRENGTH', label: 'Force', desc: 'Maximiser les charges et la puissance pure', icon: '🏋️‍♂️' },
  { value: 'WEIGHT_LOSS', label: 'Perte de poids', desc: 'Sèche, cardio et diminution de la masse grasse', icon: '⚡' },
  { value: 'HEALTH', label: 'Santé / Bien-être', desc: 'Forme générale, posture et vitalité au quotidien', icon: '🌱' },
  { value: 'ENDURANCE', label: 'Endurance / Cardio', desc: 'Développer le souffle et l’endurance globale', icon: '🏃‍♂️' }
]

const granularEquipmentOptions = [
  { value: 'DUMBBELLS', label: 'Haltères ajustables', icon: '🏋️' },
  { value: 'BARBELL', label: 'Barre olympique & disques', icon: '⭕' },
  { value: 'RESISTANCE_BANDS', label: 'Bandes de résistance / Élastiques', icon: '🎗️' },
  { value: 'PULLUP_BAR', label: 'Barre de traction', icon: '🚪' },
  { value: 'DIP_BARS', label: 'Barres de dips / Station', icon: '🏗️' },
  { value: 'WEIGHTED_VEST', label: 'Gilet lesté', icon: '🦺' },
  { value: 'KETTLEBELL', label: 'Kettlebell', icon: '💣' },
  { value: 'BENCH', label: 'Banc de musculation inclinable', icon: '🪑' },
  { value: 'MAT', label: 'Tapis de sol & Corde à sauter', icon: '🧶' }
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

const nextStep = async () => {
  if (step.value < 4) {
    step.value++
  } else {
    const authData = await supabase.auth.getUser()
    const user = authData?.data?.user
    
    if (!user) {
      console.error("Utilisateur non authentifié")
      return
    }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name: form.firstName || 'Sportif',
      birth_date: form.birthDate || null,
      gender: form.gender || null,
      height: form.height || null,
      goal: form.goal,
      equipment_access: form.equipment,
      injuries_list: form.injuriesList,
      updated_at: new Date()
    }, { onConflict: 'id' })

    if (profileError) {
      console.error("Erreur lors de la mise à jour du profil :", profileError.message)
    }

    if (form.enableWeight && form.weight) {
      const { error: weightError } = await supabase.from('body_measurements').insert({
        user_id: user.id,
        weight: form.weight,
        recorded_at: new Date()
      })

      if (weightError) {
        console.error("Erreur lors de l'enregistrement du poids :", weightError.message)
      }
    }

    router.push('/dashboard')
  }
}
</script>