import {useRef, useEffect, useState} from 'react'
import {getNetwork} from '../redux_stuff/network-services.js'
import {parseNodes, parseLinks} from '../redux_stuff/network-parser.js'
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
        "Deficient": "#75B9BE",
        "Normal": "#FCDE9C",
        "Excess": "#F15946"
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
        .data(Object.entries(colorScale))
        .enter()
        .append('circle')
            .attr('cx', legendX)
            .attr('cy', (d, i) => height * .15 + i * 25)
            .attr('r', 10)
            .attr('fill', d => d[1])
    legend.selectAll('text')
        .data(Object.entries(colorScale))
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

    // setEvidence -- currently random propagation
    const setEvidence = ({evidence, add}) => {
        const newNodes = nodes.map(n => {
            if (n.id === evidence.id) {
                return evidence
            } else if (add && n.isEvidence){
                return n
            } else {
                const normal = Math.random()
                const excess = Math.random() * (1 - normal)
                const deficient = 1 - normal - excess
                return {...n, 
                    values: [{label: "Normal", value: normal}, 
                            {label: "Excess", value: excess},
                            {label: "Deficient", value: deficient}],
                    isEvidence: false}
            }
        })

        // re-rendering
        render({nodes: newNodes, links})
    }

    const pieContainer = container.selectAll('g.pie-node')
        .data(nodes, d => d.id)
        .join('g')
        .attr('class', 'pie-node')
        .attr('transform', d => `translate(${xScale(d.x)}, ${yScale(d.y)})`)

        
    // rendering each node
    nodes.forEach(node => {
        const arcs = pie(node.values);

        const propagateEvidence = (event, d) => {
            const target = d.data.label;
            // setting 100% for target
            setEvidence({
                evidence: {...node, 
                    values: node.values.map(option => 
                        option.label === target ? {...option, value: 1} : {...option, value: 0}),
                    isEvidence: true
                },
                add: event.shiftKey
            })
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
            .on('click', propagateEvidence) // initial Propagate evidence
            .append('title') // delay in rendering, nonfixable without original implementation
                .text(d => `${d.data.label}: ${Math.round(d.data.value * 100)}%`)
    
        updatePies
            .on('click', propagateEvidence) // new propagate evidence to ensure updated nodes information   
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