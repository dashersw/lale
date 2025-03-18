import { updateCameraLookDirection } from '../camera'
import { MAX_VERTICAL_ANGLE, updatePlayerPosition } from '../player/movement'
import { isFlashlightActive, keysPressed, mouseControlsEnabled, player, toggleFlashlight } from '../state'
import { tryInteractWithNearbyDoor } from './interactions/doors'
import { handleMouseMove, toggleMouseControls } from './mouse'

export function setupKeyboardControls() {
  console.log('Setting up keyboard and mouse controls')

  // Track key presses
  document.addEventListener('keydown', event => {
    // Prevent repeated keypresses for toggle functions
    if (event.repeat) return

    // Store key in keysPressed object
    keysPressed[event.key] = true

    // Handle looking up and down with keyboard
    if (event.key === 'r') {
      // Look up
      player.verticalAngle = Math.min(player.verticalAngle + 0.1, MAX_VERTICAL_ANGLE)
      updateCameraLookDirection()
    } else if (event.key === 'f') {
      // Look down
      player.verticalAngle = Math.max(player.verticalAngle - 0.1, -MAX_VERTICAL_ANGLE)
      updateCameraLookDirection()
    } else if (event.key === ' ' || event.key === 'Space') {
      // Space bar pressed to interact with doors
      tryInteractWithNearbyDoor()
    }

    // Toggle mouse controls with M key
    if (event.key === 'm') {
      toggleMouseControls()
    }

    // Toggle debug visualization with G key
    if (event.key === 'g') {
      toggleDebugVisualization()
    }

    // Toggle flashlight with L key
    if (event.key === 'l') {
      toggleFlashlight()
      console.log(`Flashlight turned ${isFlashlightActive ? 'ON' : 'OFF'}`)
    }
  })

  document.addEventListener('keyup', event => {
    // Remove key from keysPressed object
    keysPressed[event.key] = false
  })

  // Setup mouse movement for looking around
  const gameContainer = document.querySelector('.game-container')
  if (gameContainer) {
    gameContainer.addEventListener('mousemove', handleMouseMove)
    gameContainer.addEventListener('click', () => {
      if (!mouseControlsEnabled) {
        toggleMouseControls()
      }
    })
  }

  // Initial call to make sure player is in the right position
  updatePlayerPosition()
}
