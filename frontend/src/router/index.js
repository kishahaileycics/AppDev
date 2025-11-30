import { createRouter, createWebHistory } from 'vue-router'
import LoginLandingPage from '../views/LoginLandingPage.vue'
import LoginPage from '../views/LoginPage.vue'
import Signup from '../views/Signup.vue'
import Dashboard from '../views/dashboard.vue'
import Packages from '../views/Packages.vue'
import Booking from '../views/MainBooking.vue'
import PackagesCustomer from '../views/PackagesCutomer.vue'
import SummaryBooking from '../views/SummaryBooking.vue'

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
    },

    { path: '/dashboard', 
      name: 'dashboard', 
      component: Dashboard },
      
    {
      path: '/packages',
      name: 'packages',
      component: Packages
    },


    {
      path: '/mainbooking',
      name: 'mainbooking',
      component: Booking
    },  

     {
      path: '/packagescustomer',
      name: 'packagescustomer',
      component: PackagesCustomer
    },
    {
      path: '/summarybooking',
      name: 'summarybooking',
      component: SummaryBooking
    },
  ]
})

export default router