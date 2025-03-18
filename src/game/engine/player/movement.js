import { getDirectionVector } from '../../helpers/vectors'
import { camera, updateCameraLookDirection } from '../camera'
import { player, keysPressed } from '../state'
import { checkCollision } from '../world/collisions'
import { updatePlayerFlashlight } from '../lighting'

const MOVEMENT_SPEED = 0.04

// Movement and control settings
export const MAX_VERTICAL_ANGLE = Math.PI / 3 // 60 degrees up/down

// Handle continuous movement based on keys pressed
export function handleContinuousMovement() {
  if (!camera) return

  // Get current forward direction based on player's rotation
  const forwardVector = getDirectionVector(player.direction)
  const rightVector = { x: -forwardVector.z, z: forwardVector.x } // perpendicular to forward

  let moveX = 0
  let moveZ = 0

  // Forward/backward movement
  if (keysPressed.w || keysPressed.ArrowUp) {
    moveX += forwardVector.x * MOVEMENT_SPEED
    moveZ += forwardVector.z * MOVEMENT_SPEED
  }
  if (keysPressed.s || keysPressed.ArrowDown) {
    moveX -= forwardVector.x * MOVEMENT_SPEED
    moveZ -= forwardVector.z * MOVEMENT_SPEED
  }

  // Strafing left/right
  if (keysPressed.a || keysPressed.ArrowLeft) {
    moveX -= rightVector.x * MOVEMENT_SPEED
    moveZ -= rightVector.z * MOVEMENT_SPEED
  }
  if (keysPressed.d || keysPressed.ArrowRight) {
    moveX += rightVector.x * MOVEMENT_SPEED
    moveZ += rightVector.z * MOVEMENT_SPEED
  }

  // If there's movement, check for collisions and update position
  if (moveX !== 0 || moveZ !== 0) {
    // Calculate new position
    const newX = player.x + moveX
    const newZ = player.y + moveZ

    // Check for collisions using real 3D physics
    if (!checkCollision(player.x, player.y, newX, newZ)) {
      // No collision, update position
      player.x = newX
      player.y = newZ

      // Update camera and flashlight position
      camera.position.x = newX
      camera.position.z = newZ
    }
  }

  // Rotate with Q/E keys
  if (keysPressed.q) {
    player.direction = (player.direction + 3.9) % 4 // Continuous rotation
    updateCameraLookDirection()
  }
  if (keysPressed.e) {
    player.direction = (player.direction + 0.1) % 4 // Continuous rotation
    updateCameraLookDirection()
  }
}

// Update the player's position and camera immediately (for initial setup)
export function updatePlayerPosition() {
  // Calculate player height with a breathing motion
  const time = Date.now() / 1000
  const height = 0.5 + Math.sin(time * 1.5) * 0.05

  // Update camera position
  camera.position.set(player.x, height, player.y)

  // Update camera look direction
  updateCameraLookDirection()

  // If flashlight exists, make sure it's updated
  if (player.flashlight) {
    updatePlayerFlashlight()
  }
}

// Don't need the old movement functions anymore since we're using continuous movement
// But we keep them for compatibility with existing code
export function moveForward() {
  keysPressed.w = true
  setTimeout(() => {
    keysPressed.w = false
  }, 200)
  return true
}

export function moveBackward() {
  keysPressed.s = true
  setTimeout(() => {
    keysPressed.s = false
  }, 200)
  return true
}

export function turnLeft() {
  keysPressed.q = true
  setTimeout(() => {
    keysPressed.q = false
  }, 200)
}

export function turnRight() {
  keysPressed.e = true
  setTimeout(() => {
    keysPressed.e = false
  }, 200)
}

// Export function to move the player directly without turning the camera
export function movePlayerDirectly(dx, dy) {
  if (!camera) return false

  // Get current forward and right vectors based on player's direction
  const forwardVector = getDirectionVector(player.direction)
  const rightVector = { x: -forwardVector.z, z: forwardVector.x } // perpendicular to forward

  // Calculate the new position using the dx/dy inputs
  // dx moves along the x-axis (left/right), dy moves along the z-axis (forward/backward)
  const moveX = (rightVector.x * dx + forwardVector.x * dy) * MOVEMENT_SPEED
  const moveZ = (rightVector.z * dx + forwardVector.z * dy) * MOVEMENT_SPEED

  // Calculate new position
  const newX = player.x + moveX
  const newZ = player.y + moveZ

  // Check for collisions
  if (!checkCollision(player.x, player.y, newX, newZ)) {
    // No collision, update position
    player.x = newX
    player.y = newZ

    // Update camera position only (not orientation)
    camera.position.x = newX
    camera.position.z = newZ

    return true
  }

  return false
}
