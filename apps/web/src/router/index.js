import { createRouter, createWebHistory } from 'vue-router'
import { auth, homeFor } from '../stores/auth'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { guest: true } },
  { path: '/register', component: () => import('../views/RegisterView.vue'), meta: { guest: true } },
  { path: '/change-password', component: () => import('../views/ChangePasswordView.vue') },
  { path: '/passenger', component: () => import('../views/PassengerDashboard.vue'), meta: { role: 'PASSENGER' } },
  { path: '/passenger/trips', component: () => import('../views/MyTripsView.vue'), meta: { role: 'PASSENGER' } },
  { path: '/driver', component: () => import('../views/DriverDashboard.vue'), meta: { role: 'DRIVER' } },
  {
    path: '/admin',
    component: () => import('../views/AdminLayout.vue'),
    meta: { role: 'ADMIN' },
    children: [
      { path: '', component: () => import('../views/AdminDashboard.vue') },
      { path: 'drivers', component: () => import('../views/AdminDrivers.vue') },
      { path: 'routes', component: () => import('../views/AdminRoutes.vue') },
      { path: 'trips', component: () => import('../views/AdminTrips.vue') },
      { path: 'units', component: () => import('../views/AdminUnits.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to) => {
  const user = auth.user

  // Contraseña temporal: la única pantalla permitida es la de cambio de contraseña
  if (user?.mustChangePassword && to.path !== '/change-password') return '/change-password'
  if (to.path === '/change-password') {
    if (!user) return '/login'
    if (!user.mustChangePassword) return homeFor(user.role)
  }

  if (to.meta.guest && user) return homeFor(user.role)
  if (to.meta.role) {
    if (!user) return '/login'
    if (user.role !== to.meta.role) return homeFor(user.role)
  }
})

export default router
