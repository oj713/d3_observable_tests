import {useRef, useEffect, useState} from 'react'
import {getNetwork, propagateEvidence} from '../redux_stuff/network-services.js'
import {parseNodes, parseLinks} from '../BN_tools/network-parser.js'
import {exampleNodes, exampleLinks} from '../BN_tools/example_BN.js'
import * as d3 from 'd3'

// Evidence propagation example
const PropagatedNet = ({nodeStarter, links}) => {
    const netRef = useRef()

    // basic features of the graph
    const width = window.innerWidth - 300
    const height = 1300
    const radius = 35 // node size
    const duration = 750 // ms, for animations

    const colorScale = {
        "insufficient": "#75B9BE",
        "normal": "#FCDE9C",
        "excess": "#F15946",
        "average": "#FCDE9C",
        "elevated": "#F15946",
        "weak": "#75B9BE",
        "Deficient": '#75B9BE',
        'Normal': '#FCDE9C',
        'Excess': '#F15946'
    }

    const colorLegendScale = {
        "Excess/Elevated": "#F15946",
        "Normal/Average": "#FCDE9C",
        "Insufficient/Weak": "#75B9BE"
    }

    // --------- BASIC SVG INITIALIZATION AND ELEMENTS
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)

    // background
    svg.append('rect')
        .style('fill', 'transparent')
        .attr('width', width)
        .attr('height', height)
        .on('click', () => render({nodes: nodeStarter, links}))

    const container = svg.append("g")
        .attr("class", "board")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)

    // legend
    const legend = svg.append("g")
        .attr('class', 'legend');

    const legendX = width * .8

    legend.selectAll('circle')
        .data(Object.entries(colorLegendScale))
        .enter()
        .append('circle')
            .attr('cx', legendX)
            .attr('cy', (d, i) => height * .15 + i * 25)
            .attr('r', 10)
            .attr('fill', d => d[1])
    legend.selectAll('text')
        .data(Object.entries(colorLegendScale))
        .enter()
        .append('text')
            .attr('x', legendX + 20)
            .attr('y', (d, i) => height * .15 + i * 25)
            .attr('dy', 6)
            .text(d => d[0])

    // scales for x and y
    const xScale = d3.scaleLinear().domain([-1, 1]).range([-width/2, width/2])
    const yScale = d3.scaleLinear().domain([1, -1]).range([-height/2, height/2])

    // Rendering function. allows nodes/links to be updated
    // --------------------------------------------------------------------------------
    const render = ({nodes, links}) => {

    // link data
    container.selectAll("line")
    .data(links, d => d.id)
    .enter()
    .append("line")
    .attr("x1", d => xScale(nodes.find(node => node.id === d.source).x)) // finding x value of source
    .attr("y1", d => yScale(nodes.find(node => node.id === d.source).y))
    .attr("x2", d => xScale(nodes.find(node => node.id === d.target).x)) // finding x value of target
    .attr("y2", d => yScale(nodes.find(node => node.id === d.target).y))
    .attr("stroke", "grey")
    .attr("stroke-width", d => 4 * d.strength)

    // Node center
    const circles = container.selectAll("circle.node")
        .data(nodes, d => d.id)
        
    circles.join("circle")
        .attr("class", "node")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", radius)
        .style("fill", d => d.isEvidence ? "black" : "white")
        .style("stroke", "white")
        .style("stroke-width", "2px")
        
    const nodeTitles = container.selectAll("text.node-title")
        .data(nodes, (d) => d.id)

    nodeTitles.join("text")
        .attr("class", "node-title")
        .attr("x", d => xScale(d.x))
        .attr("y", d => yScale(d.y))
        .attr("text-anchor", "middle")
        .style("fill", d => d.isEvidence ? "white" : "black")
        .style("font-size", "12px")
        .attr("dy", 5)
        .text(d => d.title)
        
    //  --------- PIE CHART ELEMENT
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);
    const arcFunc = d3.arc()
        .innerRadius(radius)
        .outerRadius(radius * 1.5);

    // sendEvidence -- currently random propagation
    const sendEvidence = async({evidence, add}) => {
        try {
            // await response from backend
            const newProbabilities = await propagateEvidence({evidence: evidence})
            console.log(newProbabilities)

            // update nodes with new probabilities
            const newNodes = nodes.map(node => {
                return {
                    ...node,
                    values: newProbabilities[node.id]
                }
            })

            // re-render with new nodes
            render({nodes: newNodes, links})
        } catch (error) {
            alert('Error propagating evidence: ' + error.message)
        }
    }

    const pieContainer = container.selectAll('g.pie-node')
        .data(nodes, d => d.id)
        .join('g')
        .attr('class', 'pie-node')
        .attr('transform', d => `translate(${xScale(d.x)}, ${yScale(d.y)})`)

        
    // rendering each node
    nodes.forEach(node => {
        const arcs = pie(node.values)

        const setEvidence = (event, d) => {
            const newEvidence = {[node.id]: d.data.label}

            // temporarily tearing down shift + click functionality. TODO: bring this back.
            // const add = event.shiftKey

            sendEvidence({evidence: newEvidence, add: false})
        }

        const updatePies = pieContainer.filter(d => d.id === node.id).selectAll('path')
            .data(arcs, d => d.index)

        updatePies.enter() // new pie segments
            .append('path')
            .attr('d', arcFunc)
            .attr('fill', d => colorScale[d.data.label])
            .each(function(d) { this._current = d; })
            .on('mouseover', (event, d) => {
                d3.select(event.target)
                .attr("fill", d3.color(colorScale[d.data.label]).darker(1))
            })
            .on('mouseout', (event, d) => {
                d3.select(event.target)
                .attr("fill", colorScale[d.data.label])
            })
            .on('click', setEvidence) // initial Propagate evidence
            .append('title') // delay in rendering, nonfixable without original implementation
                .text(d => `${d.data.label}: ${Math.round(d.data.value * 100)}%`)
    
        updatePies
            .on('click', setEvidence) // new propagate evidence to ensure updated nodes information   
            .transition() // update existing pies
            .duration(duration) 
            .attrTween('d', function(d) {
                const i = d3.interpolate(this._current, d);
                this._current = i(0);
                return t => arcFunc(i(t));
            })
            .attr('fill', d => colorScale[d.data.label])
            .select('title')
                .text(d => `${d.data.label}: ${Math.round(d.data.value * 100)}%`)

        updatePies.exit().remove(); // remove old pie segments
    });
    } 

    render({nodes: nodeStarter, links})

    // Appending to DOM
    useEffect(() => {
        netRef.current.append(svg.node())
        return(() => svg.node().remove())
    }, [svg])

    return (
        <div>
            <h2>Propagated Network</h2>
            <p> currently random propagation </p>
            <p>Click on node arc to set evidence. Shift-click to add evidence. Click background to reset.</p>
            <ul>
                <li><a href = "https://observablehq.com/@d3/pie-chart-update">Animation Ref</a></li>
                <li><a href = "https://observablehq.com/@infographeo/bayesian-network-visualization">Evidence Propagation</a></li>
            </ul>
            <div ref = {netRef}></div>
        </div>
    )
}

export default function BayesianNet() {
    const [nodeStarter, setNodeStarter] = useState(exampleNodes)
    const [links, setLinks] = useState(exampleLinks)

    // testing retrieval from backend
    // the backend shoulllddddddd be the one formatting the data into what we need
    // but i'm gonna do it in the frontend for now
    useEffect(() => {
        getNetwork().then(response => {
            setNodeStarter(parseNodes(response.nodes))
            setLinks(parseLinks(response.links))
        })
        .catch(error => {
            console.log(error)
        })
    }, [])

    return (
        <div>
            <h2> Propagated Bayesian Network </h2>
            <hr/>
            <PropagatedNet nodeStarter = {nodeStarter} links = {links}/>
        </div>
    )
}