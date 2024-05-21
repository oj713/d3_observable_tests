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
// Idea: force freeze for static rather than rerunning simulation.
const ForceDAG = ({nodesData, linksData}) => {
    const dagRef = useRef();
    const [isDynamic, setIsDynamic] = useState(false)

    const width = 800
    const height = 500

    // Color scale
    // scaleOrdinal -- discrete. https://d3js.org/d3-scale-chromatic/categorical
    const color = d3.scaleOrdinal(d3.schemeObservable10);

    // ---------- FORCING SIMULATION ----------

    // force simulation mutates this data, so create a copy
    //const links = nodesData.map(d => ({...d}))
    //const nodes = linksData.map(d => ({...d}))

    let link, node, text

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

    // dynamic / static toggle
    if (isDynamic) {
        simulation.on("tick", ticked)
    } else {
        simulation
        .alphaMin(.1)
        .on("end", () => {
            svg.select("#loading-text").remove() // removing loading text
            appendGraph() // adding graph elements to svg
            ticked() // updating positions
        })
    }

    // ---------- SVG CREATION ----------

    // initializing the SVG object
    const svg = d3.create('svg')
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;")
        .style("border", "black solid 1px")

    // appends graph elements to SVG
    function appendGraph() {
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

        link = svg.append("g")
            .attr("stroke", "var(--darker-blue")
        .selectAll()
        .data(linksData)
        .join("line")
            //.attr("stroke-width", d => Math.sqrt(d.value)) // for width by importance?

        // Initialize the nodes
        node = svg.append("g")
        .selectAll()
        .data(nodesData)
        .join("circle")
          .attr("r", 10)
          .attr("fill", d => color(d.group))
    
        node.append("title") //tooltip
            .text(d => d.name)

        // adding node label text
        text = svg.append("g")
            .attr("font-size", "10")
        .selectAll()
        .data(nodesData)
        .join("text")
            .text(d => d.name)
    }

    /* In this approach, you're creating a new g element within the SVG and setting its stroke attribute. 
    Then, you're binding data to this g element, entering the data join, and appending line elements within this g element for each data point. */
    
    // Loading text
    if (isDynamic) {
        appendGraph() // show graph right away
    } else {
        // loading text for static graph, removed in force end event
        svg.append("text")
            .attr("font-size", "20")
            .attr("font-style", "italic")
            .attr("fill", "grey")
            .attr("x", width/2)
            .attr("y", height/2)
            .attr("dx", "-4em")
            .attr("id", "loading-text")
        .text("Running layout simulation...")
    }

    // -------- DRAGGING --------
    if (isDynamic) {
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
    }

    // -------- APPENDING TO DOM --------

    // if isDynamic is toggled, remove the old svg and append a new one
    useEffect(() => {
        svg.node().remove()
        dagRef.current.appendChild(svg.node())
        return () => svg.node().remove()
    }, [svg, isDynamic])

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
            <input className ="form-check-input p-2" type = "checkbox" role = "switch" id = "dynamic"
                checked = {isDynamic} onChange = {() => setIsDynamic(!isDynamic)}/>
            <label className = "form-check-label" htmlFor = "dynamic"> Dynamic Graph? </label>
        </div>
        <div ref = {dagRef}></div>
        </div>
    )
}

const CollapsibleTree = ({treeData}) => {
    const collapsibleTreeRef = useRef();

    // dims. adjustable height
    const width = 800
    const marginLR = 40
    const marginTB = 20

    // using d3.hierarchy to create a "root node"
    const root = d3.hierarchy(treeData);

    const dx = 15; // rows are separated by dx pixels (a height)
    const dy = (width - 2*marginLR) / (root.height) // space between columns

    // tree layout, shape for links
    const tree = d3.tree().nodeSize([dx, dy])
    // linkHorizontal creates smooth curve from one space to another. Link generator
    const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x) // horizontal layout

    // creating SVG container
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", dx)
        .attr("viewBox", [-marginLR, -marginTB, width, dx])
        .attr("style", "font: 10px sans-serif; user-select: none;")

    const gLink = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "grey")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1)
    
    const gNode = svg.append("g")
        .attr("cursor", "pointer") // pointer cursor
        .attr("pointer-events", "all") // allow events on all children

    const addHighlighting = (nodeToHighlight) => {
        // To Do: Highlight paths
        nodeToHighlight.on("mouseover", (event, d) => {
            const isHovered = (n) => n === d
            const isRelated = (n) => n === d || 
            (d.parent && n.id === d.parent.id) || 
            (n.parent && n.parent.id === d.id)
            const isConnected = (p) =>
                (p.source.x === d.x && p.source.y === d.y) ||
                (p.target.x === d.x && p.target.y === d.y)
            // highlighting current node
            gNode.selectAll("circle") // selecting all nodes to find relatives
                .attr("fill", n => isHovered(n) ? "var(--cambridge-blue)" : 
                    isRelated(n) ? "var(--sage)" : n._children ? "var(--darkjasper)" : "var(--melon)")
                .attr("r", function(n) {
                    return isRelated(n) ? 6 : 4}
                )
            // highlighting paths
            gLink.selectAll("path")
                .attr("stroke" , p => isConnected(p) ? "var(--sage)" : "grey")
                .attr("stroke-width", p => isConnected(p) ? 2 : 1)
            nodeToHighlight.select("text") // just selecting current node to change font
                .attr("font-weight", n => isHovered(n) ? "bold" : "normal")
                .attr("font-size", n => isHovered(n) ? 15 : 10)
        })
        .on("mouseout", (event, d) => {
            gNode.selectAll("circle")
                .attr("fill", d => d._children ? "var(--darkjasper)" : "var(--melon)")
                .attr("r", 4)
            gLink.selectAll("path")
                .attr("stroke", "grey")
                .attr("stroke-width", 1)
            nodeToHighlight.selectAll("text")
                .attr("font-weight", "normal")
                .attr("font-size", 10)
        })
    }
    
    function update(event, source) {
        const duration = 250 
        const nodes = root.descendants().reverse() // reverse to draw leaves on top of parents
        const links = root.links() 

        tree(root); //compute tree layout

        let left = root;
        let right = root;
        // find leftmost and rightmost nodes
        root.eachBefore(node => { // eachBefore visits each node such that node is only visited after its descendants
            if (node.x < left.x) left = node;
            if (node.x > right.x) right = node;
        })

        const height = right.x - left.x + 2*marginTB

        const transition = svg.transition()
            .duration(duration)
        
        // root height transition
        transition
            .attr("height", height)
            .attr("viewBox", [-marginLR, left.x - marginTB, width, height])
            .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));
        
        // Update nodes
        const node = gNode.selectAll("g")
            .data(nodes, d => d.id)

        // enter new nodes at parent's prior position
        const nodeEnter = node.enter().append("g")
            .attr("transform", d => `translate(${source.y0},${source.x0})`) // parent's position
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .on("click", (event, d) => {
                d.children = d.children ? null : d._children; // toggling children on click
                update(event, d) // recursive because we're updating the entire tree. "Update" represents 1 level of the tree.
            })
        
        nodeEnter.append("circle")
            .attr("r", 4)
            .attr("fill", d => d._children ? "var(--darkjasper)" : "var(--melon)")
            .attr("strokeWidth", 10);

        nodeEnter.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d._children ? -10 : 10)
            .attr("text-anchor", d => d._children ? "end" : "start")
            .text(d => d.data.name)
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .attr("stroke", "white")
            .attr("paint-order", "stroke");

        // add highlighting
        addHighlighting(nodeEnter)

        // transition nodes to new positions
        node.merge(nodeEnter).transition(transition)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1)

        // Transition exiting nodes to the parent's new position.
        node.exit().transition(transition).remove()
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);

        // Update the links…
        const link = gLink.selectAll("path")
          .data(links, d => d.target.id);

        // Enter any new links at the parent's previous position.
        const linkEnter = link.enter().append("path")
            .attr("d", d => {
              const o = {x: source.x0, y: source.y0};
              return diagonal({source: o, target: o});
            });

        // Transition links to their new position.
        link.merge(linkEnter).transition(transition)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition(transition).remove()
            .attr("d", d => {
              const o = {x: source.x, y: source.y};
              return diagonal({source: o, target: o});
            });

        // Stash the old positions for transition.
        root.eachBefore(d => {
          d.x0 = d.x;
          d.y0 = d.y;
        });
    }

    // Do the first update to the initial configuration of the tree — where a number of nodes
    // are open (arbitrarily selected as the root, plus nodes with 7 letters).
    root.x0 = dy / 2;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
      d.id = i;
      d._children = d.children;
      if (d.depth && d.data.name.length !== 7) d.children = null;
    });

    update(null, root);

    useEffect(() => {
        collapsibleTreeRef.current.appendChild(svg.node())
        return () => svg.node().remove()
    }, [svg])

    return (
        <div>
            <h3>Collapsible Tree</h3>
            <p>Click on nodes to hide/reveal layers. Hover on a node to highlight parents/children. Hide/reveal layer code mostly a direct copy of code source.
                Highlighting after click only works after re-highlight, will not fix
            </p>
            <ul>
                <li><a href = "https://observablehq.com/@d3/collapsible-tree">Code source</a></li>
                <li><a href = "https://observablehq.com/@observablehq/plot-tree-tidy?intent=fork">Static Tree with Observable</a></li>
            </ul>
            <div ref = {collapsibleTreeRef}></div>
        </div>
    )
}

export default function NetworksGen() {
    const [treeData, setTreeData] = useState(null)
    const links = riverLinksData.map(([src, tar]) => ({source: src, target: tar}))

    useEffect(() => {
        d3.json("./data/hierarchy_data.json").then(data =>
            setTreeData(data)
        ).catch((error) => {
            console.log("Error parsing data: ", error)
        })
    }, [])

    return (
        <div>
            <h2>Visualizing Networks with D3</h2>
            <hr/>
            <h3>Simple Nodes and Arrows Diagram</h3>
            <p> Node size and Link size are weighted by importance. <a href = "https://observablehq.com/@observablehq/plot-finite-state-machine?intent=fork">source</a> </p>
            <code>const matrix = [[3, 2, 5], [1, 7, 2], [1, 1, 8]]</code>
            <SimpleNodesArrows/>

            <hr/>
            <ForceDAG nodesData = {riverNodesData} linksData = {links}/>

            <hr/>
            {treeData && <CollapsibleTree treeData = {treeData}/> }

            <hr/>
            <p> Future example: Fisheye distortion, <a href = "https://bost.ocks.org/mike/fisheye/">source</a></p>
        </div>


    )
}