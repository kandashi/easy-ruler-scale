import { scaledDrawDistanceLabel } from "./libruler.js";

const ERS = "easy-ruler-scale"
Hooks.once('init', async function () {
  if(game.modules.get('libruler')?.active) {
    Hooks.once('libRulerReady', async function() {
      libWrapper.register(ERS, "window.libRuler.RulerSegment.prototype.drawDistanceLabel", scaledDrawDistanceLabel, "WRAPPER");
    });
  } else {
    libWrapper.register(ERS, "Ruler.prototype.measure", newMeasure, "OVERRIDE")
  }

  //game.settings.register() // requires module and key portion for a setting; looks like this is unneeded as we have no settings.
});




function newMeasure(destination, {gridSpaces=true}={}) {
    destination = new PIXI.Point(...canvas.grid.getCenter(destination.x, destination.y));
    const waypoints = this.waypoints.concat([destination]);
    const r = this.ruler;
    this.destination = destination;

    // Iterate over waypoints and construct segment rays
    const segments = [];
    for (let [i, dest] of waypoints.slice(1).entries()) {
        const origin = waypoints[i];
        const label = this.labels.children[i];
        const ray = new Ray(origin, dest);
        if (ray.distance < 10) {
            if (label) label.visible = false;
            continue;
        }
        segments.push({ ray, label });
    }

    // Compute measured distance
    const distances = canvas.grid.measureDistances(segments, { gridSpaces });
    let totalDistance = 0;
    for (let [i, d] of distances.entries()) {
        totalDistance += d;
        let s = segments[i];
        s.last = i === (segments.length - 1);
        s.distance = d;
        s.text = this._getSegmentLabel(d, totalDistance, s.last);
    }

    // Clear the grid highlight layer
    const hlt = canvas.grid.highlightLayers[this.name] || canvas.grid.addHighlightLayer(this.name);
    hlt.clear();

    // Draw measured path
    r.clear();
    for (let s of segments) {
        const { ray, label, text, last } = s;

        // Draw line segment
        r.lineStyle(6, 0x000000, 0.5).moveTo(ray.A.x, ray.A.y).lineTo(ray.B.x, ray.B.y)
            .lineStyle(4, this.color, 0.25).moveTo(ray.A.x, ray.A.y).lineTo(ray.B.x, ray.B.y);

        // Draw the distance label just after the endpoint of the segment
        if (label) {
            label.text = text;
            label.alpha = last ? 1.0 : 0.5;
            label.visible = true;
            let labelPosition = ray.project((ray.distance + 50) / ray.distance);
            label.position.set(labelPosition.x, labelPosition.y);
            //generate scale modifiers from canvas size (assuming default of 100 pixel) and canvas zoom level
            let gs = canvas.scene.dimensions.size /100
            let zs = 1/canvas.stage.scale.x
            label.transform.scale.set(gs+zs)
        }

        // Highlight grid positions
        this._highlightMeasurement(ray);
    }

    // Draw endpoints
    for (let p of waypoints) {
        r.lineStyle(2, 0x000000, 0.5).beginFill(this.color, 0.25).drawCircle(p.x, p.y, 8);
    }

    // Return the measured segments
    return segments;
}
