import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import PlotFigure from "./plotFigure.js";

const SimpleNodesArrows = () => {
    const matrix = [[3, 2, 5], [1, 7, 2], [1, 1, 8]]
    // specifying the coordinates for each node -- [[x, y], value]
    // m is the value of at an entry, i is the index of the entry
    // pointRadial returns the coordinates of a point on a circle based on the angle (eq) and radius (100)
    // to-do -- make radius draggable, node size correspond to value
    const nodes = matrix.map((m, i) => [d3.pointRadial(((2 - i) * 2 * Math.PI) / matrix.length, 100), m[2]])
    // edges are specified by three values -- connected nodes & value. [[x1, y1], [x2, y2], value]
    const edges = matrix.flatMap((m, i) => m.map((value, j) => ([nodes[i][0], nodes[j][0], value])))

    console.log(nodes.map(n => n[0]))

    return (
    <PlotFigure options = {{
        inset: 60,
        aspectRatio: 1,
        width: 400,
        axis: null,
        r: {range: [0, 30]}, // relative scale of R
        marks: [
        Plot.dot(nodes, {
            x: ([[x]]) => x,
            y: ([[, y]]) => y,
            r: ([, r]) => r,
            fill: "var(--sage)"}),
        Plot.arrow(edges, {
            x1: ([[x1]]) => x1,
            y1: ([[, y1]]) => y1,
            x2: ([, [x2]]) => x2,
            y2: ([, [, y2]]) => y2,
            bend: true,
            // custom stroke width based on value
            strokeWidth: ([,, value]) => value,
            strokeLinejoin: "round",
            headLength: 20,
            inset: 35 // for arrows
        }),
        Plot.text(nodes, {
            x: ([[x]]) => x,
            y: ([[,y]]) => y,
            text: ["A", "B", "C"], fontSize: 20}), //dy:12 shifts down
        // Plot.text(edges, {
        //     x: ([[x1, y1], [x2, y2]]) => (x1 + x2) / 2 + (y1 - y2) * 0.15,
        //     y: ([[x1, y1], [x2, y2]]) => (y1 + y2) / 2 - (x1 - x2) * 0.15,
        //     text: ([,, value]) => value
        // })
        ]
    }}/>
    )
}

export default function NetworksObs() {
    return (
        <div>
            <h2>Visualizing Networks with Observable</h2>
            <hr/>
            <h3>Simple Nodes and Arrows Diagram</h3>
            <p> Node size and Link size are weighted by importance. <a href = "https://observablehq.com/@observablehq/plot-finite-state-machine?intent=fork">source</a> </p>
            <code>const matrix = [[3, 2, 5], [1, 7, 2], [1, 1, 8]]</code>
            <SimpleNodesArrows/>
        </div>
    )
}