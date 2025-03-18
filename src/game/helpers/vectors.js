// Get direction vector based on player direction
export function getDirectionVector(direction) {
  // For continuous rotation, interpolate between the four cardinal directions
  const cardinalDirections = [
    { x: 0, z: -1 }, // North
    { x: 1, z: 0 }, // East
    { x: 0, z: 1 }, // South
    { x: -1, z: 0 } // West
  ]

  // Get the two closest cardinal directions
  const index1 = Math.floor(direction) % 4
  const index2 = (index1 + 1) % 4
  const frac = direction - Math.floor(direction)

  // Interpolate between the two directions
  return {
    x: cardinalDirections[index1].x * (1 - frac) + cardinalDirections[index2].x * frac,
    z: cardinalDirections[index1].z * (1 - frac) + cardinalDirections[index2].z * frac
  }
}
