// functions to parse network data provided by Briggs

const defaultNodes = [
    {id: "a1", title: "Elasticity", group: "dough", x:  0.5, y: 0.0, 
        values: [{label: "Normal", value: 0.5}, 
                {label: "Excess", value: 0.3},
                {label: "Deficient", value: 0.2}],
        isEvidence: false
    },
    {id: "a2", title: "Crumb", group: "bread", x: -0.5, y: 0.75, 
        values: [{label: "Normal", value: 0.9}, 
                {label: "Excess", value: 0.05},
                {label: "Deficient", value: 0.05}],
        isEvidence: false
    },
    {id: "a3", title: "Stickiness", group: "dough", x: -0.5, y: 0.0, 
        values: [{label: "Normal", value: 0.6}, 
                {label: "Excess", value: 0.3},
                {label: "Deficient", value: 0.1}],
        isEvidence: false
    },
    {id: "a4", title: "Color", group: "bread", x:  0.0, y: -0.75, 
        values: [{label: "Normal", value: 0.7}, 
                {label: "Excess", value: 0.1},
                {label: "Deficient", value: 0.2}],
        isEvidence: false
    }
]
const defaultLinks = [
    {id: "b1", source: "a2", target: "a3", strength: .5},
    {id: "b2", source: "a3", target: "a4", strength: .2},
    {id: "b3", source: "a1", target: "a4", strength: .8}
]

// chronological order
const groupHierarchy = ['Kneading', 'Pointing', 'Shaping', 'Priming', 
    'PlaceInOven', 'Cutting', 'Crumb', 'Bread']

export const parseNodes = (nodesRaw) => {
    const nodes = nodesRaw.map(node => {
        return {
            ...node,
            x: 0,
            y: 0,
            values: [{label: "Normal", value: 0.5}, 
                    {label: "Excess", value: 0.3},
                    {label: "Deficient", value: 0.2}],
            isEvidence: false
        }
    })

    // Layout. Based on grouping for now.
    groupHierarchy.forEach((group, i) => {
        const groupNodes = nodes.filter(node => node.group === group)
        const numCols = groupNodes.length

        groupNodes.forEach((node, j) => {
            node.y = .9 - .25 * i // y based on group
            node.x = (-0.8 + (1.6 / (numCols + 1)) * (j + 1)) // x based on num nodes in group
        })
    })

    return (
        nodes || defaultNodes
    )
}

export const parseLinks = (linksRaw) => {
    const links = linksRaw.map(link => { return {
        ...link,
        strength: .5
    }})

    return (
        links || defaultLinks
    )
}