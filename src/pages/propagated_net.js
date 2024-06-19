import {useRef, useEffect, useState} from 'react'
import {getNetwork, propagateEvidence} from '../redux_stuff/network-services.js'
import {parseNodes, parseLinks} from '../BN_tools/network-parser.js'
import * as lm from '../BN_tools/layout_methods.js'
import * as d3 from 'd3'

const probValues = {
    "low": "gainsboro", 
    "avg": "gray", 
    "high": "#454545"
}
const probCols = {
    "low": "#75B9BE",
    "avg": "#FCDE9C",
    "high": "#F15946"
}

const NetLegend = ({cols}) => {
    const legendRef = useRef()

    // variables
    const colorLegendScale = {
        "Excess/Elevated": cols.high,
        "Normal/Average": cols.avg,
        "Insufficient/Weak": cols.low
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
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
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
const PropagatedNet = ({nodeStarter, links, layoutAlgorithm, colorScheme}) => {
    const netRef = useRef()

    // Layout computation. Replace for different layouts.
    const nodeSize = 132

    const {nodesBase, linksBase, width, height} = layoutAlgorithm(nodeStarter, links, nodeSize + 6)
    //const {nodesBase, linksBase, width, height} = sugiyamaLayout(nodeStarter, nodeSize)
    //const {nodesBase, linksBase, width, height} = basicLayout(nodeStarter, nodeSize)
    const line = d3.line().curve(d3.curveMonotoneX)

    // basic features of the graph
    const radius = nodeSize/3 // node size
    const duration = 750 // ms, for animations

    // color schemes dependent on selected color option
    const cols = colorScheme === "prob" ? probCols : probValues
    const colorScale = {
        "insufficient": cols.low,
        "normal": cols.avg,
        "excess": cols.high,
        "average": cols.avg,
        "elevated": cols.high,
        "weak": cols.low,
        "Deficient": cols.low,
        'Normal': cols.avg,
        'Excess': cols.high
    }
    const colors = d3.scaleOrdinal(d3.schemeSet3)
    const getFillColor = (group) => {
        const groupHierarchy = ['Kneading', 'Pointing', 'Shaping', 'Priming', 
            'Oven', 'Cutting', 'Crumb', 'Bread']
        const groupNum = groupHierarchy.indexOf(group)
        return colors(groupNum)
    }

    // --------- BASIC SVG INITIALIZATION AND ELEMENTS
    const padding = 25
    const svgHeight = window.innerHeight - 190
    const svgWidth = netRef.current ? netRef.current.parentElement.clientWidth : 800
    const svg = d3.create("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .attr("viewBox", [-padding, -padding, width + 2*padding, height + 2*padding])
        .style("border", "1px solid black")
        .on('click', (event) => {
            if (!d3.select(event.target).classed('node')) {
                render({ nodes: nodesBase, evidence: {}, markovIds: []});
            }
        })

    const container = svg.append("g")
        .attr("class", "board")

    // Arrows
    const defs = svg.append("defs")
    defs.selectAll("marker") // "defs" are like custom prebuilt components
        .data(["end"])
        .join("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 9)
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path") // drawing
            .attr("fill", "grey")
            .attr("d", 'M0,-5L10,0L0,5') // triangle shape

    // Glowing effect
    defs.selectAll('filter')
        .data(['glow'])
        .join('filter')
        .attr('id', 'glow')
        .append('feGaussianBlur')
            .attr("stdDeviation","6")
            .attr("result","coloredBlur")
        .append('feMerge')
        .append('feMergeNode')
            .attr("in","coloredBlur")
        .append('feMergeNode')
            .attr("in","SourceGraphic")

    // zooming
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", function(event) {
            container.attr("transform", event.transform)
        }))

    // Rendering function. allows nodes to be updated
    // --------------------------------------------------------------------------------
    const render = ({nodes, evidence, markovIds}) => {

    const markovNodes = nodes.filter(node => markovIds.includes(node.id))

    // Markov glow
    container.selectAll("circle.markovGlow")
        .data(markovNodes, d => d.id)
        .join("circle")
        .attr("class", "markovGlow")
        .style("filter", "url(#glow)")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", radius * 1.7)
        .style("fill", colorScheme === "prob" ? "#8dde5b" : "#c081f0")
    
    container.selectAll("circle.markovBorder")
        .data(markovNodes, d => d.id)
        .join("circle")
        .attr("class", "markovBorder")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", radius * 1.5)
        .style("stroke", "white")
        .style("stroke-width", "4px")
        .style("fill", "none")

    // Links
    container.selectAll("link")
        .data(linksBase, d => d.id)
        .enter()
        .append("path")
            .attr("class", "link")
            .attr("d", ({ points }) => line(points))
            .attr("stroke", "grey")
            .attr('fill', 'none')
            .attr("stroke-width", d => 4 * d.strength)
            .attr('marker-end', 'url(#arrow)')
        
    // Node center
    container.selectAll("circle.node")
        .data(nodes, d => d.id)
        .join("circle")
        .attr("class", "node")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", radius)
        .style("fill", d => d.isEvidence ? "black" : 
            colorScheme === "prob" ? "white" : getFillColor(d.group))
        .style("stroke", "white")
        .style("stroke-width", "3px")
        
    container.selectAll("text.node-title")
        .data(nodes, (d) => d.id)
        .join("text")
        .attr("class", "node-title node")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .style("fill", d => d.isEvidence ? "white" : "black")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .attr("dy", 10)
        .text(d => d.title)
    
    // node groups
    container.selectAll("text.node-group")
        .data(nodes, (d) => d.id)
        .join("text")
        .attr("class", "node node-group")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .style("fill", d => d.isEvidence ? "white" : "black")
        .style("font-size", "10px")
        .style("font-style", "italic")
        .attr("dy", -5)
        .text(d => d.group)
        
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
        .attr('class', 'pie-node node')
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

    render({nodes: nodesBase, evidence: {}, markovIds: ["Shaping_Elasticity"]})

    // Appending to DOM
    useEffect(() => {
        netRef.current.append(svg.node())
        return(() => svg.node().remove())
    }, [svg])

    return (
        <div className = "position-relative" ref = {netRef}>
            <NetLegend cols = {cols}/>
        </div>
    )
}

export default function BayesianNet() {
    const [nodeStarter, setNodeStarter] = useState([])
    const [links, setLinks] = useState([])
    const [layoutAlgorithm, setLayoutAlgorithm] = useState('sugiyama')
    const [colorScheme, setColorScheme] = useState("prob")

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
            <hr className = "pb-0"/>
            <div className = "d-flex">
                <div className = "inline-block pb-3 pe-4">
                    <label for = "layoutalg" className = "p-1">Select a layout algorithm: </label>
                    <br/>
                    <select id = "#layoutalg" onChange = {(e) => setLayoutAlgorithm(e.target.value)}>
                        <option value = "sugiyama"> Sugiyama layout</option>
                        <option value = "moddedSugiyama"> Sugiyama-informed grouping</option>
                        <option value = "basicLayout"> Edge-ignorant grouping </option>
                        <option value = "dagreLayout"> Dagre layout </option>
                    </select>
                </div>
                <div className = "inline-block pb-3 pe-4">
                    <label for = "colorscheme" className = "p-1">Select a color scheme: </label>
                    <br/>
                    <select id = "#colorscheme" onChange = {(e) => setColorScheme(e.target.value)}>
                        <option value = "prob"> Colorful Probabilities </option>
                        <option value = "group"> Colorful Groups </option>
                    </select>
                </div>
            </div>
            <PropagatedNet nodeStarter = {nodeStarter} links = {links} 
            layoutAlgorithm = {layouts[layoutAlgorithm]} colorScheme = {colorScheme}/>
        </div>
    )
}