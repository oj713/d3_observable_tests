import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import PlotFigure from "./plotFigure.js";
import {riverNodesData, riverLinksData} from "./exampleData.js";
import {useRef, useEffect, useState} from "react";

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

// assumes id, name, group, layer for nodes
// assumes source, target for links
const ForceDAG = ({nodesData, linksData}) => {
    const dagRef = useRef();
    const [isDynamic, setIsDynamic] = useState(true)

    const width = 800
    const height = 500

    // Color scale
    // scaleOrdinal -- discrete. https://d3js.org/d3-scale-chromatic/categorical
    const color = d3.scaleOrdinal(d3.schemeObservable10);

    // ---------- FORCING SIMULATION ----------

    // force simulation mutates this data, so create a copy
    //const links = nodesData.map(d => ({...d}))
    //const nodes = linksData.map(d => ({...d}))

    // end of the simulation function -- update node positions
    // we need this function because otherwise the nodes won't update
    const ticked = () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        text
            .attr("x", d => d.x + 15)
            .attr("y", d => d.y + 5);
    }

    // creating a D3 simulation and adding "forces"
    const simulation = d3.forceSimulation(nodesData)
        .force("link", d3.forceLink() // force that adds links to nodes
                            .id(d => d.id) // function to retrieve ID for a node
                            .links(linksData)) // adding links 
        .force("charge", d3.forceManyBody().strength(-150)) // force that adds repulsion between nodes
        .force("center", d3.forceCenter(width/2, height/2)) // force that adds centering force
        .force("y", d3.forceY(d => d.layer * 80).strength(.25)) // y axis positioning based on layer
        //.on("end", ticked) // event listener for the end of the simulation
        .on("tick", ticked) // event listener for each tick of the simulation

    // ---------- SVG CREATION ----------

    // initializing the SVG object
    const svg = d3.create('svg')
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;")
        .style("border", "black solid 1px")
    
    /* Old code
    In this approach, you're directly selecting all existing line elements within the SVG, binding data to them, 
    entering the data join, and appending new line elements for any new data points. 
    var link = svg
    .selectAll("line") // select all lines
    .data(linksData)
    .enter() // create placeholder for each data point
    .append("line")
      .style("stroke", "var(--darker-blue)")

    // Initialize the nodes
    var node = svg
    .selectAll("circle")
    .data(nodesData)
    .enter()
    .append("circle")
      .attr("r", 10)
      .style("fill", "var(--melon)")

    */

    /* In this approach, you're creating a new g element within the SVG and setting its stroke attribute. 
    Then, you're binding data to this g element, entering the data join, and appending line elements within this g element for each data point. */
    const link = svg.append("g")
        .attr("stroke", "var(--darker-blue")
    .selectAll()
    .data(linksData)
    .join("line")
        //.attr("stroke-width", d => Math.sqrt(d.value)) // for width by importance?

    // Initialize the nodes
    const node = svg.append("g")
    .selectAll()
    .data(nodesData)
    .join("circle")
      .attr("r", 10)
      .attr("fill", d => color(d.group))
    
    node.append("title") //tooltip
        .text(d => d.name)

    // adding Text
    const text = svg.append("g")
        .attr("font-size", "10")
    .selectAll()
    .data(nodesData)
    .join("text")
        .text(d => d.name)

    // -------- DRAGGING --------
    // reheat simulation when drag starts, fix subject position
    const dragstarted = (event) => {
        // alphaTarget is the cooling parameter.
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    // update subject position during drag
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    // restore target alpha so simulation cools after dragging, unfix subject position
    const dragended = (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))

    // -------- APPENDING TO DOM --------

    useEffect(() => {
        dagRef.current.appendChild(svg.node())
        return () => svg.node().remove()
    }, [])

    return (
        <div>
        <h3> Directed Acyclic Graph </h3>
        <p> Using D3. Manual input layering. References: </p>
        <ul>
            <li><a href = "https://observablehq.com/@jeffbaumes/ontology-directed-acyclic-graph-simplification">DAG draggable</a></li>
            <li><a href = "https://observablehq.com/@d3/force-directed-graph">Force Directed Graph</a></li>
            <li><a href = "https://d3-graph-gallery.com/graph/network_basic.html">Basic D3 Network</a></li>
            <li><a href = 'https://github.com/erikbrinkman/d3-dag'>Sugiyama layout package</a>, for later exploration</li>
        </ul>
        <div className = "form-switch form-check">
            <input className ="form-check-input" type = "checkbox" role = "switch" id = "dynamic"
                checked = {isDynamic} onChange = {() => setIsDynamic(!isDynamic)}/>
            <label className = "form-check-label" for = "dynamic"> Dynamic Graph? </label>
        </div>
        <div ref = {dagRef}></div>
        </div>
    )
}

export default function NetworksObs() {
    const links = riverLinksData.map(([src, tar]) => ({source: src, target: tar}))

    return (
        <div>
            <h2>Visualizing Networks with Observable</h2>
            <hr/>
            <h3>Simple Nodes and Arrows Diagram</h3>
            <p> Node size and Link size are weighted by importance. <a href = "https://observablehq.com/@observablehq/plot-finite-state-machine?intent=fork">source</a> </p>
            <code>const matrix = [[3, 2, 5], [1, 7, 2], [1, 1, 8]]</code>
            <SimpleNodesArrows/>

            <hr/>
            <ForceDAG nodesData = {riverNodesData} linksData = {links}/>
        </div>


    )
}