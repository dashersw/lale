import * as THREE from 'three'

import { scene, renderer } from '../../world/scene'
import { camera } from '../../camera'
import { dungeonMap, openDoor, TILE_TYPES } from '../../../map'
import { raycaster } from '../../world/collisions'
import { closeDoorAnimation, startDoorAnimation } from '../../world/doors'
import { player } from '../../state'
import { doors } from '../../world/builder'

const DOOR_INTERACTION_DISTANCE = 2.5 // How far away player can trigger doors with space

// Handle door click
export function handleDoorClick(event) {
  if (!scene || !camera || !raycaster) return

  // Calculate mouse position in normalized device coordinates (-1 to +1)
  const rect = renderer.domElement.getBoundingClientRect()
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  )

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera)

  // Find all door objects that intersect with the ray
  const intersects = raycaster.intersectObjects(scene.children, true)

  for (const intersect of intersects) {
    // Check if clicked object is part of a door
    let doorObject = null

    // Check if the object itself is a door
    if (intersect.object.userData.parentPivot) {
      doorObject = intersect.object.userData.parentPivot
    }
    // Check if the object's parent is a door
    else if (intersect.object?.parent?.userData && intersect.object.parent.userData.type === 'door') {
      doorObject = intersect.object.parent
    }

    if (doorObject && !doorObject.userData.isOpen) {
      // Get door tile coordinates
      const doorX = doorObject.userData.x
      const doorY = doorObject.userData.y

      // Calculate distance to door
      const distance = Math.sqrt((player.x - doorX) ** 2 + (player.y - doorY) ** 2)

      // Only allow opening if close enough (4 units)
      if (distance <= 4) {
        console.log(`Opening door at (${doorX}, ${doorY}) with animation`)
        // Start door animation
        startDoorAnimation(doorObject)
        // Update map data
        openDoor(doorX, doorY)
        break
      }

      // Log if door is too far away
      console.log('Door is too far away to interact with')
    }
  }
}

// Try to interact with a nearby door - improved with toggle functionality
export function tryInteractWithNearbyDoor() {
  // Find the closest door within interaction distance
  let closestDoor = null
  let shortestDistance = DOOR_INTERACTION_DISTANCE

  // Get player's exact tile position
  const playerTileX = Math.floor(player.x)
  const playerTileY = Math.floor(player.y)

  console.log(`Player is at tile (${playerTileX}, ${playerTileY}), checking for nearby doors`)

  for (const door of doors) {
    // Skip doors that are already animating
    if (door.isAnimating) continue

    // Calculate distance to door - use exact door position
    const distance = Math.sqrt((player.x - door.x) ** 2 + (player.y - door.y) ** 2)

    // Log doors that are somewhat close for debugging
    if (distance < DOOR_INTERACTION_DISTANCE * 1.5) {
      console.log(`Door at (${door.x}, ${door.y}) is ${distance.toFixed(2)} units away, isOpen: ${door.isOpen}`)
    }

    if (distance < shortestDistance) {
      shortestDistance = distance
      closestDoor = door
    }
  }

  // If a door is found within range, toggle it
  if (closestDoor) {
    const doorX = closestDoor.x
    const doorY = closestDoor.y
    const isCurrentlyOpen = closestDoor.isOpen

    console.log(
      `${isCurrentlyOpen ? 'Closing' : 'Opening'} door at (${doorX}, ${doorY}) - Distance: ${shortestDistance.toFixed(
        2
      )}`
    )

    const doorGroup = closestDoor.object

    // Toggle the door state
    if (isCurrentlyOpen) {
      // CLOSE the door
      closeDoorAnimation(doorGroup)
      updateDoorState(doorX, doorY, false) // false = close
    } else {
      // OPEN the door
      startDoorAnimation(doorGroup)
      updateDoorState(doorX, doorY, true) // true = open
    }

    return true
  }

  console.log('No doors in range to interact with')
  return false
}

// Open or close a door at specified position
function updateDoorState(x, y, shouldOpen = true) {
  // Find the door object at this position - now using exact integer matching
  const doorEntry = doors.find(d => {
    return d.x === x && d.y === y
  })

  if (!doorEntry) {
    console.log(`No door found at (${x},${y}) in doors array`)
    return false
  }

  if (shouldOpen) {
    // OPENING DOOR
    // Use the map's openDoor function to update the map
    const doorOpened = openDoor(x, y)
    if (!doorOpened) {
      console.log(`Could not open door at (${x},${y}) in map`)
      return false
    }

    // Update door object properties
    doorEntry.isOpen = true
    if (doorEntry.object?.userData) {
      doorEntry.object.userData.isOpen = true
    }

    console.log(`Door at (${x},${y}) opened successfully`)
  } else {
    // CLOSING DOOR
    // Update map - set the tile back to a door
    if (dungeonMap[y] && dungeonMap[y][x] !== TILE_TYPES.DOOR) {
      dungeonMap[y][x] = TILE_TYPES.DOOR
    }

    // Update door object properties
    doorEntry.isOpen = false
    if (doorEntry.object?.userData) {
      doorEntry.object.userData.isOpen = false
    }

    console.log(`Door at (${x},${y}) closed successfully`)
  }

  return true
}
