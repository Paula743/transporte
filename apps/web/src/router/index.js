import { createRouter, createWebHistory } from 'vue-router'
import { auth, homeFor } from '../stores/auth'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { guest: true } },
  { path: '/register', component: () => import('../views/RegisterView.vue'), meta: { guest: true } },
  { path: '/passenger', component: () => import('../views/PassengerDashboard.vue'), meta: { role: 'PASSENGER' } },
  { path: '/passenger/trips', component: () => import('../views/MyTripsView.vue'), meta: { role: 'PASSENGER' } },
  { path: '/driver', component: () => import('../views/DriverDashboard.vue'), meta: { role: 'DRIVER' } },
  { path: '/admin', component: () => import('../views/AdminDashboard.vue'), meta: { role: 'ADMIN' } },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const user = auth.user
  if (to.meta.guest && user) return homeFor(user.role)
  if (to.meta.role) {
    if (!user) return '/login'
    if (user.role !== to.meta.role) return homeFor(user.role)
  }
})

export default router
