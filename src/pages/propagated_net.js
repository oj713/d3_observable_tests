import {useRef, useEffect, useState} from 'react'
import {getNetwork, propagateEvidence} from '../redux_stuff/network-services.js'
import {parseNodes, parseLinks} from '../BN_tools/network-parser.js'
import {dagreLayout} from '../BN_tools/layout_methods.js'
import * as d3 from 'd3'

// Evidence propagation example
const PropagatedNet = ({nodeStarter, links}) => {
    const netRef = useRef()

    // Layout computation. Replace for different layouts.
    const nodeSize = 102
    const layout = dagreLayout(nodeStarter, links, nodeSize)
    const {nodesBase, width, height} = layout

    // basic features of the graph
    const radius = nodeSize/3 // node size
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

    const colorScheme = d3.scaleOrdinal(d3.schemePastel2)
    const getFillColor = (group) => {
        const groupHierarchy = ['Kneading', 'Pointing', 'Shaping', 'Priming', 
            'PlaceInOven', 'Cutting', 'Crumb', 'Bread']
        const groupNum = groupHierarchy.indexOf(group)
        return colorScheme(groupNum)
    }

    // --------- BASIC SVG INITIALIZATION AND ELEMENTS
    const svg = d3.create("svg")
        // .attr("width", width)
        // .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("border", "1px solid black")

    // background
    svg.append('rect')
        .style('fill', 'transparent')
        .attr('width', width)
        .attr('height', height)
        .on('click', () => render({nodes: nodesBase, links}))

    const container = svg.append("g")
        .attr("class", "board")

    // legend
    const legend = svg.append("g")
        .attr('class', 'legend');

    const legendX = width * .8

    legend.selectAll('background')
        .data([1])
        .enter()
        .append('rect')
            .attr('x', legendX - 40)
            .attr('y', height * .05 + 10)
            .attr('width', 300)
            .attr('height', 180)
            .attr('fill', 'white')
            .attr('stroke', 'black')
    legend.selectAll('circle')
        .data(Object.entries(colorLegendScale))
        .enter()
        .append('circle')
            .attr('cx', legendX)
            .attr('cy', (d, i) => height * .07 + i * 50)
            .attr('r', 20)
            .attr('fill', d => d[1])
    legend.selectAll('text')
        .data(Object.entries(colorLegendScale))
        .enter()
        .append('text')
            .attr('x', legendX + 30)
            .attr('y', (d, i) => height * .071 + i * 50)
            .attr('dy', 6)
            .text(d => d[0])
            .attr('font-size', '25px')

    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", function(event) {
            container.attr("transform", event.transform)
        }))

    // Rendering function. allows nodes/links to be updated
    // --------------------------------------------------------------------------------
    const render = ({nodes, links}) => {

    // link data
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

    // Node center
    const circles = container.selectAll("circle.node")
        .data(nodes, d => d.id)
        
    circles.join("circle")
        .attr("class", "node")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", radius)
        // color based on group
        .style("fill", d => d.isEvidence ? "black" : getFillColor(d.group))
        .style("stroke", "white")
        .style("stroke-width", "2px")
        
    const nodeTitles = container.selectAll("text.node-title")
        .data(nodes, (d) => d.id)

    nodeTitles.join("text")
        .attr("class", "node-title")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
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
                const isEvidence = Object.keys(evidence).includes(node.id)
                return {
                    ...node,
                    values: newProbabilities[node.id],
                    isEvidence: isEvidence
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
        .attr('transform', d => `translate(${d.x}, ${d.y})`)

        
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

    render({nodes: nodesBase, links})

    // Appending to DOM
    useEffect(() => {
        netRef.current.append(svg.node())
        return(() => svg.node().remove())
    }, [svg])

    return (
        <div ref = {netRef}></div>
    )
}

export default function BayesianNet() {
    const [nodeStarter, setNodeStarter] = useState([])
    const [links, setLinks] = useState([])

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