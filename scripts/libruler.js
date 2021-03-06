// Use when libruler is installed
// https://github.com/caewok/fvtt-lib-ruler

export function scaledDrawDistanceLabel(wrapped) {
  let label = wrapped();
  if(label) {
    //generate scale modifiers from canvas size (assuming default of 100 pixel) and canvas zoom level
    let scale = game.settings.get("easy-ruler-scale", "scaling")
    let gs = (canvas.scene.dimensions.size /100) 
    let zs = 1/canvas.stage.scale.x
    label.transform.scale.set((gs+zs) * (scale/100))
  }
  
  return label;
}