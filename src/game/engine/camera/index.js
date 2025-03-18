import * as THREE from 'three'

import { getDirectionVector } from '../../helpers/vectors'
import { player } from '../state'

export let camera

export function initCamera(container) {
  camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.01, 1000) //   Near plane at 0.01 to avoid clipping close objects
  return camera
}

// Update camera look direction based on player direction and vertical angle
export function updateCameraLookDirection() {
  // Calculate where to look based on player direction
  const lookVector = getDirectionVector(player.direction)
  const verticalOffset = Math.tan(player.verticalAngle) * 2

  // Target point for the camera to look at
  const target = {
    x: player.x + lookVector.x * 5,
    y: verticalOffset,
    z: player.y + lookVector.z * 5
  }

  // Direct the camera to look at the target point
  camera.lookAt(target.x, target.y, target.z)
}
