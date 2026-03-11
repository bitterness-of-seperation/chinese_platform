import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/assistant',
      name: 'assistant',
      component: () => import('../views/Assistant.vue'),
      meta: { hideBottomNav: true },
    },
    {
      path: '/dictionary',
      name: 'dictionary',
      component: () => import('../views/Dictionary.vue'),
    },
    {
      path: '/exercises',
      name: 'exercises',
      component: () => import('../views/WordExercise.vue'),
    },
    {
      path: '/vocabulary',
      name: 'vocabulary',
      component: () => import('../views/WordProgress.vue'),
    },
    {
      path: '/vocabulary-learning',
      name: 'vocabulary-learning',
      component: () => import('../views/WordLearning.vue'),
    },
    {
      path: '/readings',
      name: 'readings',
      component: () => import('../views/Blank.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue'),
    },
    {
      path: '/community',
      name: 'community',
      component: () => import('../views/Blank.vue'),
    },
    {
      path: '/vip',
      name: 'vip',
      component: () => import('../views/Blank.vue'),
    }
  ],
});

export default router; 