import { createApp } from 'vue'
import App from './App.vue'

console.log('Starting application...')

// Create app and mount it
const app = createApp(App)

// Simple console output to verify mount
app.config.errorHandler = err => {
  console.error('Vue Error:', err)
}

// Mount to #app
app.mount('#app')
