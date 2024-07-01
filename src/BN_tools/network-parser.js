export const parseNodes = (nodesRaw) => {
    const nodes = nodesRaw.map(node => {
        // remove first word of the title for nodes like DoughStickiness, ActivityFermentation, etc. To fit inside circle presentation.
        const titleStart = node.title.slice(1).search(/[A-Z]/)
        let title = node.title
        if (titleStart > -1) {
            title = title.slice(titleStart + 1)
        }

        return {
            ...node,
            title: title,
            group: node.group === "PlaceInOven" ? "Oven" : node.group,
            x: 0,
            y: 0,
            isEvidence: false, // is this node an evidence node?
            diffFromBaseline: 0, // statistic of change
            isExpanded: false // is this node rendered as expanded?
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