import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'

// 导入全局错误处理器和拦截器
import globalErrorHandler from './services/errorHandler'
import { registerDefaultInterceptors } from './services/interceptors'

const app = createApp(App)

// 配置Vue错误处理器
app.config.errorHandler = (error, instance, info) => {
  console.error('Vue Error:', error, info)
  // 错误已经由全局错误处理器处理，这里不需要重复处理
}

// 初始化全局错误处理器
globalErrorHandler.init({
  enableLogging: true,
  enableUserNotifications: true,
  enableErrorReporting: false, // 在生产环境中可以启用
  maxErrorsInMemory: 50,
  logLevel: 'medium',
})

// 添加用户通知回调（集成Element Plus的消息提示）
globalErrorHandler.addNotificationCallback((error) => {
  // 使用Element Plus的消息提示
  if (window.ElMessage) {
    const type =
      error.level === 'critical' || error.level === 'high'
        ? 'error'
        : error.level === 'medium'
          ? 'warning'
          : 'info'

    window.ElMessage({
      message: error.userMessage,
      type,
      duration: error.level === 'low' ? 3000 : 5000,
      showClose: true,
    })
  }
})

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 注册默认的请求拦截器
const removeDefaultInterceptors = registerDefaultInterceptors()

app.mount('#app')
