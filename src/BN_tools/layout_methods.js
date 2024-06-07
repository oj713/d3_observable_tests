
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

export const SugiyamaLayout = (nodes, links) => {
    // Todo - implement Sugiyama layout
    return nodes
}