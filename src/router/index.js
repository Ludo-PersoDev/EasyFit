import { createRouter, createWebHistory } from 'vue-router'
import Auth from '../views/Auth.vue'
import Onboarding from '../views/Onboarding.vue'
import Dashboard from '../views/Dashboard.vue'
import WorkoutLogger from '../views/WorkoutLogger.vue'
import WorkoutList from '../views/WorkoutList.vue'
import Progress from '../views/ProgressView.vue'
import Profile from '../views/Profile.vue'

const routes = [
  { path: '/', component: Auth },
  { path: '/onboarding', component: Onboarding },
  { path: '/dashboard', component: Dashboard },
  { path: '/workout', component: WorkoutLogger },
  { path: '/workoutlist', component: WorkoutList },
  { path: '/Progress', component: Progress },
  { path: '/profile', component: Profile }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router