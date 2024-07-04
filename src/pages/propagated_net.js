import {useRef, useEffect, useState} from 'react'
import {getNetwork, getMarkov, propagateEvidence} from '../redux_stuff/network-services.js'
import {parseNodes, parseLinks} from '../BN_tools/network-parser.js'
import * as lm from '../BN_tools/layout_methods.js'
import * as d3 from 'd3'

// Color scheme options for 'group' and 'prob'
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

/**
 * Network Legend component. Displays static color scheme.
 * @param cols color scheme to display
 * @returns div containing svg of network legend
 */
const NetLegend = ({cols}) => {
    const legendRef = useRef()

    // Variables to define
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

    // rectangular background
    legend.selectAll('rect')
        .data([1])
        .enter()
        .append('rect')
            .attr('width', width)
            .attr('height', 2 * padding + 6 * radius)
            .attr('fill', 'white')
            .attr('opacity', 0.8)

    // circles for each color 
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
    
    // text for each color
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

    // attaching to div
    useEffect(() => {
        legendRef.current.append(legend.node())
        return(() => legend.node().remove())
    }, [legend])

    return (
        <div className = "position-absolute" style={{top:padding, left:padding}} ref = {legendRef}></div>
    )
}

/**
 * Propagated Network component. Creates and updates a Bayesian network with evidence propagation.
 * Not implemented: 
 *  - Resolving discrepancies between toggle and evCompRef
 *  - smarter importance algorithm
 * Note warning "React Hook useEffect has a missing dependency: 'render'". Currently no effect on performance, choosing to ignore. 
 * @param nodeStarter the base nodes of the network (and probabilities)
 * @param links the links between nodes
 * @param layoutAlgorithm Layout algorithm ('Sugiyama', 'moddedSugiyama', 'basicLayout', 'dagreLayout')
 * @param colorScheme color scheme ('prob', 'group')
 * @returns a div containing Bayesian Network SVG
 */
const PropagatedNet = ({nodeStarter, links, layoutAlgorithm, colorScheme}) => {
    // used to append the SVG to the DOM
    const netRef = useRef()
    // Refs for updating nodes, evidence, and markov blanket
    const evCompRef = useRef(false) 
    const nodesRef = useRef([])
    const evidenceRef = useRef({})
    const markovRef = useRef({})

    // Layout computation. Replace for different layouts.
    const nodeSize = 132
    const {nodesBase, linksBase, width, height} = layoutAlgorithm(nodeStarter, links, nodeSize + 6)
    const line = d3.line().curve(d3.curveMonotoneX)

    // Defining basic features of the graph
    const radius = nodeSize/3
    const duration = 750 // ms, for animations
    // "Significant Difference" function for evidence propagation
    const getDiff = (id, newValues) => {
        const baselineValues = nodesBase.find(n => n.id === id).values
        const diff = baselineValues.map((v, i) => 
            Math.abs(v.value - newValues[i].value))
            .reduce((acc, curr) => acc + curr, 0)

        return diff
    }
    // Whether a node is rendered as expanded
    const getIsExpanded = (diff) => {
        return evCompRef.current && (diff > .2)
    }

    // Color schemes
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
                nodesRef.current = nodesBase
                evidenceRef.current = {}
                markovRef.current = {}
                render()
            }
        })

    const container = svg.append("g")
        .attr("class", "board")

    // Arrowheads: defining 25 for animation interpolation
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

    // Glowing effect for Markov Blankets
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

    // Zooming for all SVG elements
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", function(event) {
            container.attr("transform", event.transform)
        }))

    /**
     * Render function for the network. 
     *  - Markov glow behind nodes + updating Markov blanket
     *  - Links between nodes with animated arrowheads
     *  - Nodes: background, central information, evidence ring, comparison ring
     *  - Evidence propagation
     */
    const render = () => {
        const nodes = nodesRef.current
        const evidence = evidenceRef.current
        const markov = markovRef.current

        // Markov glow
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
        container.selectAll("circle.markovGlow")
            .data(nodes, d => d.id)
            .join("circle")
            .attr("class", "markovGlow")
            .style("filter", "url(#glow)")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => d.isExpanded ? radius * 2.3 : radius * 1.8)
            .style("fill", "transparent")
            .transition()
                .duration(duration/5)
                .style("fill", d => getMarkovFill(d.id))
        
        // Updates Markov blanket for nodes
        const updateMarkov = (event, d) => {
            //if (!event.shiftKey) {return}
            
            getMarkov(d.id).then(response => {
                if (!response) {return}
                markovRef.current = {"id": d.id, "blanket": response}
                render()
            })
        }

        // Links -- arrowhead position animates depending on target node expansion
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
                        const isTargetExpanded = nodes.find(n => n.id === d.target).isExpanded ? 1 : 0
                        const i = d3.interpolate(this._current * 24, isTargetExpanded * 24)
                        this._current = isTargetExpanded
                        return t => `url(#arrow_${Math.round(i(t))})`
                    })
            )

        // White background circle for nodes (hides markov blanket)
        container.selectAll("circle.background")
            .data(nodes, d => d.id)
            .join(
                enter => enter.append("circle")
                    .attr("class", "background")
                    .each(function(d) {this._current = d.isExpanded})
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", radius * 1.5 + 2)
                    .style("fill", "white"),
                update => update.transition() // Animates w/ node expansion
                    .duration(duration)
                    .attrTween('r', function(d) {
                        const getR = (exp) => exp ? 2.05 : 1.5
                        const i = d3.interpolate(getR(this._current), getR(d.isExpanded))
                        this._current =  d.isExpanded
                        return t => radius * i(t) + 2
                    })
            )

        // Static central node information
        container.selectAll("circle.node") // center circle
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
        container.selectAll("text.node-title") // center text, title
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
        container.selectAll("text.node-group") // center text, group
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
            
        // -------------------- PROBABILITY RINGS
        const pie = d3.pie()
            .value(d => d.value)
            .sort(null);
        const arcFunc = (start) => d3.arc()
            .innerRadius(radius * start)
            .outerRadius(radius * (start + 0.5))

        /**
         * Send evidence to backend and update nodes with new probabilities.
         * Recursively calls render() to update the network with new evidence.
         * @param newEvidence evidence set for propagation 
         */
        const sendEvidence = async({newEvidence}) => {
            try {
                // await response from backend
                const newProbabilities = await propagateEvidence({evidence: newEvidence})

                // update nodes with new probabilities
                const newNodes = nodes.map(node => {
                    const isEvidence = Object.keys(newEvidence).includes(node.id)
                    // get "difference" metric
                    const diffFromBaseline = getDiff(node.id, newProbabilities[node.id])
                    const isExpanded = getIsExpanded(diffFromBaseline)

                    // plotting breaks if a label probability is nearly 1
                    let plottableProbs = newProbabilities[node.id]
                    if (plottableProbs.some(p => p.value > .999)) {
                        plottableProbs.forEach(p => { p.value = p.value > .999 ? 1 : 0 })
                    }
                    
                    return {
                        ...node,
                        values: plottableProbs,
                        isEvidence: isEvidence,
                        diffFromBaseline: diffFromBaseline,
                        isExpanded: isExpanded
                    }
                })

                // Update the new node information and evidence set and force redraw
                nodesRef.current = newNodes
                evidenceRef.current = newEvidence
                render()
            } catch (error) {
                alert('Error propagating evidence: ' + error.message)
            }
        }

        // COMPARISON RING
        // baseline probabilities of node at 50% opacity
        // only renders if we are in comparison mode & node is expanded
        const thresholdIds = nodes.filter(node => node.isExpanded).map(n => n.id)

        const outerPieContainer = container.selectAll('g.outer-pie')
            .data(nodesBase.filter(node => thresholdIds.includes(node.id)), d => d.id)
            .join('g')
            .attr('class', 'outer-pie node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`)

        nodesBase.forEach(node => {
            const arcs = pie(node.values)

            const updateCompPies = outerPieContainer.filter(d => d.id === node.id).selectAll('path')
                .data(arcs, d => d.index)

            updateCompPies.enter() // new pie segments
                .append('path')
                .attr('d', arcFunc(1))
                .attr('class', 'node')
                .attr('fill', d => colorScale[d.data.label])
                .style('opacity', .5)
                .append('title')
                    .text(d => `${d.data.label}: ${Math.round(d.data.value * 100)}%`)
        })
        
        // PRIMARY RING
        // current probabilities of node
        // renders at all times -- expands, contracts, and updates via animation
        const pieContainer = container.selectAll('g.pie-node')
            .data(nodes, d => d.id)
            .join('g')
            .attr('class', 'pie-node node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`)

        nodes.forEach(node => {
            const arcs = pie(node.values)

            // formatting evidence and sending to sendEvidence
            const setEvidence = (event, d) => {
                const newEvidence = {...evidence, [node.id]: d.data.label}

                sendEvidence({newEvidence: newEvidence})
            }

            // update pie segments, arcs data manipulated to force rerender w/ isExpanded change
            const updatePies = pieContainer.filter(d => d.id === node.id).selectAll('path')
                .data(arcs.map(a => {return {...a, isExpanded: node.isExpanded}}), d => d.index)

            updatePies.enter() // new pie segments
                .append('path')
                .attr('d', arcFunc(1))
                .attr('class', 'node')
                .attr('fill', d => colorScale[d.data.label])
                .each(function(d) { this._current = d})
                .on('mouseover', (event, d) => {
                    d3.select(event.target)
                    .attr("fill", d3.color(colorScale[d.data.label]).darker(1))
                })
                .on('mouseout', (event, d) => {
                    d3.select(event.target)
                    .attr("fill", colorScale[d.data.label])
                })
                .on('click', setEvidence) // initial Propagate evidence
                .append('title') // delay in showing title, nonfixable without custom tooltip
                    .text(d => `${d.data.label}: ${Math.round(d.data.value * 100)}%`)
        
            updatePies // update existing pies
                .on('click', setEvidence) // new propagate evidence to ensure updated nodes information   
                .transition() 
                .duration(duration) 
                .attrTween('d', function(d) {
                    // interpolate between current and new probabilities
                    const i = d3.interpolate(this._current, d)
                    const getR = (n) => n.isExpanded ? 1.55 : 1
                    // interpolate between current and new radii
                    const j = d3.interpolate(getR(this._current), getR(node))
                    this._current = i(0)

                    return t => arcFunc(j(t))(i(t))
                })
                .attr('fill', d => colorScale[d.data.label])
                .select('title')
                    .text(d => `${d.data.label}: ${Math.round(d.data.value * 100)}%`)

            updatePies.exit().remove(); // remove old pie segments
        })
    } // end render()

    // Start the animation
    useEffect(() => {
        // Define toggle logic for comparison mode
        const handleToggle = () => {
            evCompRef.current = !evCompRef.current
            nodesRef.current = nodesRef.current.map(node => {
                return {...node, isExpanded: getIsExpanded(node.diffFromBaseline)}
            })
            render()
        }
        window.addEventListener('evCompToggle', handleToggle)

        // set NodesBase and trigger initial render
        nodesRef.current = nodesBase
        render()

        return () => window.removeEventListener('evCompToggle', handleToggle)
    }, [nodesBase])

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

/**
 * Draws page and option toggles
 * @returns BayesianNet component
 */
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

    // Retrieve data from backend. parseNodes and parseLinks add additional rendering-specific information
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
            <div className = "d-flex flex-nowrap overflow-auto align-items-center">
                <div className = "inline-block pb-3 pe-4">
                    <label for = "layoutalg" className = "p-1">Select a layout algorithm: </label>
                    <br/>
                    <select id = "layoutalg" onChange = {(e) => setLayoutAlgorithm(e.target.value)}>
                        <option value = "sugiyama"> Sugiyama layout</option>
                        <option value = "moddedSugiyama"> Sugiyama-informed grouping</option>
                        <option value = "basicLayout"> Edge-ignorant grouping </option>
                        <option value = "dagreLayout"> Dagre layout </option>
                    </select>
                </div>
                <div className = "inline-block pb-3 pe-4">
                    <label for = "colorscheme" className = "p-1">Select a color scheme: </label>
                    <br/>
                    <select id = "colorscheme" onChange = {(e) => setColorScheme(e.target.value)}>
                        <option value = "prob"> Colorful Probabilities </option>
                        <option value = "group"> Colorful Groups </option>
                    </select>
                </div>
                <div className = "form-check form-switch">
                    <input className = "form-check-input" type = "checkbox" id = "evcomptoggle"
                        onChange = {() => 
                            // sending an event that evComp has been toggled.
                            window.dispatchEvent(new CustomEvent('evCompToggle'))
                        }/>
                    <label className = "form-check-label" for = "evcomptoggle">
                        Show comparison rings?
                    </label>
                </div>
            </div>
            <PropagatedNet nodeStarter = {nodeStarter} links = {links} 
            layoutAlgorithm = {layouts[layoutAlgorithm]} colorScheme = {colorScheme}/>
        </div>
    )
}