import { camera, updateCameraLookDirection } from '../camera'
import { MAX_VERTICAL_ANGLE } from '../player/movement'
import { player } from '../state'

// Handle touch movement for camera rotation - exported for Game.vue
export function handleTouchMove(deltaX, deltaY) {
  if (!camera) return

  // Horizontal rotation (left/right) - greatly increased sensitivity for touch
  const horizontalSensitivity = 0.02
  player.direction = (player.direction + deltaX * horizontalSensitivity) % 4
  if (player.direction < 0) player.direction += 4

  // Vertical rotation (up/down) - increased sensitivity for touch
  const verticalSensitivity = 0.01
  player.verticalAngle -= deltaY * verticalSensitivity

  // Clamp vertical angle to prevent flipping
  player.verticalAngle = Math.max(-MAX_VERTICAL_ANGLE, Math.min(MAX_VERTICAL_ANGLE, player.verticalAngle))

  updateCameraLookDirection()
}
