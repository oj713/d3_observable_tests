import * as dg from '@dagrejs/dagre';

// Global hierarchy order
const groupHierarchy = ['Kneading', 'Pointing', 'Shaping', 'Priming', 
    'PlaceInOven', 'Cutting', 'Crumb', 'Bread']

export const basicLayout = (nodes) => {
    // Layout. Based on grouping for now.
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

// using dagre library
export const dagreLayout = (nodes, links) => {
    const g = new dg.graphlib.Graph() 
    // Set an object for the graph label
    g.setGraph({});
    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(function() { return {}; });

    nodes.forEach(node => {
        g.setNode(node.id, {label: node.title, width: 102, height: 102})
    })
    links.forEach(link => {
        g.setEdge(link.source, link.target)
    })

    dg.layout(g)

    return g
}