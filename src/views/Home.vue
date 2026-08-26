<template>
  <div style="max-width: 500px; margin: 40px auto; font-family: sans-serif; padding: 20px; background: #f9f9f9; border-radius: 8px;">
    <h2>🚀 Configuration de ton Profil EasyFit</h2>
    
    <form @submit.prevent="saveProfile">
      <div style="margin-bottom: 15px;">
        <label>Pseudo :</label><br>
        <input type="text" v-model="form.pseudo" style="width: 100%; padding: 8px; margin-top: 5px;" required />
      </div>

      <div style="margin-bottom: 15px;">
        <label>Genre :</label><br>
        <select v-model="form.gender" style="width: 100%; padding: 8px; margin-top: 5px;">
          <option value="MALE">Homme</option>
          <option value="FEMALE">Femme</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>

      <div style="margin-bottom: 15px;">
        <label>Séances par semaine (Objectif) :</label><br>
        <input type="number" v-model.number="form.target_sessions_per_week" style="width: 100%; padding: 8px; margin-top: 5px;" min="1" max="7" />
      </div>

      <div style="margin-bottom: 15px;">
        <label>Environnement d'entraînement :</label><br>
        <select v-model="form.training_environment" style="width: 100%; padding: 8px; margin-top: 5px;">
          <option value="GYM_BUSY">Salle de sport fréquentée</option>
          <option value="GYM_QUIET">Salle de sport calme</option>
          <option value="HOME">À la maison</option>
          <option value="OUTDOOR">Extérieur / Street Workout</option>
        </select>
      </div>

      <button type="submit" style="background: #42b883; color: white; border: none; padding: 10px 20px; font-size: 16px; border-radius: 4px; cursor: pointer;">
        Enregistrer mon profil
      </button>
    </form>

    <p v-if="message" style="margin-top: 15px; font-weight: bold;" :style="{ color: isError ? 'red' : 'green' }">
      {{ message }}
    </p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()

// Données du formulaire liées à notre table users_profile
const form = reactive({
  pseudo: '',
  gender: 'MALE',
  target_sessions_per_week: 4,
  training_environment: 'GYM_BUSY'
})

const message = ref('')
const isError = ref(false)

const saveProfile = async () => {
  message.value = "Enregistrement en cours..."
  isError.value = false

  // Note : Comme la table utilise l'ID de auth.users, pour ce test rapide sans auth complète,
  // on va insérer ou simuler l'ID. 
  // Attends, est-ce que tu as configuré l'authentification Supabase ?
  // Pour l'instant, testons l'insertion directe :
  
  const { error } = await supabase
    .from('users_profile')
    .upsert({
      // Pour l'instant on met un UUID de test fixe si t'es pas loggé, 
      // ou l'authentification si tu l'as activée. Dis-moi si ça passe !
      id: '00000000-0000-0000-0000-000000000001', 
      pseudo: form.pseudo,
      gender: form.gender,
      target_sessions_per_week: form.target_sessions_per_week,
      training_environment: form.training_environment,
      updated_at: new Date()
    })

  if (error) {
    message.value = "Erreur : " + error.message
    isError.value = true
  } else {
    message.value = "Profil enregistré avec succès !"
	setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
  }
}
</script>