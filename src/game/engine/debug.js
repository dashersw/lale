import { scene } from './world/scene'

export let debugVisualElements = []
export let debugVisualsEnabled = false

export function toggleDebugVisualization() {
  debugVisualsEnabled = !debugVisualsEnabled

  if (debugVisualsEnabled) {
    createRoomGridVisualization()
    console.log('Debug visualization enabled')
  } else {
    // Remove all debug visual elements
    for (const element of debugVisualElements) {
      scene.remove(element)
    }
    debugVisualElements = []
    console.log('Debug visualization disabled')
  }
}

// Create a visible grid on the floor to help visualize room boundaries
function createRoomGridVisualization() {
  // Clear any existing debug visual elements
  for (const element of debugVisualElements) {
    scene.remove(element)
  }
  debugVisualElements = []

  const GRID_SIZE = 10 // 10x10 grid of rooms
  const ROOM_SIZE = 3 // Each room is 3x3 units
  const gridTotalSize = GRID_SIZE * ROOM_SIZE // Total size of dungeon in world units

  // Create a material for room boundary grid lines
  const roomGridMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000, // Red lines for room boundaries
    linewidth: 2,
    opacity: 0.9, // More visible
    transparent: true
  })

  // Create a material for internal cell grid lines (lighter color)
  const cellGridMaterial = new THREE.LineBasicMaterial({
    color: 0x00ffff, // Cyan lines for internal cell boundaries
    linewidth: 1,
    opacity: 0.7, // More visible
    transparent: true
  })

  // ROOM BOUNDARY GRID (every 3 units)

  // Create horizontal room boundary lines (along X axis)
  for (let z = 0; z <= gridTotalSize; z += ROOM_SIZE) {
    // Draw room boundary lines
    const lineGeometry = new THREE.BufferGeometry()
    const points = [new THREE.Vector3(0, 0.02, z), new THREE.Vector3(gridTotalSize, 0.02, z)]
    lineGeometry.setFromPoints(points)

    const line = new THREE.Line(lineGeometry, roomGridMaterial)
    scene.add(line)
    debugVisualElements.push(line)
  }

  // Create vertical room boundary lines (along Z axis)
  for (let x = 0; x <= gridTotalSize; x += ROOM_SIZE) {
    // Draw room boundary lines
    const lineGeometry = new THREE.BufferGeometry()
    const points = [new THREE.Vector3(x, 0.02, 0), new THREE.Vector3(x, 0.02, gridTotalSize)]
    lineGeometry.setFromPoints(points)

    const line = new THREE.Line(lineGeometry, roomGridMaterial)
    scene.add(line)
    debugVisualElements.push(line)
  }

  // INTERNAL CELL GRID (every 1 unit, but skip room boundary lines)

  // Create horizontal internal cell lines (along X axis)
  for (let z = 0; z <= gridTotalSize; z += 1) {
    // Skip lines that are already room boundaries
    if (z % ROOM_SIZE === 0) continue

    // Draw internal cell lines
    const lineGeometry = new THREE.BufferGeometry()
    const points = [new THREE.Vector3(0, 0.015, z), new THREE.Vector3(gridTotalSize, 0.015, z)]
    lineGeometry.setFromPoints(points)

    const line = new THREE.Line(lineGeometry, cellGridMaterial)
    scene.add(line)
    debugVisualElements.push(line)
  }

  // Create vertical internal cell lines (along Z axis)
  for (let x = 0; x <= gridTotalSize; x += 1) {
    // Skip lines that are already room boundaries
    if (x % ROOM_SIZE === 0) continue

    // Draw internal cell lines
    const lineGeometry = new THREE.BufferGeometry()
    const points = [new THREE.Vector3(x, 0.015, 0), new THREE.Vector3(x, 0.015, gridTotalSize)]
    lineGeometry.setFromPoints(points)

    const line = new THREE.Line(lineGeometry, cellGridMaterial)
    scene.add(line)
    debugVisualElements.push(line)
  }

  // Add coordinate markers at major room corners (every 3rd room)
  for (let roomY = 0; roomY <= GRID_SIZE; roomY += 1) {
    for (let roomX = 0; roomX <= GRID_SIZE; roomX += 1) {
      // Calculate world position
      const worldX = roomX * ROOM_SIZE
      const worldZ = roomY * ROOM_SIZE

      // Create a small dot at the position
      const dotGeometry = new THREE.SphereGeometry(0.08, 8, 8)
      const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
      const dot = new THREE.Mesh(dotGeometry, dotMaterial)
      dot.position.set(worldX, 0.05, worldZ)
      scene.add(dot)
      debugVisualElements.push(dot)

      // Add coordinate label to all corners
      // Create a text label for this coordinate
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 32
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'white'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${worldX},${worldZ}`, 32, 16)

      const texture = new THREE.CanvasTexture(canvas)
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      })

      const labelGeometry = new THREE.PlaneGeometry(0.7, 0.35)
      labelGeometry.rotateX(-Math.PI / 2)
      const label = new THREE.Mesh(labelGeometry, labelMaterial)
      label.position.set(worldX, 0.025, worldZ)
      scene.add(label)
      debugVisualElements.push(label)
    }
  }

  // Add room center markers and numbers - ALL rooms
  for (let roomY = 0; roomY < GRID_SIZE; roomY++) {
    for (let roomX = 0; roomX < GRID_SIZE; roomX++) {
      // Calculate world position for room center
      const worldX = roomX * ROOM_SIZE + 1.5 // Center of room (+1.5)
      const worldZ = roomY * ROOM_SIZE + 1.5 // Center of room (+1.5)

      // Create a larger marker for room center
      const centerMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff00ff }) // Magenta for room centers
      )
      centerMarker.position.set(worldX, 0.05, worldZ)
      scene.add(centerMarker)
      debugVisualElements.push(centerMarker)

      // Add room number with larger text
      const roomNum = roomY * 10 + roomX + 1

      const canvas = document.createElement('canvas')
      canvas.width = 128 // Larger canvas
      canvas.height = 64
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'white'
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 3
      ctx.font = 'bold 48px Arial' // Larger font
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.strokeText(`${roomNum}`, 64, 32) // Add outline for visibility
      ctx.fillText(`${roomNum}`, 64, 32)

      const texture = new THREE.CanvasTexture(canvas)
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      })

      const labelGeometry = new THREE.PlaneGeometry(0.9, 0.45) // Larger label
      labelGeometry.rotateX(-Math.PI / 2)
      const label = new THREE.Mesh(labelGeometry, labelMaterial)
      label.position.set(worldX, 0.03, worldZ)
      scene.add(label)
      debugVisualElements.push(label)

      // Add door positions markers - for all 4 potential door positions in each room
      const doorPositions = [
        { x: worldX, y: worldZ - 1.5, name: 'N' }, // North door
        { x: worldX + 1.5, y: worldZ, name: 'E' }, // East door
        { x: worldX - 1.5, y: worldZ, name: 'W' }, // West door
        { x: worldX, y: worldZ + 1.5, name: 'S' } // South door
      ]

      // Fix linter error: replace forEach with for...of loop
      for (const pos of doorPositions) {
        // Create small marker for door position
        const doorMarker = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8),
          new THREE.MeshBasicMaterial({ color: 0x00ff00 }) // Green for door positions
        )
        doorMarker.position.set(pos.x, 0.05, pos.y)
        scene.add(doorMarker)
        debugVisualElements.push(doorMarker)

        // Add door position label
        const doorCanvas = document.createElement('canvas')
        doorCanvas.width = 32
        doorCanvas.height = 32
        const doorCtx = doorCanvas.getContext('2d')
        doorCtx.fillStyle = 'green'
        doorCtx.font = 'bold 24px Arial'
        doorCtx.textAlign = 'center'
        doorCtx.textBaseline = 'middle'
        doorCtx.fillText(pos.name, 16, 16)

        const doorTexture = new THREE.CanvasTexture(doorCanvas)
        const doorLabelMaterial = new THREE.MeshBasicMaterial({
          map: doorTexture,
          transparent: true,
          side: THREE.DoubleSide
        })

        const doorLabelGeometry = new THREE.PlaneGeometry(0.3, 0.3)
        doorLabelGeometry.rotateX(-Math.PI / 2)
        const doorLabel = new THREE.Mesh(doorLabelGeometry, doorLabelMaterial)
        doorLabel.position.set(pos.x, 0.15, pos.y)
        scene.add(doorLabel)
        debugVisualElements.push(doorLabel)
      }
    }
  }
}
