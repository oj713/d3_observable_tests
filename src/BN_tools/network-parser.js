import {basicLayout} from './layout_methods'

export const parseNodes = (nodesRaw) => {
    let nodes = nodesRaw.map(node => {
        return {
            ...node,
            x: 0,
            y: 0,
            isEvidence: false
        }
    })

    return nodes
}

export const parseLinks = (linksRaw) => {
    const links = linksRaw.map(link => { return {
        ...link,
        strength: .5
    }})

    return links
}