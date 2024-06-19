import * as dg from '@dagrejs/dagre';
import * as d3dag from 'd3-dag';
import {scaleLinear} from 'd3-scale';

// Global hierarchy order
// 'PlaceInOven' changed to 'Oven' in network-parser.js
const groupHierarchy = ['Kneading', 'Pointing', 'Shaping', 'Priming', 
    'Oven', 'Cutting', 'Crumb', 'Bread']


/* Old link code. 
container.selectAll("line")
.data(links, d => d.id)
.enter()
.append("line")
.attr("x1", d => nodes.find(node => node.id === d.source).x) // finding x value of source
.attr("y1", d => nodes.find(node => node.id === d.source).y)
.attr("x2", d => nodes.find(node => node.id === d.target).x) // finding x value of target
.attr("y2", d => nodes.find(node => node.id === d.target).y)
.attr("stroke", "grey")
.attr("stroke-width", d => 4 * d.strength)
*/

// Basic layout. Evenly spaces nodes within a group on y-layers. No edge crossing minimization.
export const basicLayout = (nodes, links, nodeSize) => {
    const width = nodeSize * 12
    const height = nodeSize * 10
    const yScale = scaleLinear().domain([-1, 1]).range([-width/2, width/2])
    const xScale = scaleLinear().domain([1, -1]).range([-height/2, height/2])

    // Layout. Based on grouping.
    groupHierarchy.forEach((group, i) => {
        const groupNodes = nodes.filter(node => node.group === group)
        const numCols = groupNodes.length

        groupNodes.forEach((node, j) => {
            node.x = xScale(.9 - .25 * i) + width/2 // y based on group
            node.y = yScale(-0.8 + (1.6 / (numCols + 1)) * (j + 1)) + height/2 // x based on num nodes in group
        })
    })

    const linksBase = links.map(link => {
        const source = nodes.find(node => node.id === link.source)
        const target = nodes.find(node => node.id === link.target)
        return {
            ...link,
            points: [
                [source.x, source.y],
                [target.x, target.y]
            ]
        }
    })

    return {nodesBase: nodes, linksBase: linksBase, width, height}
}

// Dagre layout library. Supports subgraphs and edge crossing minimization. Rather spaced out. 
export const dagreLayoutCompound = (nodes, links, nodeSize) => {
    const g = new dg.graphlib.Graph({compound: true}) 

    // Set an object for the graph label with margins and rank direction
    g.setGraph({ marginx: 20, marginy: 20, rankdir: 'LR', align: 'UL'});
    
    // Default to assigning a new object as a label for each new edge
    g.setDefaultEdgeLabel(() => ({}));
    
    // Create subgraphs for each group to enforce strict rank hierarchy
    groupHierarchy.forEach((group, index) => {
        g.setNode(`group${index}`, { label: group, clusterLabelPos: 'top', style: 'fill: #f9f9f9' });
    });

    // Assign nodes to subgraphs based on their group
    nodes.forEach(node => {
        const groupIndex = groupHierarchy.indexOf(node.group);
        g.setNode(node.id, {
            width: nodeSize,
            height: nodeSize
        });
        g.setParent(node.id, `group${groupIndex}`);
    });
    links.forEach(link => {
        g.setEdge(link.source, link.target)
    })

    dg.layout(g)

    // add x, y information to nodes and returning necessary information for rendering
    nodes.forEach(node => {
        const layoutNode = g.node(node.id)
        node.x = layoutNode.x
        node.y = layoutNode.y
    })
    const linksBase = links.map(link => {
        const source = nodes.find(node => node.id === link.source)
        const target = nodes.find(node => node.id === link.target)
        return {
            ...link,
            points: [
                [source.x, source.y],
                [target.x, target.y]
            ]
        }
    })

    const layoutObj = {
        nodesBase: nodes,
        linksBase: linksBase,
        width: g._label.width,
        height: g._label.height
    }

    return layoutObj
}

// Dagre layout library. Supports subgraphs and edge crossing minimization. Rather spaced out. 
export const dagreLayoutSingle = (nodes, links, nodeSize) => {
    const g = new dg.graphlib.Graph() 

    // Set an object for the graph label with margins and rank direction
    g.setGraph({ marginx: 20, marginy: 20, rankdir: 'LR', align: 'UL'});
    // Default to assigning a new object as a label for each new edge
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach(node => {
        g.setNode(node.id, {
            rank: groupHierarchy.indexOf(node.group),
            width: nodeSize,
            height: nodeSize
        });
    });
    links.forEach(link => {
        g.setEdge(link.source, link.target)
    })

    dg.layout(g)

    // add x, y information to nodes and returning necessary information for rendering
    nodes.forEach(node => {
        const layoutNode = g.node(node.id)
        node.x = layoutNode.x
        node.y = layoutNode.y
    })
    const linksBase = links.map(link => {
        const source = nodes.find(node => node.id === link.source)
        const target = nodes.find(node => node.id === link.target)
        return {
            ...link,
            points: [
                [source.x, source.y],
                [target.x, target.y]
            ]
        }
    })

    return {nodesBase: nodes, linksBase: linksBase, width: g._label.width, height: g._label.height}
}

// Sugiyama layout library.
// https://codepen.io/brinkbot/pen/oNQwNRv?editors=0010
// https://erikbrinkman.github.io/d3-dag/
export const sugiyamaLayout = (nodes, links, nodeSize) => {
    // creating graph object
    const builder = d3dag.graphStratify();
    const dagGraph = builder(nodes);

    // ranking function
    const rank = (node) => groupHierarchy.indexOf(node.group)

    // layout function
    const layout = d3dag
        .sugiyama()
        .layering(d3dag.layeringLongestPath().rank(rank))
        .decross(d3dag.decrossOpt())
        .coord(d3dag.coordSimplex())
        .nodeSize([nodeSize, nodeSize])
        .gap([nodeSize/2, nodeSize/2])
        // truncates edge to render arrows well
        .tweaks([d3dag.tweakShape([nodeSize, nodeSize], d3dag.shapeEllipse)])

    const layoutObj = layout(dagGraph);

    // transforming nodes and links to simplified format for rendering
    const nodesBase = [...dagGraph.nodes()].map(node => {
        return {
            ...node.data, 
            x: node.uy,
            y: node.ux
        }
    })

    // swap x and y of links for rendering. left -> right formatting
    const linksBase = [...dagGraph.links()].map(link => {
        return {
            source: link.source.data.id,
            target: link.target.data.id,
            points: link.points.map(point => [point[1], point[0]]),
            strength: .5
        }
    })

    return {nodesBase, linksBase, width: layoutObj.height, height: layoutObj.width}
}


// Sugiyama layout library.
// https://codepen.io/brinkbot/pen/oNQwNRv?editors=0010
// https://erikbrinkman.github.io/d3-dag/
export const rankedSugiyama = (nodes, links, nodeSize) => {
    // creating graph object
    const builder = d3dag.graphStratify();
    const dagGraph = builder(nodes);

    // ranking function
    const rank = (node) => groupHierarchy.indexOf(node.group)

    // layout function
    const layout = d3dag
        .sugiyama()
        .layering(d3dag.layeringLongestPath().rank(rank))
        .decross(d3dag.decrossOpt())
        .coord(d3dag.coordSimplex())
        .nodeSize([nodeSize, nodeSize])
        .gap([nodeSize/2, nodeSize/2])
        // truncates edge to render arrows well
        .tweaks([d3dag.tweakShape([nodeSize, nodeSize], d3dag.shapeEllipse)])

    layout(dagGraph)

    let maxNumNodes = 0
    groupHierarchy.forEach((group, i) => {
        const groupNodes = nodes.filter(node => node.group === group)
        maxNumNodes = Math.max(maxNumNodes, groupNodes.length)
        groupNodes.forEach(node => {
            node.x = (i + 1) * nodeSize * 1.5
            node.y = node.ux
        })
        groupNodes.sort((a, b) => a.y - b.y)
        // evenly space nodes in group around height 0
        groupNodes.forEach((node, j) => {
            node.y = j * nodeSize * 1.5 - (groupNodes.length - 1) * nodeSize * .75
        })
    })

    nodes.forEach(node => {
        node.y = node.y + (maxNumNodes - 1) * nodeSize * .75 + nodeSize * .75
    })

    const linksBase = links.map(link => {
        const source = nodes.find(node => node.id === link.source)
        const target = nodes.find(node => node.id === link.target)
        return {
            ...link,
            points: [
                [source.x, source.y],
                [target.x, target.y]
            ]
        }
    })

    return {nodesBase: nodes, linksBase: linksBase, 
        width: (groupHierarchy.length + 2) * nodeSize * 1.5, height: maxNumNodes * nodeSize * 1.5}
}


