<template>
  <div style="background: white; border: 1px solid #ccc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
    <h4>🔍 Choisir un exercice</h4>
    
    <!-- Filtres de recherche -->
    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Rechercher par nom..." 
        style="flex: 2; padding: 6px;"
      />
      <select v-model="selectedCategory" style="flex: 1; padding: 6px;">
        <option value="">Toutes catégories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <!-- Liste filtrée des exercices -->
    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #eee; border-radius: 4px;">
      <div 
        v-for="ex in filteredExercises" 
        :key="ex.wger_id" 
        @click="$emit('select', ex)"
        style="padding: 8px; border-bottom: 1px solid #f0f0f0; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
        onmouseover="this.style.background='#f9f9f9'"
        onmouseout="this.style.background='white'"
      >
        <div>
          <strong>{{ ex.name }}</strong>
          <span style="font-size: 12px; color: #666; margin-left: 8px;">({{ ex.category || 'Général' }})</span>
        </div>
        <button style="background: #27ae60; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Sélectionner</button>
      </div>
      <div v-if="filteredExercises.length === 0" style="padding: 10px; text-align: center; color: #888;">
        Aucun exercice trouvé.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const emit = defineEmits(['select'])

const exercises = ref([])
const searchQuery = ref('')
const selectedCategory = ref('')
const categories = ref([])

onMounted(async () => {
  const { data, error } = await supabase.from('exercises').select('*').order('name')
  if (!error && data) {
    exercises.value = data
    // Extraire les catégories uniques pour le filtre
    const cats = new Set(data.map(e => e.category).filter(Boolean))
    categories.value = Array.from(cats)
  }
})

const filteredExercises = computed(() => {
  return exercises.value.filter(ex => {
    const matchName = ex.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCat = selectedCategory.value ? ex.category === selectedCategory.value : true
    return matchName && matchCat
  })
})
</script>