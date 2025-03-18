<script setup>
import Game from './components/Game.vue'
import MapViewer from './components/MapViewer.vue'
import { ref, onMounted } from 'vue'

const showMapViewer = ref(false)
const isMobile = ref(false)

function toggleView() {
  showMapViewer.value = !showMapViewer.value
}

// Check if device is mobile
function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  // Check mobile on initial load
  checkMobile()

  // Add resize listener to update mobile status
  window.addEventListener('resize', checkMobile)
})
</script>

<template>
  <div class="app" :class="{ mobile: isMobile }">
    <header>
      <h1>Lale</h1>

      <div class="controls">
        <button @click="toggleView" class="toggle-button">
          {{ showMapViewer ? 'Show Game' : 'Show Map Viewer' }}
        </button>
      </div>
    </header>

    <main>
      <Game v-if="!showMapViewer" />
      <MapViewer v-else />
    </main>

    <footer>
      <p>Inspired by Istanbul Efsaneleri: Lale Savascilari</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'Courier New', Courier, monospace;
  background-color: #000;
  color: #fff;
  padding: 20px;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  body {
    padding: 10px;
  }
}

.app {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px); /* Account for body padding */
}

/* Mobile layout */
.app.mobile {
  height: calc(100vh - 20px);
}

header {
  margin-bottom: 20px;
}

main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

h1 {
  margin-bottom: 10px;
  color: #ff0000;
  font-size: 2rem;
}

.controls {
  margin-bottom: 20px;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  h1 {
    font-size: 1.5rem;
    margin-bottom: 5px;
  }

  .controls {
    margin-bottom: 10px;
  }
}

.toggle-button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  border-radius: 4px;
}

/* Mobile button */
@media (max-width: 768px) {
  .toggle-button {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
}

.toggle-button:hover {
  background-color: #45a049;
}

footer {
  margin-top: 20px;
  font-size: 12px;
  color: #666;
}

/* Mobile footer */
@media (max-width: 768px) {
  footer {
    margin-top: 10px;
    font-size: 10px;
  }
}
</style>
