import {basicLayout} from './layout_methods'

export const parseNodes = (nodesRaw) => {
    let nodes = nodesRaw.map(node => {
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

    nodes = basicLayout(nodes)

    return nodes
}

export const parseLinks = (linksRaw) => {
    const links = linksRaw.map(link => { return {
        ...link,
        strength: .5
    }})

    return links
}