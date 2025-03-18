import { updateCameraLookDirection } from '../camera'
import { MAX_VERTICAL_ANGLE } from '../player/movement'
import { disableMouseControls, enableMouseControls, mouseControlsEnabled, player } from '../state'

// Toggle mouse controls (pointer lock)
export function toggleMouseControls() {
  const gameContainer = document.querySelector('.game-container')
  if (!gameContainer) return

  if (!mouseControlsEnabled) {
    gameContainer.requestPointerLock =
      gameContainer.requestPointerLock || gameContainer.mozRequestPointerLock || gameContainer.webkitRequestPointerLock

    gameContainer.requestPointerLock()

    // Listen for pointer lock change
    document.addEventListener('pointerlockchange', handlePointerLockChange)
    document.addEventListener('mozpointerlockchange', handlePointerLockChange)
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange)
  } else {
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock
    document.exitPointerLock()
  }
}

// Handle pointer lock change
export function handlePointerLockChange() {
  if (
    document.pointerLockElement === document.querySelector('.game-container') ||
    document.mozPointerLockElement === document.querySelector('.game-container') ||
    document.webkitPointerLockElement === document.querySelector('.game-container')
  ) {
    enableMouseControls()
  } else {
    disableMouseControls()
  }
}

// Handle mouse movement for camera rotation
export function handleMouseMove(event) {
  if (!mouseControlsEnabled || !camera) return

  // Horizontal rotation (left/right)
  const horizontalSensitivity = 0.003
  player.direction = (player.direction + event.movementX * horizontalSensitivity) % 4
  if (player.direction < 0) player.direction += 4

  // Vertical rotation (up/down)
  const verticalSensitivity = 0.003
  player.verticalAngle -= event.movementY * verticalSensitivity

  // Clamp vertical angle to prevent flipping
  player.verticalAngle = Math.max(-MAX_VERTICAL_ANGLE, Math.min(MAX_VERTICAL_ANGLE, player.verticalAngle))

  updateCameraLookDirection()
}
