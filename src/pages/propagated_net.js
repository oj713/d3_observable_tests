import {useRef, useEffect, useState} from 'react'
import {getNetwork, propagateEvidence} from '../redux_stuff/network-services.js'
import {parseNodes, parseLinks} from '../BN_tools/network-parser.js'
import * as lm from '../BN_tools/layout_methods.js'
import * as d3 from 'd3'

const NetLegend = () => {
    const legendRef = useRef()

    // variables
    const colorLegendScale = {
        "Excess/Elevated": "#F15946",
        "Normal/Average": "#FCDE9C",
        "Insufficient/Weak": "#75B9BE"
    }
    const padding = 25
    const width = 170
    const radius = 10

    const legend = d3.create("svg")
        .attr("width", width)
        .attr("height", 2 * padding + 6 * radius)
        .style("border", "1px solid black")

    legend.selectAll('rect')
        .data([1])
        .enter()
        .append('rect')
            .attr('width', width)
            .attr('height', 2 * padding + 6 * radius)
            .attr('fill', 'white')
            .attr('opacity', 0.8)

    legend.selectAll('circle')
        .data(Object.entries(colorLegendScale))
        .enter()
        .append('circle')
            .attr('cy', (d, i) => i * 3 * radius)
            .attr('r', radius)
            .attr('fill', d => d[1])
            .attr('transform', `translate(${padding}, ${padding})`)
    legend.selectAll('text')
        .data(Object.entries(colorLegendScale))
        .enter()
        .append('text')
            .attr('x', radius * 1.5)
            .attr('y', (d, i) => i * 3 * radius)
            .attr('dy', radius/2)
            .text(d => d[0])
            .attr('font-size', radius * 1.3)
            .attr('transform', `translate(${padding}, ${padding})`)

    useEffect(() => {
        legendRef.current.append(legend.node())
        return(() => legend.node().remove())
    }, [legend])

    return (
        <div className = "position-absolute" style={{top:padding, left:padding}} ref = {legendRef}></div>
    )
}

// Evidence propagation example
const PropagatedNet = ({nodeStarter, links, layoutAlgorithm}) => {
    const netRef = useRef()

    // Layout computation. Replace for different layouts.
    const nodeSize = 102

    const {nodesBase, linksBase, width, height} = layoutAlgorithm(nodeStarter, links, nodeSize)
    //const {nodesBase, linksBase, width, height} = sugiyamaLayout(nodeStarter, nodeSize)
    //const {nodesBase, linksBase, width, height} = basicLayout(nodeStarter, nodeSize)
    const line = d3.line().curve(d3.curveMonotoneX)

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

    const colorScheme = d3.scaleOrdinal(d3.schemePastel2)
    const getFillColor = (group) => {
        const groupHierarchy = ['Kneading', 'Pointing', 'Shaping', 'Priming', 
            'PlaceInOven', 'Cutting', 'Crumb', 'Bread']
        const groupNum = groupHierarchy.indexOf(group)
        return colorScheme(groupNum)
    }

    // --------- BASIC SVG INITIALIZATION AND ELEMENTS
    const padding = 25
    const svgHeight = window.innerHeight - 150
    const svg = d3.create("svg")
        .attr("width", "100%")
        .attr("height", svgHeight)
        .attr("viewBox", [-padding, -padding, width + 2*padding, height + 2*padding])
        .style("border", "1px solid black")

    // background
    svg.append('rect')
        .style('fill', 'transparent')
        .attr('width', '100%')
        .attr('height', svgHeight)
        .on('click', () => {render({nodes: nodesBase, evidence: {}})})

    const container = svg.append("g")
        .attr("class", "board")

    // link data
    container.selectAll("link")
        .data(linksBase, d => d.id)
        .enter()
        .append("path")
            .attr("class", "link")
            .attr("d", ({ points }) => line(points))
            .attr("stroke", "grey")
            .attr('fill', 'none')
            .attr("stroke-width", d => 4 * d.strength)

    // zooming
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", function(event) {
            container.attr("transform", event.transform)
        }))

    // Rendering function. allows nodes to be updated
    // --------------------------------------------------------------------------------
    const render = ({nodes, evidence}) => {

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
    // adds new evidence to existing evidence list
    const sendEvidence = async({newEvidence}) => {
        try {
            // await response from backend
            const newProbabilities = await propagateEvidence({evidence: newEvidence})

            // update nodes with new probabilities
            const newNodes = nodes.map(node => {
                const isEvidence = Object.keys(newEvidence).includes(node.id)
                return {
                    ...node,
                    values: newProbabilities[node.id],
                    isEvidence: isEvidence
                }
            })

            // re-render with new nodes
            render({nodes: newNodes, evidence: newEvidence})
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
            const newEvidence = {...evidence, [node.id]: d.data.label}

            sendEvidence({newEvidence: newEvidence})
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

    render({nodes: nodesBase, evidence: {}})

    // Appending to DOM
    useEffect(() => {
        netRef.current.append(svg.node())
        return(() => svg.node().remove())
    }, [svg])

    return (
        <div className = "position-relative" ref = {netRef}>
            <NetLegend/>
        </div>
    )
}

export default function BayesianNet() {
    const [nodeStarter, setNodeStarter] = useState([])
    const [links, setLinks] = useState([])
    const [layoutAlgorithm, setLayoutAlgorithm] = useState('sugiyama')

    const layouts = {
        'sugiyama': lm.sugiyamaLayout,
        'moddedSugiyama': lm.rankedSugiyama,
        'basicLayout': lm.basicLayout,
        'dagreLayout': lm.dagreLayoutCompound
    }

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
            <label for = "layoutalg" className = "p-2">Select a layout algorithm: </label>
            <select onChange = {(e) => setLayoutAlgorithm(e.target.value)}>
                <option value = "sugiyama"> Sugiyama layout</option>
                <option value = "moddedSugiyama"> Sugiyama-informed grouping</option>
                <option value = "basicLayout"> Edge-ignorant grouping </option>
                <option value = "dagreLayout"> Dagre layout </option>
            </select>
            <PropagatedNet nodeStarter = {nodeStarter} links = {links} layoutAlgorithm = {layouts[layoutAlgorithm]}/>
        </div>
    )
}