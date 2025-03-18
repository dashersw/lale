<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import MiniMap from './MiniMap.vue'
import { getPlayerInfo, isPlayerMoving as getIsPlayerMoving } from '../game/engine/index.js'
import { handleTouchMove as engineHandleTouchMove } from '../game/engine/controls/touch.js'
import { isFlashlightActive as engineFlashlightActive, toggleFlashlight } from '../game/engine/state.js'

import { movePlayerDirectly } from '../game/engine/player/movement.js'
import { inject } from '@vercel/analytics'
import { initScene } from '../game/engine/world/scene.js'
import { cleanup } from '../game/loop.js'
import { setupKeyboardControls } from '../game/engine/controls/keyboard.js'
import { tryInteractWithNearbyDoor } from '../game/engine/controls/interactions/doors.js'
inject()
const gameCanvas = ref(null)
const playerPosition = ref({ x: 0, y: 0, direction: 0, verticalAngle: 0 })
const errorMessage = ref('')
const isCanvasMounted = ref(false)
const isSceneInitialized = ref(false)
const isPlayerMoving = ref(false)
const debugInfo = ref(false) // Hide debug info
let animationFrameId = null
const isTouchDevice = ref(false)

// Touch interaction state
const touchStartX = ref(0)
const touchStartY = ref(0)
const isTouchActive = ref(false)

// Animation state
let touchAnimationFrame = null

// Add these reactive variables for the floating controls
const moveControlActive = ref(false)
const moveControlStartX = ref(0)
const moveControlStartY = ref(0)
const moveThumbX = ref(0)
const moveThumbY = ref(0)
const maxMoveDistance = 50 // Maximum distance the thumb can move from center
const moveTouchId = ref(null)

// Add these reactive variables for the camera control
const cameraControlActive = ref(false)
const cameraControlStartX = ref(0)
const cameraControlStartY = ref(0)
const cameraThumbX = ref(0)
const cameraThumbY = ref(0)

// Add this new state for minimap toggling
const showMinimap = ref(true)

// Add the missing variable declarations
const cameraTouchId = ref(null)
const lastCameraX = ref(0)
const lastCameraY = ref(0)

// A simple ref for the UI - we'll sync this with the engine state
const isFlashlightActive = ref(engineFlashlightActive)

// Add FPS counter state
const fps = ref(0)
const showFps = ref(true)

// Toggle minimap visibility
const toggleMinimap = () => {
  showMinimap.value = !showMinimap.value
}

// Handle touch end for camera control
const handleCameraEnd = event => {
  // Check if this is the camera touch
  let touchFound = false
  for (let i = 0; i < event.changedTouches.length; i++) {
    if (event.changedTouches[i].identifier === cameraTouchId.value) {
      touchFound = true
      break
    }
  }

  if (touchFound) {
    cameraControlActive.value = false
    cameraThumbX.value = 0
    cameraThumbY.value = 0
    lastCameraX.value = 0
    lastCameraY.value = 0
    cameraTouchId.value = null
  }
}

// Computed property to show vertical angle in degrees
const verticalLookAngle = computed(() => {
  const degrees = ((playerPosition.value.verticalAngle * 180) / Math.PI).toFixed(0)
  return `${degrees}° ${degrees > 0 ? 'up' : degrees < 0 ? 'down' : 'level'}`
})

// Update player position for minimap
const updatePlayerInfo = () => {
  try {
    playerPosition.value = getPlayerInfo()
    isPlayerMoving.value = getIsPlayerMoving()
    // Schedule the next update
    animationFrameId = requestAnimationFrame(updatePlayerInfo)
  } catch (error) {
    errorMessage.value = `Error updating player info: ${error.message}`
    console.error('Error updating player info:', error)
  }
}

// Add this new highlightButton function
const highlightButton = event => {
  const button = event.currentTarget
  button.style.opacity = '0.7'
}

const handleTouchAction = event => {
  event.preventDefault()
  event.stopPropagation()

  // Reset button appearance
  const button = event.currentTarget
  button.style.opacity = '1'

  // Call door interact function twice to ensure it works
  console.log('Interacting with door - first attempt')
  tryInteractWithNearbyDoor()

  // Call again after a short delay to ensure it works on the first tap
  setTimeout(() => {
    console.log('Interacting with door - second attempt')
    tryInteractWithNearbyDoor()
  }, 50)
}

// Detect if device supports touch
const detectTouchDevice = () => {
  isTouchDevice.value =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches // More reliable detection for modern browsers
}

// Handle window resize for responsive canvas
const handleResize = () => {
  if (gameCanvas.value && isSceneInitialized.value) {
    const container = gameCanvas.value
    const renderer = container.children[0]

    if (renderer) {
      renderer.style.width = '100%'
      renderer.style.height = '100%'

      // Update canvas resolution
      if (window.renderer) {
        window.renderer.setSize(container.clientWidth, container.clientHeight)

        // Update camera aspect ratio
        if (window.camera) {
          window.camera.aspect = container.clientWidth / container.clientHeight
          window.camera.updateProjectionMatrix()
        }
      }
    }
  }
}

// Initialize the game
const initGame = () => {
  try {
    if (!gameCanvas.value) {
      errorMessage.value = 'Game canvas element not found'
      console.error('Game canvas element not found')
      return
    }

    console.log('Game canvas element found:', gameCanvas.value)

    // Initialize Three.js scene
    const result = initScene(gameCanvas.value)

    if (!result?.scene || !result?.camera || !result?.renderer) {
      errorMessage.value = 'Failed to initialize 3D scene properly'
      console.error('Failed to initialize 3D scene properly')
      return
    }

    // Save references for resize handling
    window.renderer = result.renderer
    window.camera = result.camera

    isSceneInitialized.value = true
    console.log('Scene initialized successfully')

    // Set up keyboard controls
    setupKeyboardControls()

    // Start updating player info for minimap
    updatePlayerInfo()

    // Set up responsive handling
    handleResize()

    console.log('Game initialized successfully')
  } catch (error) {
    errorMessage.value = `Error initializing game: ${error.message}`
    console.error('Error initializing game:', error)
  }
}

// Initialize game when component is mounted
onMounted(() => {
  console.log('Game component mounted')

  // Detect touch device
  detectTouchDevice()

  // Add window resize listener
  window.addEventListener('resize', handleResize)

  // Expose the updateFps method to the window object for the game loop to call
  window.updateFps = fpsValue => {
    fps.value = fpsValue
  }

  // Set up a polling interval to check for flashlight state changes
  // This is simpler than using custom events and works well for this use case
  const flashlightStateCheckInterval = setInterval(() => {
    if (isFlashlightActive.value !== engineFlashlightActive) {
      isFlashlightActive.value = engineFlashlightActive
    }
  }, 100) // Check every 100ms which is sufficient for UI updates

  if (gameCanvas.value) {
    isCanvasMounted.value = true

    // Initialize the game after a short delay to ensure DOM is fully ready
    setTimeout(initGame, 100)
  } else {
    errorMessage.value = 'Game canvas element not available'
  }

  // Store the interval ID for cleanup
  window.flashlightStateCheckInterval = flashlightStateCheckInterval
})

// Calculate the current room number based on player position
const getCurrentRoom = () => {
  // Each room is 3x3 in the map
  // The center row/col of each room has coordinates of (roomX * 3 + 1, roomY * 3 + 1)
  // So to get the room coordinates from map coordinates, we do the reverse
  const roomX = Math.floor(playerPosition.value.x / 3)
  const roomY = Math.floor(playerPosition.value.y / 3)

  // Room number is (roomY * 10 + roomX + 1) assuming a 10x10 grid of rooms
  // +1 because rooms are 1-indexed for display
  const roomNumber = roomY * 10 + roomX + 1

  return `Room ${roomNumber} (${roomX},${roomY})`
}

onBeforeUnmount(() => {
  // Clean up animation frame
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  // Clean up touch animation
  if (touchAnimationFrame) {
    cancelAnimationFrame(touchAnimationFrame)
    touchAnimationFrame = null
  }

  // Remove window resize listener
  window.removeEventListener('resize', handleResize)

  // Remove FPS update method
  window.updateFps = null

  // Clear the flashlight state check interval
  if (window.flashlightStateCheckInterval) {
    clearInterval(window.flashlightStateCheckInterval)
    window.flashlightStateCheckInterval = null
  }

  // Clean up Three.js resources
  cleanup()
})

// Handle touch end for movement control
const handleMoveTouchEnd = event => {
  // Check if this is the movement touch
  let touchFound = false
  for (let i = 0; i < event.changedTouches.length; i++) {
    if (event.changedTouches[i].identifier === moveTouchId.value) {
      touchFound = true
      break
    }
  }

  if (touchFound) {
    moveControlActive.value = false
    moveThumbX.value = 0
    moveThumbY.value = 0
    moveTouchId.value = null

    // Cancel any ongoing movement animation
    if (window.movementAnimationFrame) {
      cancelAnimationFrame(window.movementAnimationFrame)
      window.movementAnimationFrame = null
    }

    // Explicitly stop all movement by sending key up events for movement keys
    const keysToRelease = ['w', 's', 'a', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    for (const key of keysToRelease) {
      const keyupEvent = new KeyboardEvent('keyup', {
        key,
        bubbles: true,
        cancelable: true
      })
      window.dispatchEvent(keyupEvent)
      document.dispatchEvent(keyupEvent)
    }

    console.log('Movement control deactivated and all movement stopped')
  }
}

// Fix combinedTouchStart to use the movement system directly instead of through the old methods
const combinedTouchStart = event => {
  // Skip if touching control buttons
  if (
    event.target.closest('.floating-action-button') ||
    event.target.closest('.floating-map-button') ||
    event.target.closest('.floating-light-button')
  ) {
    return
  }

  // Process all new touches - support multi-touch by handling all touch points
  for (let i = 0; i < event.changedTouches.length; i++) {
    const touch = event.changedTouches[i]
    const isLeftSide = touch.clientX < window.innerWidth / 2

    // We can have both controls active at the same time for true multi-touch
    if (isLeftSide && !moveControlActive.value) {
      // Left side - movement control
      moveControlActive.value = true
      moveControlStartX.value = touch.clientX
      moveControlStartY.value = touch.clientY
      moveThumbX.value = 0
      moveThumbY.value = 0
      moveTouchId.value = touch.identifier

      // Call handleMovement immediately to start movement
      handleMovement()

      console.log('Movement pad activated')
    } else if (!isLeftSide && !cameraControlActive.value) {
      // Right side - camera control
      cameraControlActive.value = true
      cameraControlStartX.value = touch.clientX
      cameraControlStartY.value = touch.clientY
      cameraThumbX.value = 0
      cameraThumbY.value = 0
      cameraTouchId.value = touch.identifier

      console.log('Camera pad activated')
    }
  }
}

// Update the combinedTouchMove function to properly handle both controls
const combinedTouchMove = event => {
  // Prevent default to avoid browser handling
  event.preventDefault()

  // Handle movement control if active
  if (moveControlActive.value) {
    // Find the correct touch point for movement
    let touchPoint = null
    for (let i = 0; i < event.touches.length; i++) {
      if (event.touches[i].identifier === moveTouchId.value) {
        touchPoint = event.touches[i]
        break
      }
    }

    if (touchPoint) {
      // Calculate the delta from the start position
      const deltaX = touchPoint.clientX - moveControlStartX.value
      const deltaY = touchPoint.clientY - moveControlStartY.value

      // Calculate distance from center
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance > maxMoveDistance) {
        // Normalize to max distance
        const ratio = maxMoveDistance / distance
        moveThumbX.value = deltaX * ratio
        moveThumbY.value = deltaY * ratio
      } else {
        moveThumbX.value = deltaX
        moveThumbY.value = deltaY
      }

      // Determine movement direction based on thumb position
      handleMovement()
    }
  }

  // Handle camera control if active
  if (cameraControlActive.value) {
    // Find the correct touch point for camera
    let touchPoint = null
    for (let i = 0; i < event.touches.length; i++) {
      if (event.touches[i].identifier === cameraTouchId.value) {
        touchPoint = event.touches[i]
        break
      }
    }

    if (touchPoint) {
      // Calculate the delta from the start position
      const deltaX = touchPoint.clientX - cameraControlStartX.value
      const deltaY = touchPoint.clientY - cameraControlStartY.value

      // Calculate distance from center
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (distance > maxMoveDistance) {
        // Normalize to max distance
        const ratio = maxMoveDistance / distance
        cameraThumbX.value = deltaX * ratio
        cameraThumbY.value = deltaY * ratio
      } else {
        cameraThumbX.value = deltaX
        cameraThumbY.value = deltaY
      }

      // Calculate deltas for camera movement
      const moveDeltaX = cameraThumbX.value - (lastCameraX.value || 0)
      const moveDeltaY = cameraThumbY.value - (lastCameraY.value || 0)

      // Update the camera using the engine's handler
      if (Math.abs(moveDeltaX) > 0 || Math.abs(moveDeltaY) > 0) {
        engineHandleTouchMove(moveDeltaX * 3, moveDeltaY * 3) // Multiply for more sensitivity
      }

      // Store the current position for next delta calculation
      lastCameraX.value = cameraThumbX.value
      lastCameraY.value = cameraThumbY.value
    }
  }
}

const combinedTouchEnd = event => {
  // Clean up both control systems
  handleMoveTouchEnd(event)
  handleCameraEnd(event)
}

const handleToggleFlashlight = () => {
  // Use the engine's toggleFlashlight function directly
  toggleFlashlight()
  // Sync local state with engine state
  isFlashlightActive.value = engineFlashlightActive
}

// Process movement based on joystick position with direct engine function calls
const handleMovement = () => {
  // Movement threshold - minimum distance to trigger movement
  const threshold = 3 // Increased threshold from 3 to 5 for less sensitivity

  // Calculate normalized direction vector from joystick position
  let dx = 0
  let dy = 0

  if (Math.abs(moveThumbX.value) > threshold || Math.abs(moveThumbY.value) > threshold) {
    // Calculate normalized direction (-1 to 1 range)
    dx = moveThumbX.value / maxMoveDistance
    dy = -moveThumbY.value / maxMoveDistance // Negative because Y is inverted (up is negative)

    // Scale up the movement for better responsiveness, increased from 0.1 to 0.3
    const speedMultiplier = 0.3
    dx *= speedMultiplier
    dy *= speedMultiplier

    // Apply direct player movement
    movePlayerDirectly(dx, dy)
  }

  // Continue movement while the control is active, regardless of current thumb position
  if (moveControlActive.value) {
    window.movementAnimationFrame = requestAnimationFrame(handleMovement)
  }
}
</script>

<template>
  <div
    class="game-container"
    @touchstart.prevent="combinedTouchStart"
    @touchmove.prevent="combinedTouchMove"
    @touchend.prevent="combinedTouchEnd"
    @touchcancel.prevent="combinedTouchEnd"
  >
    <div ref="gameCanvas" class="game-canvas"></div>

    <!-- FPS Counter -->
    <div v-if="showFps" class="fps-counter">FPS: {{ fps }}</div>

    <!-- Controls info for desktop users -->
    <div v-if="!isTouchDevice" class="controls-info">
      <div>WASD or Arrow Keys: Move</div>
      <div>R/F: Look up/down</div>
      <div>M: Toggle mouse controls</div>
      <div>Space: Interact with doors</div>
      <div>G: Toggle debug mode</div>
      <div>L: Toggle flashlight ({{ isFlashlightActive ? 'ON' : 'OFF' }})</div>
    </div>

    <!-- Mobile touch controls -->
    <div v-if="isTouchDevice" class="touch-controls">
      <!-- Floating movement pad (left side) -->
      <div
        v-if="moveControlActive"
        class="floating-control-pad"
        :style="{ left: moveControlStartX + 'px', top: moveControlStartY + 'px' }"
      >
        <div class="control-pad-background"></div>
        <div class="control-pad-center"></div>
        <div
          class="control-pad-thumb"
          :style="{
            transform: `translate(${moveThumbX}px, ${moveThumbY}px)`
          }"
        ></div>
      </div>

      <!-- Floating camera pad (right side) -->
      <div
        v-if="cameraControlActive"
        class="floating-control-pad camera-pad"
        :style="{ left: cameraControlStartX + 'px', top: cameraControlStartY + 'px' }"
      >
        <div class="control-pad-background"></div>
        <div class="control-pad-center"></div>
        <div
          class="control-pad-thumb"
          :style="{
            transform: `translate(${cameraThumbX}px, ${cameraThumbY}px)`
          }"
        ></div>
      </div>

      <!-- Action button -->
      <button
        class="touch-button action-button floating-action-button"
        @touchend.prevent.stop="handleTouchAction"
        @touchstart.prevent.stop="highlightButton"
      >
        <span>INTERACT</span>
      </button>

      <!-- Map button - hide when map is already shown -->
      <button v-if="!showMinimap" class="touch-button map-button floating-map-button" @touchstart.stop="toggleMinimap">
        <span>MAP</span>
      </button>

      <!-- Flashlight toggle button -->
      <button class="touch-button light-button floating-light-button" @touchstart.stop="handleToggleFlashlight">
        <span>LIGHT</span>
      </button>
    </div>

    <!-- Visual indicator for touch area detection -->
    <div
      v-if="isTouchActive && isTouchDevice"
      class="touch-indicator"
      :style="{ left: touchStartX + 'px', top: touchStartY + 'px' }"
    ></div>

    <MiniMap
      v-if="playerPosition.x !== undefined"
      :playerX="playerPosition.x"
      :playerY="playerPosition.y"
      :playerDirection="playerPosition.direction"
    />

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- Debug info panel (conditionally shown) -->
    <div v-if="debugInfo" class="debug-info">
      <p>Player: {{ playerPosition.x.toFixed(2) }}, {{ playerPosition.y.toFixed(2) }}</p>
      <p>Direction: {{ ((playerPosition.direction * 180) / Math.PI).toFixed(0) }}°</p>
      <p>Look: {{ verticalLookAngle }}</p>
      <p>{{ getCurrentRoom() }}</p>
      <p>Moving: {{ isPlayerMoving ? 'Yes' : 'No' }}</p>
    </div>
  </div>
</template>

<style scoped>
.game-container {
  position: relative;
  width: 100%;
  height: 600px;
  overflow: hidden;
  background-color: #111;
  cursor: crosshair;
  touch-action: none; /* Prevent browser handling of all panning and zooming gestures */
}

/* Make game container full screen on mobile */
@media (max-width: 768px) {
  .game-container {
    height: 100vh;
    min-height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}

/* For smaller mobile devices */
@media (max-width: 480px) {
  .game-container {
    height: 100vh;
    min-height: 100vh;
  }
}

.game-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Touch controls */
.touch-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allow interaction with game beneath */
  z-index: 20;
}

/* Floating joystick control */
.floating-control-pad {
  position: absolute;
  width: 120px;
  height: 120px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.control-pad-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.control-pad-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
}

.control-pad-thumb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

/* Action button */
.floating-action-button {
  position: absolute;
  bottom: 100px; /* Increased from 30px to 50px for more bottom margin */
  right: 30px;
  width: 70px;
  height: 70px;
  background-color: rgba(70, 130, 180, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  pointer-events: auto;
}

/* Map button */
.floating-map-button {
  position: absolute;
  bottom: 50px;
  left: 30px;
  width: 70px;
  height: 70px;
  background-color: rgba(50, 170, 100, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  pointer-events: auto;
}

/* Flashlight toggle button */
.floating-light-button {
  position: absolute;
  top: 30px;
  left: 30px;
  width: 70px;
  height: 70px;
  background-color: rgba(255, 200, 50, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  pointer-events: auto;
  z-index: 25;
}

/* Touch indicator for debugging */
.touch-indicator {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(255, 0, 0, 0.5);
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 30;
}

.controls-help {
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
  z-index: 10;
}

.controls-help h3 {
  margin: 0 0 10px 0;
}

.controls-help p {
  margin: 5px 0;
}

.controls-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 14px;
  z-index: 1000;
}

.fps-counter {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #00ff00;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 12px;
  z-index: 100;
  opacity: 0.7;
  pointer-events: none;
}

.debug-info {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
  z-index: 10;
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  padding: 20px;
  border-radius: 5px;
  font-family: monospace;
  z-index: 100;
  text-align: center;
  max-width: 90%;
}

/* Ensure controls info is hidden on mobile */
@media (max-width: 768px), (pointer: coarse) {
  :global(.controls-info) {
    display: none !important;
  }
}

/* Minimap positioning for mobile devices */
@media (max-width: 768px), (pointer: coarse) {
  :deep(.mini-map-container) {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 100px; /* Smaller size for mobile */
    height: 100px;
    z-index: 20;
  }
}
</style>
