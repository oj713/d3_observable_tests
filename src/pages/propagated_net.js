import {useRef, useEffect, useState} from 'react'
import {getNetwork, getMarkov, propagateEvidence} from '../redux_stuff/network-services.js'
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

// Prototype propagated network
// Todo: 
// - importance algorithm
// - toggleable evidence comparison mode
const PropagatedNet = ({nodeStarter, links, layoutAlgorithm, colorScheme}) => {
    const netRef = useRef()

    // Layout computation. Replace for different layouts.
    const nodeSize = 132

    const {nodesBase, linksBase, width, height} = layoutAlgorithm(nodeStarter, links, nodeSize + 6)
    const line = d3.line().curve(d3.curveMonotoneX)

    // basic features of the graph
    const radius = nodeSize/3 // node size
    const duration = 750 // ms, for animations
    const diffThreshold = 0.2 // importance threshold for evidence comparison

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
    const markovCols = {
        "target": colorScheme === "prob" ? "#0f5c28" : "#161694",
        "blanket": colorScheme === "prob" ? "#76d13d" : "#904fc2"
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
    const svg = d3.create("svg")
        .attr("width", "100%")
        .attr("height", svgHeight)
        .attr("viewBox", [-padding, -padding, width + 2*padding, height + 2*padding])
        .style("border", "1px solid black")
        .on('click', (event) => {
            if (!d3.select(event.target).classed('node')) {
                render({ nodes: nodesBase, evidence: {}, markov: {}});
            }
        })

    const container = svg.append("g")
        .attr("class", "board")

    // Arrowheads: defining 25 for interpolation
    const ahI = d3.interpolate(9, radius * .35 + 9)
    const arrowHeadDefData = [...new Array(25).keys()].map(i => {
        return {refX: ahI(i * 4/100), id: i}
    })
    const defs = svg.append("defs")
    defs.selectAll("marker")
        .data(arrowHeadDefData)
        .join("marker")
        .attr("id", d => `arrow_${d.id}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", d => d.refX) // position along link
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto")
        .append("path") // drawing
            .attr("fill", "grey")
            .attr("d", 'M0,-5L10,0L0,5')

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
    const render = ({nodes, evidence, markov}) => {

    const getMarkovFill = (id) => {
        if (!markov.id) {
            return "transparent"
        } else if (markov.id === id) {
            return markovCols.target
        } else if (markov.blanket.includes(id)) {
            return markovCols.blanket
        } else {
            return "transparent"
        }
    }

    // Markov glow
    container.selectAll("circle.markovGlow")
        .data(nodes, d => d.id)
        .join("circle")
        .attr("class", "markovGlow")
        .style("filter", "url(#glow)")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.diffFromBaseline > diffThreshold ? radius * 2.3 : radius * 1.8)
        .style("fill", "transparent")
        .transition()
            .duration(duration/5)
            .style("fill", d => getMarkovFill(d.id))
    
    // Updates Markov blanket for nodes
    const updateMarkov = (event, d) => {
        //if (!event.shiftKey) {return}
        
        getMarkov(d.id).then(response => {
            if (!response) {return}
            render({nodes: nodes, evidence: evidence, 
                markov: {"id": d.id, "blanket": response}})
        })
    }

    // Links -- arrowhead distance updates
    container.selectAll("path.link")
        .data(linksBase, d => d.id)
        .join(
            enter => enter.append("path")
                .attr("class", "link")
                .attr("d", ({ points }) => line(points))
                .attr("stroke", "grey")
                .attr('fill', 'none')
                .attr("stroke-width", d => 4 * d.strength)
                .attr('marker-end', "url(#arrow_0)")
                .each(function(d) {this._current = 0}),
            update => update // moving arrowheads
                .transition()
                .duration(duration)
                .attrTween('marker-end', function(d) {
                    const isExpanded = nodes.find(n => n.id === d.target).diffFromBaseline > diffThreshold ? 1 : 0
                    const i = d3.interpolate(this._current * 24, isExpanded * 24)
                    this._current = isExpanded
                    return t => `url(#arrow_${Math.round(i(t))})`
                })
        )

    // white background circle for nodes (hides markov blanket)
    container.selectAll("circle.background")
        .data(nodes, d => d.id)
        .join(
            enter => enter.append("circle")
                .attr("class", "background")
                .each(function(d) {this._current = d.diffFromBaseline})
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", radius * 1.5 + 2)
                .style("fill", "white"),
            update => update.transition()
                .duration(duration)
                .attrTween('r', function(d) {
                    const getR = (diff) => diff > diffThreshold ? 2.05 : 1.5
                    const i = d3.interpolate(getR(this._current), getR(d.diffFromBaseline))
                    this._current =  d.diffFromBaseline
                    return t => radius * i(t) + 2
                })
        )

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
        .style("stroke-width", "4px")
        .on("click", updateMarkov)
        
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
    const arcFunc = (start) => d3.arc()
        .innerRadius(radius * start)
        .outerRadius(radius * (start + 0.5))

    // sendEvidence -- currently random propagation
    // adds new evidence to existing evidence list
    const sendEvidence = async({newEvidence}) => {
        try {
            // await response from backend
            const newProbabilities = await propagateEvidence({evidence: newEvidence})

            // update nodes with new probabilities
            const newNodes = nodes.map(node => {
                const isEvidence = Object.keys(newEvidence).includes(node.id)
                // get "difference" metric
                const baselineValues = nodesBase.find(n => n.id === node.id).values
                const diffFromBaseline = baselineValues.map((v, i) => 
                    Math.abs(v.value - newProbabilities[node.id][i].value))
                    .reduce((acc, curr) => acc + curr, 0)

                // plotting breaks if a label probability is nearly 1
                let plottableProbs = newProbabilities[node.id]
                if (plottableProbs.some(p => p.value > .999)) {
                    plottableProbs.forEach(p => { p.value = p.value > .999 ? 1 : 0 })
                }
                
                return {
                    ...node,
                    values: plottableProbs,
                    isEvidence: isEvidence,
                    diffFromBaseline: diffFromBaseline
                }
            })

            // re-render with new nodes
            render({nodes: newNodes, evidence: newEvidence, markov: markov})
        } catch (error) {
            alert('Error propagating evidence: ' + error.message)
        }
    }

    const pieContainer = container.selectAll('g.pie-node')
        .data(nodes, d => d.id)
        .join('g')
        .attr('class', 'pie-node node')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)

    // COMPARISON RING
    const thresholdIds = nodes.filter(node => node.diffFromBaseline > diffThreshold).map(n => n.id)

    const outerPieContainer = container.selectAll('g.outer-pie')
        .data(nodesBase.filter(node => thresholdIds.includes(node.id)), d => d.id)
        .join('g')
        .attr('class', 'outer-pie node')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)

    // rendering each node inner ring
    nodesBase.forEach(node => {
        const arcs = pie(node.values)

        const updatePies = outerPieContainer.filter(d => d.id === node.id).selectAll('path')
            .data(arcs, d => d.index)

        updatePies.enter() // new pie segments
            .append('path')
            .attr('d', arcFunc(1))
            .attr('class', 'node')
            .attr('fill', d => colorScale[d.data.label])
            .style('opacity', .5)
            .append('title')
                .text(d => `${d.data.label}: ${Math.round(d.data.value * 100)}%`)
    })
    
    // PRIMARY RING
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
            .attr('d', arcFunc(1))
            .attr('class', 'node')
            .attr('fill', d => colorScale[d.data.label])
            .each(function(d) { this._current = {data: d, diffFromBaseline: node.diffFromBaseline}})
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
                const i = d3.interpolate(this._current.data, d)
                const getR = (n) => n.diffFromBaseline > diffThreshold ? 1.55 : 1
                const j = d3.interpolate(getR(this._current), getR(node))
                this._current = {data: i(0), diffFromBaseline: node.diffFromBaseline}
                return t => arcFunc(j(t))(i(t))
            })
            .attr('fill', d => colorScale[d.data.label])
            .select('title')
                .text(d => `${d.data.label}: ${Math.round(d.data.value * 100)}%`)

        updatePies.exit().remove(); // remove old pie segments
    })

    } // end render()

    // Initial render
    render({nodes: nodesBase, evidence: {}, markov: {}})

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