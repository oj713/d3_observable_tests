import {useRef, useEffect} from 'react'
import * as d3 from 'd3'

export default function BayesianNet() {
    const testNodes = [
        {id: "a1", title: "Elasticity",  x:  0.5, y: 0.0, normal: 0.5, excess: 0.2, deficient: .3},
        {id: "a2", title: "Crumb",  x: -0.5, y: 0.75, normal: 0.4, excess: 0.3, deficient: .3},
        {id: "a3", title: "Stickiness", x: -0.5, y: 0.0, normal: 0.1, excess: 0.4, deficient: .5},
        {id: "a4", title: "Color",   x:  0.0, y: -0.75, normal: 0.9, excess: 0.05, deficient: .05}
    ]
    const testLinks = [
        {id: "b1", source: "a2", target: "a3"},
        {id: "b2", source: "a3", target: "a4"},
        {id: "b3", source: "a1", target: "a4"}
    ]

    const EvidencePropagation = ({nodes, links}) => {
        const netRef = useRef()

        // basic features of the graph
        const width = window.innerWidth - 300
        const height = .5 * width
        const radius = 50 // node size
        const duration = 750 // ms, for animations

        // path generator function
        let connectorLine = d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)
        
        // omitting arcs for now

        // svg element
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background", "whitesmoke")
            .style("border", "1px solid black")
        
        // omitting links for now

        const container = svg.append("g")
            .attr("class", "board")
            .attr("transform", `translate(${width / 2}, ${height / 2})`)
        
        const xScale = d3.scaleLinear().domain([-1, 1]).range([-width/2, width/2])
        const yScale = d3.scaleLinear().domain([-1, 1]).range([-height/2, height/2])

        // node data
        const circles = container.selectAll("circle.node")
            .data(nodes, d => d.id)

        console.log("Scaled x values:", nodes.map(d => xScale(d.x)));
        
        circles.enter()
            .append("circle")
            .attr("class", "node")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", radius)
            .style("fill", "steelblue")
            .style("stroke", "black")
            .style("stroke-width", "2px")
        
        const nodeTitles = container.selectAll("text.node-title")
            .data(nodes, (d) => d.id)

        nodeTitles.enter()
            .append("text")
            .attr("class", "node-title")
            .attr("x", d => xScale(d.x))
            .attr("y", d => yScale(d.y))
            .attr("text-anchor", "middle")
            .style("fill", "white")
            .style("font-size", "14px")
            .attr("dy", 5)
            .text(d => d.title)
        
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
            <EvidencePropagation nodes = {testNodes} links = {testLinks}/>
        </div>
    )
}