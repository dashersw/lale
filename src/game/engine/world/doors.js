import { animatingDoors } from '../state'
import { doors } from './builder'

const DOOR_ANIMATION_DURATION = 1000 // milliseconds for door opening

// Start door animation - simplified
export function startDoorAnimation(doorGroup) {
  if (!doorGroup || doorGroup.userData.isAnimating || doorGroup.userData.isOpen) return

  console.log('Starting door animation')

  // Update the doorGroup's userData
  doorGroup.userData.isAnimating = true
  doorGroup.userData.animationStartTime = Date.now()
  doorGroup.userData.isClosing = false // Explicitly mark as not closing

  // Also update the corresponding entry in the doors array
  const doorEntry = doors.find(d => d.object === doorGroup)
  if (doorEntry) {
    doorEntry.isAnimating = true
  } else {
    console.error('Door not found in doors array!')
  }

  // Verify that the door pivot exists
  if (!doorGroup.userData.doorPivot) {
    console.error('Door pivot missing! Cannot animate the door.')
    return
  }

  // Add to animating doors list
  animatingDoors.push(doorGroup)
}

// Start door closing animation
export function closeDoorAnimation(doorGroup) {
  if (!doorGroup || doorGroup.userData.isAnimating || !doorGroup.userData.isOpen) return

  console.log('Starting door closing animation')

  // Update the doorGroup's userData
  doorGroup.userData.isAnimating = true
  doorGroup.userData.animationStartTime = Date.now()
  doorGroup.userData.isClosing = true // Mark it as closing

  // Also update the corresponding entry in the doors array
  const doorEntry = doors.find(d => d.object === doorGroup)
  if (doorEntry) {
    doorEntry.isAnimating = true
  } else {
    console.error('Door not found in doors array!')
  }

  // Verify that the door pivot exists
  if (!doorGroup.userData.doorPivot) {
    console.error('Door pivot missing! Cannot animate the door.')
    return
  }

  // Add to animating doors list
  animatingDoors.push(doorGroup)
}

// Update door animations with improved logic for both opening and closing
export function updateDoorAnimations() {
  if (animatingDoors.length === 0) return

  const currentTime = Date.now()

  // Process each animating door
  for (let i = animatingDoors.length - 1; i >= 0; i--) {
    const doorGroup = animatingDoors[i]
    const elapsed = currentTime - doorGroup.userData.animationStartTime
    const doorPivot = doorGroup.userData.doorPivot

    if (!doorPivot) {
      console.error('Missing door pivot for animating door')
      animatingDoors.splice(i, 1)
      continue
    }

    // Calculate animation progress (0 to 1)
    const progress = Math.min(elapsed / DOOR_ANIMATION_DURATION, 1)

    // Determine if this is an opening or closing animation
    const isClosing = doorGroup.userData.isClosing || false

    if (isClosing) {
      // CLOSING: Rotate from open (90°) back to closed (0°)
      doorPivot.rotation.y = doorPivot.userData.targetRotation * (1 - progress)

      // Check if animation is complete
      if (progress >= 1) {
        doorPivot.rotation.y = 0 // Ensure door is perfectly closed
        doorGroup.userData.isAnimating = false
        doorGroup.userData.isOpen = false
        doorGroup.userData.isClosing = false

        // Update the corresponding door entry
        const doorEntry = doors.find(d => d.object === doorGroup)
        if (doorEntry) {
          doorEntry.isAnimating = false
          doorEntry.isOpen = false
        }

        // Remove from animation list
        animatingDoors.splice(i, 1)
        console.log('Door closing animation complete')
      }
    } else {
      // OPENING: Rotate from closed (0°) to open (90°)
      doorPivot.rotation.y = doorPivot.userData.targetRotation * progress

      // Check if animation is complete
      if (progress >= 1) {
        doorPivot.rotation.y = doorPivot.userData.targetRotation // Ensure door is perfectly open
        doorGroup.userData.isAnimating = false
        doorGroup.userData.isOpen = true

        // Update the corresponding door entry
        const doorEntry = doors.find(d => d.object === doorGroup)
        if (doorEntry) {
          doorEntry.isAnimating = false
          doorEntry.isOpen = true
        }

        // Remove from animation list
        animatingDoors.splice(i, 1)
        console.log('Door opening animation complete')
      }
    }
  }
}
