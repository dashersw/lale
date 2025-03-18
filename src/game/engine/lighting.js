import * as THREE from 'three'
import { scene } from './world/scene'
import { isFlashlightActive, player } from './state'
import { getDirectionVector } from '../helpers/vectors'
import { raycaster } from './world/collisions'
import { walls } from './world/builder'

// Keep track of the previous wall distance for smoothing
let previousWallDistance = 10 // Start with the default distance
const smoothingFactor = 0.2 // Lower = smoother transitions

// Update the player's flashlight to follow the player with a nice orbital motion
export function updatePlayerFlashlight() {
  if (!player.flashlight || !camera) return

  // Get camera's forward vector
  const forwardDirection = getDirectionVector(player.direction)

  // Calculate a position that's always in view
  // Base offsets - slightly offset to the right and below center of view
  const baseOffsetRight = -0.4 // Right offset
  const baseOffsetForward = 0.2 // Forward offset

  // Use raycasting to check for nearby walls
  let currentWallDistance = 10 // Default far distance
  if (raycaster) {
    // Set up raycaster to check in player's forward direction
    raycaster.set(
      new THREE.Vector3(player.x, 0.5, player.y),
      new THREE.Vector3(forwardDirection.x, 0, forwardDirection.z).normalize()
    )
    // Check for collisions with walls
    const intersects = raycaster.intersectObjects(walls)
    if (intersects.length > 0) {
      currentWallDistance = intersects[0].distance
    }
  }

  // Smooth the wall distance transition to prevent abrupt changes
  const smoothedWallDistance = previousWallDistance + (currentWallDistance - previousWallDistance) * smoothingFactor

  // Store the smoothed distance for the next frame
  previousWallDistance = smoothedWallDistance

  // Dynamically adjust offsets based on distance to walls
  // As we get closer to walls, reduce offsets to center the flashlight
  const adjustmentFactor = Math.min(1, smoothedWallDistance / 3) // Start adjusting at distance of 3 units
  const offsetRight = baseOffsetRight * adjustmentFactor
  const offsetForward = baseOffsetForward * adjustmentFactor

  // Calculate the right vector (perpendicular to forward)
  const rightVector = {
    x: -forwardDirection.z,
    z: forwardDirection.x
  }

  // Calculate position using camera direction + offsets
  const flashlightX = player.x + forwardDirection.x * offsetForward + rightVector.x * offsetRight
  const flashlightY = -0.9 // Fixed height - no bobbing
  const flashlightZ = player.y + forwardDirection.z * offsetForward + rightVector.z * offsetRight

  // Set the flashlight position - no bobbing animation
  player.flashlight.position.set(flashlightX, flashlightY, flashlightZ)

  // Get components
  const flashlightLight = player.flashlight.children.find(child => child instanceof THREE.SpotLight)
  const lightTarget = flashlightLight?.target

  if (flashlightLight && lightTarget) {
    // Apply flashlight active state - turn on/off the light
    if (isFlashlightActive) {
      // Turn on flashlight
      flashlightLight.intensity = 2.5
      flashlightLight.angle = Math.PI / 5 // Default angle
      flashlightLight.distance = 15 // Default distance
    } else {
      // Turn off flashlight light
      flashlightLight.intensity = 0
    }

    // Calculate the same target point the camera is looking at,
    // using player direction and vertical angle
    const verticalOffset = Math.tan(player.verticalAngle) * 2

    // Position the target where the camera is looking
    // Use the same calculation as in updateCameraLookDirection
    // Increase the distance multiplier from 5 to 10 for a longer beam
    const targetDistance = 2 // Default forward distance
    const targetVerticalMultiplier = 1 // Default vertical multiplier

    const targetX = player.x + forwardDirection.x * targetDistance
    const targetY = verticalOffset * targetVerticalMultiplier // Enhanced vertical scaling when looking up
    const targetZ = player.y + forwardDirection.z * targetDistance

    // Position the target in world space
    lightTarget.position.set(targetX, targetY, targetZ)

    // Adjust fog density based on player's position (denser in enclosed spaces)
    if (scene?.fog) {
      scene.fog.density = 0.25
    }
  }
}

// Create the player's flashlight that follows them
export function createPlayerFlashlight() {
  const flashlightLight = new THREE.SpotLight(0xffffff, 1.5, 15, Math.PI / 5, 0.2, 1.5)
  flashlightLight.castShadow = true
  flashlightLight.shadow.mapSize.width = 512
  flashlightLight.shadow.mapSize.height = 512
  flashlightLight.shadow.bias = -0.0005
  // Increase shadow camera near value to prevent artifacts
  flashlightLight.shadow.camera.near = 0.1
  // Increase shadow camera far value to reach the ceiling
  flashlightLight.shadow.camera.far = 30
  // Increase shadow camera fov to cover wider area
  flashlightLight.shadow.camera.fov = 50
  // Make spotlight shadows softer
  flashlightLight.shadow.radius = 2

  // Create light target for the spotlight to aim at
  const lightTarget = new THREE.Object3D()
  lightTarget.position.set(0, 0, -5) // Initially pointing forward
  flashlightLight.target = lightTarget

  // Create a group to hold the flashlight and light
  const flashlightGroup = new THREE.Group()
  flashlightGroup.add(flashlightLight)

  // Set initial visibility based on isFlashlightActive state
  flashlightLight.intensity = isFlashlightActive ? 1.5 : 0 // Set light intensity based on active state

  // Position initially above the player
  flashlightGroup.position.set(player.x, 0.5, player.y)

  scene.add(flashlightGroup)

  // Add the light target to the scene (required for spotlight to work)
  scene.add(flashlightLight.target)

  // Store reference
  player.flashlight = flashlightGroup

  return flashlightGroup
}
