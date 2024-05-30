import {useRef, useEffect} from 'react'
import * as d3 from 'd3'

export default function BayesianNet() {
    const testNodes = [
        {id: "a1", title: "Elasticity", group: "dough", x:  0.5, y: 0.0, normal: 0.5, excess: 0.2, deficient: .3},
        {id: "a2", title: "Crumb", group: "bread", x: -0.5, y: 0.75, normal: 0.4, excess: 0.3, deficient: .3},
        {id: "a3", title: "Stickiness", group: "dough", x: -0.5, y: 0.0, normal: 0.1, excess: 0.4, deficient: .5},
        {id: "a4", title: "Color", group: "bread", x:  0.0, y: -0.75, normal: 0.9, excess: 0.05, deficient: .05}
    ]
    const testLinks = [
        {id: "b1", source: "a2", target: "a3", strength: .5},
        {id: "b2", source: "a3", target: "a4", strength: .2},
        {id: "b3", source: "a1", target: "a4", strength: .8}
    ]

    const EvidencePropagation = ({nodes, links}) => {
        const netRef = useRef()

        // basic features of the graph
        const width = window.innerWidth - 300
        const height = .5 * width
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
            .style("fill", d => d.group === "dough" ? "whitesmoke" : "lightgrey")
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
            .style("fill", "black")
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
        
        // rendering each node
        nodes.forEach(node => {
            const arcs = pie([
                { label: 'Normal', value: node.normal },
                { label: 'Excess', value: node.excess },
                { label: 'Deficient', value: node.deficient }
            ]);

            const pieContainer = container.append('g')
                .attr('transform', `translate(${xScale(node.x)}, ${yScale(node.y)})`);

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
                .append('title') // delay in rendering??
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
            <EvidencePropagation nodes = {testNodes} links = {testLinks}/>
        </div>
    )
}