import {useRef, useEffect, useState} from "react";
import * as d3 from "d3";

const PieNodeExample = () => {
    const pieRef = useRef();

    const pieData = [
        { option : "Deficient", value : 0.1},
        { option : "Normal", value : 0.7},
        { option : "Excess", value : 0.2}
    ]
    // color scale
    const color = {
        "Deficient": "#75B9BE",
        "Normal": "#FCDE9C",
        "Excess": "#F15946"
    }

    // basic attributes
    const size = 400;
    const startAngle = 0;
    const endAngle = 4 * Math.PI;
    const stroke = 5;
    const innerRadius = size/5;
    const outerRadius = (size * .4);

    // ---------------- svg initialization
    const svg = d3.create('svg')
    .attr("width", size)
    .attr("height", size)

    // PIE data converter using d3
    const pie = d3.pie()
        .value(d => d.value)
        .startAngle(startAngle)
        .endAngle(endAngle)

    // ARC data converter
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)

    // ----------------------------- Pie chart
    const center = svg.append('g')
        .attr('transform', `translate(${size/2}, ${size/2})`)

    const centerText = center.append('text')
        .attr('text-anchor', 'middle')
        .attr('id', 'centerText')
        .attr('font-size', "1.5rem")
        .attr('stroke', 'black')
        .attr('font-weight', 'bold')
        .append('tspan')
        .attr('x', "0")
        .text("Dough")
    
    const arcs = svg
        .selectAll('g.arc')
        .data(pie(pieData))
        .join('g')
        .attr('class', 'arc')
            .classed('arc', true) // for css styling
            .attr('transform', `translate(${size/2}, ${size/2})`)
    
    arcs.append('path')
        .attr('fill', d => color[d.data.option])
        .attr('opacity', .8)
        .attr('d', arc)
        .attr('clip-path', d => `url(#clip-${d.index})`) // hide excess stroke
        .on("mousemove", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .append('title').text(d => d.data.name) // alt text

    arcs.append('clipPath') // a clipPath is a mask
        .attr('id', d => `clip-${d.index}`)
        .append('path')
        .attr('d', arc);

    // ----------------------------- Mouseover functions
    function handleMouseOver(d, i) {
        d3.select(this)
            .attr("stroke", "black")
            .attr("stroke-width", stroke)
            .attr("z-index", 100)
            .attr('opacity', 1)
        
        const centerText = d3.select('#centerText')
            .attr('font-weight', 'normal')

        centerText.selectAll('tspan').remove()

        centerText.append('tspan')
            .attr('x', "0")
            .text(d.target.__data__.data.option)
        .append('tspan')
            .attr('font-size', "1.2rem")
            .attr('x', "0")
            .attr('dy', '1.7rem')
            .text(`${100*d.target.__data__.data.value}%`)
    }

    function handleMouseOut(d, i) {
        d3.select(this)
            .attr("stroke", "none")
            .attr('opacity', .8)

        const centerText = d3.select('#centerText')
            .attr('font-weight', 'bold')

        centerText.selectAll('tspan').remove()

        centerText.append('tspan')
            .attr('x', "0")
            .text("Dough")
    }

    // ----------------------------- Appending to DOM

    useEffect(() => {
        pieRef.current.appendChild(svg.node())
        return () => svg.node().remove()
    }, [svg])

    return (
        <div>
            <h2> Pie Chart Node </h2>
            <p>Pie chart node. Hover for individual probabilities, drag to edit. Click outside the circle to reset to default. </p>
            <p><b>DRAG TO EDIT IS A WIP</b></p>
            <ul>
                <li><a href = "https://observablehq.com/@crazyjackel/pie-chart">Hover source</a></li>
                <li><a href = "https://observablehq.com/@pearmini/draggable-pie-chart-for-g2">Draggable source</a></li>
            </ul>
            <div ref = {pieRef}></div>
        </div>
    )
}

export default function BNtests() {
    return (
        <div>
            <h2>Bayesian Networks</h2>
            <hr/>
            <PieNodeExample/>
            <hr/>
            <p>To implement: <a href = "https://observablehq.com/@infographeo/bayesian-network-visualization">Evidence Propagation</a></p>
        </div>
    )
}