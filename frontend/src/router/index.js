import { createRouter, createWebHistory } from 'vue-router'
import LoginLandingPage from '../views/LoginLandingPage.vue'
import LoginPage from '../views/LoginPage.vue'
import Signup from '../views/Signup.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LoginLandingPage
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage
    },
    {
      path: '/signup',
      name: 'signup',
      component: Signup
    }
  ]
})

export default router