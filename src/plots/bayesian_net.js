import {useRef, useEffect, useState} from 'react'
import * as d3 from 'd3'

export default function BayesianNet() {
    const testNodes = [
        {id: "a1", title: "Elasticity", group: "dough", x:  0.5, y: 0.0, 
            values: [{label: "Normal", value: 0.5}, 
                    {label: "Excess", value: 0.3},
                    {label: "Deficient", value: 0.2}],
            isEvidence: false
        },
        {id: "a2", title: "Crumb", group: "bread", x: -0.5, y: 0.75, 
            values: [{label: "Normal", value: 0.9}, 
                    {label: "Excess", value: 0.05},
                    {label: "Deficient", value: 0.05}],
            isEvidence: false
        },
        {id: "a3", title: "Stickiness", group: "dough", x: -0.5, y: 0.0, 
            values: [{label: "Normal", value: 0.6}, 
                    {label: "Excess", value: 0.3},
                    {label: "Deficient", value: 0.1}],
            isEvidence: false
        },
        {id: "a4", title: "Color", group: "bread", x:  0.0, y: -0.75, 
            values: [{label: "Normal", value: 0.7}, 
                    {label: "Excess", value: 0.1},
                    {label: "Deficient", value: 0.2}],
            isEvidence: false
        }
    ]
    const testLinks = [
        {id: "b1", source: "a2", target: "a3", strength: .5},
        {id: "b2", source: "a3", target: "a4", strength: .2},
        {id: "b3", source: "a1", target: "a4", strength: .8}
    ]

    const EvidencePropagation = ({nodeStarter, links}) => {
        const [nodes, setNodes] = useState(nodeStarter)

        const netRef = useRef()

        // basic features of the graph
        const width = window.innerWidth - 300
        const height = .8 * width
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
            .on('click', () => setNodes(nodeStarter))

        const container = svg.append("g")
            .attr("class", "board")
            .attr("transform", `translate(${width / 2}, ${height / 2})`)
        
        const xScale = d3.scaleLinear().domain([-1, 1]).range([-width/2, width/2])
        const yScale = d3.scaleLinear().domain([1, -1]).range([-height/2, height/2])

        // link data
        const lines = container.selectAll("line")
        .data(links, d => d.id)
        .join("line")
        .attr("x1", d => xScale(nodes.find(node => node.id === d.source).x)) // finding x value of source
        .attr("y1", d => yScale(nodes.find(node => node.id === d.source).y))
        .attr("x2", d => xScale(nodes.find(node => node.id === d.target).x)) // finding x value of target
        .attr("y2", d => yScale(nodes.find(node => node.id === d.target).y))
        .attr("stroke", "grey")
        .attr("stroke-width", d => 4 * d.strength);

        // Node center
        const circles = container.selectAll("circle.node")
            .data(nodes, d => d.id)
        
        circles.enter()
            .append("circle")
            .attr("class", "node")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", radius)
            .style("fill", d => d.isEvidence ? "black" : "white")
            .style("stroke", "white")
            .style("stroke-width", "2px")
        
        const nodeTitles = container.selectAll("text.node-title")
            .data(nodes, (d) => d.id)

        nodeTitles.enter()
            .append("text")
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
        const setEvidence = (evidence) => {
            setNodes(nodes.map(n => {
                if (n.id === evidence.id) {
                    return {...evidence, isEvidence: true}
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
            }))
        }
        
        // rendering each node
        nodes.forEach(node => {
            const arcs = pie(node.values);

            const pieContainer = container.append('g')
                .attr('transform', `translate(${xScale(node.x)}, ${yScale(node.y)})`);

            const propagateEvidence = (event, d) => {
                const target = d.data.label;
                // setting 100% for target
                node.values.forEach(option => option.label === target ? option.value = 1 : option.value = 0)
                setEvidence(node)
            }

            pieContainer.selectAll('path')
                .data(arcs)
                .enter()
                .append('path')
                .attr('d', arcFunc)
                .attr('fill', d => colorScale[d.data.label])
                .on('mouseover', (event, d) => {
                    d3.select(event.target)
                    .attr("fill", d3.color(colorScale[d.data.label]).darker(1))
                })
                .on('mouseout', (event, d) => {
                    d3.select(event.target)
                    .attr("fill", colorScale[d.data.label])
                })
                .on('click', propagateEvidence)
                .append('title') // delay in rendering, nonfixable without original implementation
                    .text(d => `${d.data.label}: ${d.data.value * 100}%`);
        });

        // Appending to DOM
        useEffect(() => {
            netRef.current.append(svg.node())
            return(() => svg.node().remove())
        }, [svg])

        return (
            <div>
                <h2>Evidence Propagation</h2>
                <p>At current, random number propagation</p>
                <ul>
                    <li><a href = "https://observablehq.com/@infographeo/bayesian-network-visualization">Evidence Propagation</a></li>
                </ul>
                <div ref = {netRef}></div>
            </div>
        )
    }


    return (
        <div>
            <h2> Bayesian Network </h2>
            <hr/>
            <EvidencePropagation nodeStarter = {testNodes} links = {testLinks}/>
        </div>
    )
}