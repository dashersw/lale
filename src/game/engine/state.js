export let isFlashlightActive = false
export let debugVisualsEnabled = false
export let keysPressed = {}
export let player = { x: 1, y: 1, direction: 0, verticalAngle: 0 }
export let animatingDoors = []
export let inputEnabled = true
export let isMouseLookEnabled = false
export let mouseControlsEnabled = false

export function toggleFlashlight() {
  isFlashlightActive = !isFlashlightActive
}

export function toggleMouseControls() {
  mouseControlsEnabled = !mouseControlsEnabled
}

export function enableMouseControls() {
  mouseControlsEnabled = true
}

export function disableMouseControls() {
  mouseControlsEnabled = false
}

export function toggleDebugVisuals() {
  debugVisualsEnabled = !debugVisualsEnabled
}
