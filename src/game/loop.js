import { camera } from './engine/camera'
import { handleDoorClick } from './engine/controls/interactions/doors'
import { handlePointerLockChange } from './engine/controls/mouse'
import { updatePlayerFlashlight } from './engine/lighting'
import { handleContinuousMovement } from './engine/player/movement'
import { updateDoorAnimations } from './engine/world/doors'
import { renderer, scene } from './engine/world/scene'

let animationId
// FPS counter variables
const fpsUpdateInterval = 250 // More frequent updates for better accuracy (was 500ms)
let lastFrameTime = 0
let frameCount = 0
let fps = 0
let lastFpsUpdate = 0

// Start animation loop
export function startAnimation() {
  animationId = requestAnimationFrame(animate)
}

// Animation loop
function animate() {
  if (!scene || !camera || !renderer) {
    console.error('Cannot animate: scene, camera, or renderer is not initialized')
    return
  }

  animationId = requestAnimationFrame(animate)

  const currentTime = performance.now()

  // Calculate FPS
  frameCount++
  if (currentTime - lastFpsUpdate > fpsUpdateInterval) {
    fps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdate))

    // Update the Vue component's FPS display if the function is available
    window.updateFps?.(fps)

    lastFpsUpdate = currentTime
    frameCount = 0
  }

  // Handle continuous movement based on keys pressed
  handleContinuousMovement()

  // Update door animations
  updateDoorAnimations()

  // Update the player's flashlight position to follow player
  updatePlayerFlashlight()

  const breathAmount = 0.005
  const breathFrequency = 1
  const breath = Math.sin((Date.now() / 1000) * breathFrequency * Math.PI) * breathAmount
  camera.position.y = 0.5 + breath

  renderer.render(scene, camera)

  lastFrameTime = currentTime
}

// Clean up resources
export function cleanup() {
  console.log('Cleaning up game resources')

  // Remove event listeners
  document.removeEventListener('pointerlockchange', handlePointerLockChange)
  document.removeEventListener('mozpointerlockchange', handlePointerLockChange)
  document.removeEventListener('webkitpointerlockchange', handlePointerLockChange)

  if (renderer?.domElement) {
    renderer.domElement.removeEventListener('click', handleDoorClick)
  }

  if (animationId) {
    cancelAnimationFrame(animationId)
  }
}
