<template>
  <div style="max-width: 400px; margin: 50px auto; padding: 20px; font-family: sans-serif;">
    <h2>{{ isLogin ? 'Connexion' : 'Créer mon compte' }}</h2>
    
    <input v-model="email" type="email" placeholder="Email" style="width: 100%; padding: 10px; margin-bottom: 10px;" />
    <input v-model="password" type="password" placeholder="Mot de passe" style="width: 100%; padding: 10px; margin-bottom: 10px;" />
    
    <button @click="handleAuth" style="width: 100%; padding: 10px; background: #42b883; color: white; border: none; cursor: pointer;">
      {{ isLogin ? 'Se connecter' : 'S\'inscrire' }}
    </button>
    
    <p @click="isLogin = !isLogin" style="text-align: center; cursor: pointer; color: #3498db; margin-top: 15px;">
      {{ isLogin ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter' }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const isLogin = ref(true)

// Si l'utilisateur arrive sur la page de login mais est déjà connecté, on le redirige
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    checkUserProfile(session.user.id)
  }
})

const checkUserProfile = async (userId) => {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()
    
  if (data) {
    router.push('/dashboard') // Il a déjà fini son onboarding
  } else {
    router.push('/onboarding') // Il doit faire l'onboarding
  }
}

const handleAuth = async () => {
  if (isLogin.value) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    if (error) {
      alert(error.message)
    } else if (data.session) {
      checkUserProfile(data.session.user.id)
    }
  } else {
    const { error } = await supabase.auth.signUp({ email: email.value, password: password.value })
    if (error) alert(error.message)
    else alert("Compte créé ! Connecte-toi maintenant.")
  }
}
</script>