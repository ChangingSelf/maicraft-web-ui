import { createRouter, createWebHistory } from 'vue-router'
import LogViewer from '../views/LogViewer.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/logs',
    },
    {
      path: '/logs',
      name: 'logs',
      component: LogViewer,
      meta: {
        title: '日志查看器',
      },
    },
  ],
})

export default router
