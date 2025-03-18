import * as THREE from 'three'
import { dungeonMap } from '../../map.js'
import { doors, walls } from './builder.js'
import { startDoorAnimation } from './doors.js'
import { scene } from './scene.js'

// Create raycaster for door detection
export const raycaster = new THREE.Raycaster()

// Check for collision using Three.js raycaster
export function checkCollision(currentX, currentZ, targetX, targetZ) {
  if (!scene) return true // Can't move if scene doesn't exist

  // PLAYER DIMENSIONS
  const PLAYER_RADIUS = 0.25 // Player's physical radius
  const PLAYER_HEIGHT = 1.0 // Player's height

  // COLLISION RAYS: Cast rays in all directions from the player's position
  // Cast 8 rays around the player in a circle to check for collisions
  const COLLISION_RAYS = 8

  // Calculate movement direction
  const moveDirection = new THREE.Vector2(targetX - currentX, targetZ - currentZ)
  const moveDistance = moveDirection.length()

  // If not actually moving, no collision
  if (moveDistance < 0.0001) return false

  moveDirection.normalize()

  // Check if there are doors in the way that we can open
  const currentTileX = Math.floor(currentX)
  const currentTileZ = Math.floor(currentZ)
  const targetTileX = Math.floor(targetX)
  const targetTileZ = Math.floor(targetZ)

  // Console log for debugging door collisions
  if (Math.abs(currentTileX - targetTileX) + Math.abs(currentTileZ - targetTileZ) > 0) {
    console.log(`Moving from tile (${currentTileX},${currentTileZ}) to (${targetTileX},${targetTileZ})`)
    if (dungeonMap[targetTileZ] && dungeonMap[targetTileZ][targetTileX] === 2) {
      console.log(`Door detected at target tile (${targetTileX},${targetTileZ})`)
    }
  }

  // If trying to move into a different tile, check if it's a door
  if (currentTileX !== targetTileX || currentTileZ !== targetTileZ) {
    if (dungeonMap[targetTileZ] && dungeonMap[targetTileZ][targetTileX] === 2) {
      // It's a door, try to open it if closed
      const door = doors.find(d => {
        // Exact door position matching - doors now have integer coordinates
        return d.x === targetTileX && d.y === targetTileZ
      })

      if (door) {
        console.log(`Found door at (${targetTileX},${targetTileZ}) - isOpen: ${door.isOpen}`)
        if (!door.isOpen) {
          // Show collision point for debug
          const collisionSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
          )
          collisionSphere.position.set(targetTileX + 0.5, 0.5, targetTileZ + 0.5)
          scene.add(collisionSphere)
          // Remove after 2 seconds
          setTimeout(() => scene.remove(collisionSphere), 2000)

          // Door is closed, try to open it
          const distance = Math.sqrt((currentX - targetTileX) ** 2 + (currentZ - targetTileZ) ** 2)
          if (distance < 1.5) {
            console.log(`Door in range, opening - distance: ${distance.toFixed(2)}`)
            startDoorAnimation(door.object)
            updateDoorState(targetTileX, targetTileZ)
          } else {
            console.log(`Door out of range - distance: ${distance.toFixed(2)}`)
          }
          return true // Block movement into closed door
        }

        console.log('Door is already open, allowing passage')
        // Allow movement through open door
        return false
      }

      console.log(`Door marked in map at (${targetTileX},${targetTileZ}) but not found in doors array`)
    }
  }

  // Create array to store collision results
  let collisionDetected = false

  // Check collision with all walls and closed doors in the scene
  for (let i = 0; i < COLLISION_RAYS; i++) {
    // Calculate ray direction in a circle around the player
    const angle = (i / COLLISION_RAYS) * Math.PI * 2
    const rayDirX = Math.cos(angle)
    const rayDirZ = Math.sin(angle)

    // Set ray origin at player position + direction toward target
    const rayOrigin = new THREE.Vector3(
      currentX + moveDirection.x * PLAYER_RADIUS * 0.5,
      0.5, // At player's middle height
      currentZ + moveDirection.y * PLAYER_RADIUS * 0.5
    )

    // Set ray direction
    const rayDirection = new THREE.Vector3(rayDirX, 0, rayDirZ)

    // Update the raycaster
    raycaster.set(rayOrigin, rayDirection.normalize())

    // Get objects that intersect with the ray (walls and closed doors)
    const intersects = raycaster.intersectObjects(walls)

    // Also check closed doors - This is crucial for detection!
    for (const door of doors) {
      if (!door.isOpen) {
        // Get all children of the door for proper collision detection
        const doorParts = []
        door.object.traverse(obj => {
          if (obj.isMesh) doorParts.push(obj)
        })

        // Check each door part for intersection
        const doorIntersects = raycaster.intersectObjects(doorParts)
        if (doorIntersects.length > 0) {
          intersects.push(...doorIntersects)
        }
      }
    }

    // Check for close collisions
    for (const intersect of intersects) {
      // If intersection is closer than our movement distance + some buffer, we have a collision
      if (intersect.distance < PLAYER_RADIUS + moveDistance) {
        collisionDetected = true
        break
      }
    }

    if (collisionDetected) break
  }

  // Perform a direct ray cast in the exact movement direction too
  // This ensures we can't just slip through walls at angles
  if (!collisionDetected) {
    // Set ray in the exact direction of movement
    const rayOrigin = new THREE.Vector3(currentX, 0.5, currentZ)
    const rayDirection = new THREE.Vector3(moveDirection.x, 0, moveDirection.y)

    // Update the raycaster
    raycaster.set(rayOrigin, rayDirection.normalize())

    // Get all intersecting objects (walls and closed doors)
    const directIntersects = raycaster.intersectObjects(walls)

    // Also check closed doors with improved detection
    for (const door of doors) {
      if (!door.isOpen) {
        // Get all meshes in the door for better collision detection
        const doorParts = []
        door.object.traverse(obj => {
          if (obj.isMesh) doorParts.push(obj)
        })

        const doorIntersects = raycaster.intersectObjects(doorParts)
        if (doorIntersects.length > 0) {
          directIntersects.push(...doorIntersects)
        }
      }
    }

    // Check if there's a collision in our movement path
    for (const intersect of directIntersects) {
      if (intersect.distance < PLAYER_RADIUS + moveDistance) {
        collisionDetected = true
        break
      }
    }
  }

  // Return true if collision detected, false if path is clear
  return collisionDetected
}
