import { isFlashlightActive, toggleFlashlight, player } from './state.js'
// Game state
const targetPosition = { ...player }
const currentRotation = 0
const targetRotation = 0
const isMoving = false
const moveStartTime = 0

// Get player's current position and direction for the minimap
export function getPlayerInfo() {
  return { ...player }
}

// Check if player is currently moving
export function isPlayerMoving() {
  return isMoving
}
