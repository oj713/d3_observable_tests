import * as dg from '@dagrejs/dagre';
import * as d3 from 'd3';
import * as d3dag from 'd3-dag';

// Global hierarchy order
const groupHierarchy = ['Kneading', 'Pointing', 'Shaping', 'Priming', 
    'PlaceInOven', 'Cutting', 'Crumb', 'Bread']


// Basic layout. Evenly spaces nodes within a group on y-layers. No edge crossing minimization.
export const basicLayout = (nodes) => {
    /** Layout is assuming XScale, YScale of -1 to 1, centered position. Fix this later.
     * const container = svg.append("g")
        .attr("class", "board")
        //.attr("transform", `translate(${width / 2}, ${height / 2})`)

        // const xScale = d3.scaleLinear().domain([-1, 1]).range([-width/2, width/2])
        // const yScale = d3.scaleLinear().domain([1, -1]).range([-height/2, height/2])
     */

    // Layout. Based on grouping.
    groupHierarchy.forEach((group, i) => {
        const groupNodes = nodes.filter(node => node.group === group)
        const numCols = groupNodes.length

        groupNodes.forEach((node, j) => {
            node.y = .9 - .25 * i // y based on group
            node.x = (-0.8 + (1.6 / (numCols + 1)) * (j + 1)) // x based on num nodes in group
        })
    })

    return nodes
}

// Dagre layout library. Supports subgraphs and edge crossing minimization. Rather spaced out. 
export const dagreLayout = (nodes, links, nodeSize) => {
    const g = new dg.graphlib.Graph({compound: true}) 

    // Set an object for the graph label with margins and rank direction
    g.setGraph({ marginx: 20, marginy: 20, rankdir: 'TB', align: 'UL' });
    
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

    const layoutObj = {
        nodesBase: nodes,
        width: g._label.width,
        height: g._label.height
    }

    return layoutObj
}

// Sugiyama layout library.
export const sugiyamaLayout = (nodes, links, nodeSize) => {
    // create DAG data structure from nodes and links.
    const dag_data = nodes.map(node => ({id: node.id, parentIds: []}))
    links.forEach(link => {
        const targetNode = dag_data.find(node => node.id === link.target)
        targetNode.parentIds.push(link.source)
    })
    const builder = d3dag.graphStratify();
    const dagGraph = builder(dag_data);

    // layout
    const layout = d3dag
        .sugiyama()
        .layering(d3dag.layeringLongestPath())
        .decross(d3dag.decrossOpt())
        .coord(d3dag.coordSimplex())
        .nodeSize([nodeSize, nodeSize])
        .gap([nodeSize/2, nodeSize/2])
        // // truncates edge to render arrows well
        .tweaks([d3dag.tweakShape([nodeSize, nodeSize], d3dag.shapeEllipse)])

    const layoutObj = layout(dagGraph);

    nodes.forEach(node => {
        const layoutNode = dagGraph.node(node.id)
        console.log(layoutNode)
        // node.x = layoutNode.x
        // node.y = layoutNode.y
    })

    layoutObj.nodesBase = nodes

    return layoutObj
}

