import {useRef, useEffect, useState} from "react";
import * as d3 from "d3";

const PieNodeExample = ({color}) => {
    const pieRef = useRef();
    const pieDataStarter = [
        { option : "Deficient", value : 10},
        { option : "Normal", value : 70},
        { option : "Excess", value : 20}
    ]

    // basic attributes
    const size = 400;
    const startAngle = 0;
    const endAngle = 4 * Math.PI;
    const stroke = 5;
    const innerRadius = size/5;
    const outerRadius = (size * .4);

    // PIE data converter using d3
    const [arcsData, setArcsData] = useState(
        d3.pie()
        .value(d => (d.value / 100))
        .startAngle(startAngle)
        .endAngle(endAngle)
        .sortValues(null)
        (pieDataStarter)
    )

    // ---------------- svg initialization
    const svg = d3.create('svg')
    .attr("width", size)
    .attr("height", size)

    // ARC data converter
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)

    // ----------------------------- Pie chart
    svg.append('g').append('text') // center text
        .attr('transform', `translate(${size/2}, ${size/2})`)
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
        .data(arcsData)
        .join('g')
        .attr('class', 'arc')
            .classed('arc', true) // for css styling
            .attr('transform', `translate(${size/2}, ${size/2})`)
    
    arcs.append('path')
        .attr('fill', d => color[d.data.option])
        .attr('opacity', .8)
        .attr('d', arc)
        //.attr('transform', 'rotate(-90)')
        .attr('clip-path', d => `url(#clip-example-${d.index})`) // hide excess stroke
        .on("mouseenter", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .append('title').text(d => d.data.name) // alt text

    arcs.append('clipPath') // a clipPath is a mask
        .attr('id', d => `clip-example-${d.index}`)
        .append('path')
        .attr('d', arc);

    // ----------------------------- Mouseover functions
    function handleMouseOver(d, i) {
        d3.select(this)
            .attr("stroke", "black")
            .attr("stroke-width", stroke)
            .attr("z-index", 100)
            .attr('opacity', 1)
        
        const centerText = svg.select('#centerText')
            .attr('font-weight', 'normal')

        centerText.selectAll('tspan').remove()

        centerText.append('tspan')
            .attr('x', "0")
            .text(d.target.__data__.data.option)
        .append('tspan')
            .attr('font-size', "1.2rem")
            .attr('x', "0")
            .attr('dy', '1.7rem')
            .text(`${d.target.__data__.data.value}%`)
    }

    function handleMouseOut(d, i) {
        d3.select(this)
            .attr("stroke", "none")
            .attr('opacity', .8)

        const centerText = svg.select('#centerText')
            .attr('font-weight', 'bold')

        centerText.selectAll('tspan').remove()

        centerText.append('tspan')
            .attr('x', "0")
            .text("Dough")
    }

    // --- Dragging
    const dragMin = .04
    const dragRadius = outerRadius + 15

    arcsData.forEach(d => d.currentAngle = d.startAngle)

    // Draggable circles
    const draggable = svg.append('g')
        .selectAll('text.draghandles')
        .data(arcsData)
        .join('text')
        .attr('class', 'draghandles')
        .attr('text-anchor', 'middle')
        .attr('cursor', 'pointer')
        .attr('transform', d => {
            const dx = Math.sin(d.startAngle) * dragRadius
            const dy = -Math.cos(d.startAngle) * dragRadius
            return `translate(${size/2 + dx}, ${size/2 + dy}) rotate(${d.startAngle * 180/Math.PI})`
        })
        .on('mouseenter', (event, d) => d3.select(`#drag-${d.index}`).attr('fill', 'black'))
        .on('mouseout', (event, d) => d3.select(`#drag-${d.index}`).attr('fill', 'grey'))
        .attr('id', d => `drag-${d.index}`)
        .attr('dominant-baseline', 'central')
        .attr('font-family', 'FontAwesome')
        .attr('font-size', '15px')
        .attr('fill', 'grey')
        .text('\uf337');

    const updateDragHandles = () => {
        draggable
            .attr('transform', d => {
                const dx = Math.sin(d.currentAngle) * dragRadius
                const dy = -Math.cos(d.currentAngle) * dragRadius
                return `translate(${size/2 + dx}, ${size/2 + dy}) rotate(${d.currentAngle * 180/Math.PI})`
            })
    }

    // Dragging function
    const dragFunction = (event) => { 
        d3.select(`#drag-${event.subject.index}`).attr('fill', 'black')

        // technically this could be called outside for optimization
        const priorAngle = arcsData[event.subject.index === 0 ? 
            arcsData.length - 1 : event.subject.index - 1].startAngle
        const nextAngle = arcsData[event.subject.index === 2 ? 
            0 : event.subject.index + 1].startAngle 
        // 0 is at 12 o'clock, positive clockwise
        const cursorAngle = (Math.atan2(event.x - size/2, size/2 - event.y) + 2*Math.PI) % (2*Math.PI)

        // check if cursor is between the prior and next angles, accounting for 0 deg crossing
        const inGreenZone = priorAngle > nextAngle ? 
            (cursorAngle > priorAngle || cursorAngle < nextAngle) :
            (cursorAngle > priorAngle && cursorAngle < nextAngle)

        if (Math.abs(cursorAngle - event.subject.startAngle) < dragMin) {
            event.subject.currentAngle = event.subject.startAngle // snap to start angle
        } else if (inGreenZone) {
            event.subject.currentAngle = cursorAngle
        }
        updateDragHandles()
    }

    const dragEnded = (event) => {
        event.subject.startAngle = event.subject.currentAngle

        const replaceArc = (d, i) => {
            let newArc = d
            if (i === event.subject.index) {
                newArc = {...d, startAngle: event.subject.startAngle}
            } else if (i === (event.subject.index === 0 ? arcsData.length - 1 : event.subject.index - 1)) {
                newArc = {...d, endAngle: event.subject.startAngle}
            } 

            // exclusively messing with end angle, start angle is relied on elsewhere
            if ((newArc.endAngle - newArc.startAngle) > 2*Math.PI) {
                newArc.endAngle = newArc.endAngle % (2*Math.PI)
            } else if (newArc.endAngle < newArc.startAngle) {
                newArc.endAngle += 2*Math.PI
            }

            newArc.data.value = Math.round((newArc.endAngle - newArc.startAngle) * 100 / (2*Math.PI))

            return newArc
        }

        // update ArcsData
        setArcsData(
            arcsData.map(replaceArc)
        )
    }

    draggable.call(d3.drag()
        .on('drag', dragFunction)
        .on('end', dragEnded))

    // ----------------------------- Appending to DOM
    useEffect(() => {
    pieRef.current.appendChild(svg.node())

    return () => svg.node().remove()

    }, [svg])

    return (
        <div>
            <h2> Pie Chart Node </h2>
            <p>Pie chart node. Hover for individual probabilities, drag to edit. Click outside the circle to reset to default. </p>
            <p>Issues: Snapping not perfect at 0 deg, hover actions</p>
            <ul>
                <li><a href = "https://observablehq.com/@crazyjackel/pie-chart">Hover source</a></li>
                <li><a href = "https://observablehq.com/@pearmini/draggable-pie-chart-for-g2">Draggable source</a></li>
                <li><a href = "https://observablehq.com/@d3/pie-chart-update">Animated probability shift</a></li>
            </ul>
            <div ref = {pieRef}></div>
        </div>
    )
}

// nodeData must have option, and value keys
const PieNode = ({idx, nodeData, color}) => {
    const pieNodeRef = useRef();

    // basic attributes
    const size = 250;
    const startAngle = 0;
    const endAngle = 4 * Math.PI;
    const stroke = 5;
    const innerRadius = size/5;
    const outerRadius = (size * .4);

    const pieSvg = d3.create('svg')
    .attr("width", size)
    .attr("height", size)

    // PIE data converter using d3
    const pie = d3.pie()
        .value(d => (d.value))
        .startAngle(startAngle)
        .endAngle(endAngle)
        .sortValues(null)

    // ARC data converter
    const arcFunc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
    const arcData = pie(nodeData)

    // ----------------------------- Pie chart
    pieSvg.append('g').append('text') // center text
        .attr('transform', `translate(${size/2}, ${size/2})`)
        .attr('text-anchor', 'middle')
        .attr('id', "centerText")
        .attr('font-size', "1.2rem")
        .attr('stroke', 'black')
        .attr('font-weight', 'bold')
    .append('tspan')
        .attr('x', "0")
        .text("Dough")

    const arcs = pieSvg
        .selectAll('g.arc')
        .data(arcData)
        .join('g')
        .attr('class', 'arc')
            .attr('transform', `translate(${size/2}, ${size/2})`)

    arcs.append('path')
        .attr('fill', d => color[d.data.option])
        .attr('opacity', .8)
        .attr('d', arcFunc)
        .attr('clip-path', d => `url(#clip-${idx}-${d.index})`) // hide excess stroke
        .on("mouseenter", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .append('title').text(d => d.data.name) // alt text
    arcs.append('clipPath') // a clipPath is a mask
        .attr('id', d => `clip-${idx}-${d.index}`)
        .append('path')
        .attr('d', arcFunc);

    // ----------------------------- Mouseover functions
    function handleMouseOver(d, i) {
        d3.select(this)
            .attr("stroke", "black")
            .attr("stroke-width", stroke)
            .attr("z-index", 100)
            .attr('opacity', 1)
    
        const centerText = pieSvg.select('#centerText')
            .attr('font-weight', 'normal')
        centerText.selectAll('tspan').remove()
        centerText.append('tspan')
            .attr('x', "0")
            .text(d.target.__data__.data.option)
        .append('tspan')
            .attr('font-size', "1rem")
            .attr('x', "0")
            .attr('dy', '1.2rem')
            .text(`${d.target.__data__.data.value}%`)
    }
    function handleMouseOut(d, i) {
        d3.select(this)
            .attr("stroke", "none")
            .attr('opacity', .8)
        const centerText = pieSvg.select('#centerText')
            .attr('font-weight', 'bold')
        centerText.selectAll('tspan').remove()
        centerText.append('tspan')
            .attr('x', "0")
            .text("Dough")
    }

    useEffect(() => {
        pieNodeRef.current.appendChild(pieSvg.node())
        return () => pieSvg.node().remove()
    }, [pieSvg])

    return (
        <div className = "d-inline" ref = {pieNodeRef}></div>
    )
}

export default function BNtests() {
    const pieNodes = [[
        { option : "Deficient", value : .3},
        { option : "Normal", value : .5},
        { option : "Excess", value : .2}
    ], [
        { option : "Deficient", value : .4},
        { option : "Normal", value : .3},
        { option : "Excess", value : .3}
    ], [
        { option : "Deficient", value : .2},
        { option : "Normal", value : .6},
        { option : "Excess", value : .2}
    ]]

    // color scale
    const colorScale = {
        "Deficient": "#75B9BE",
        "Normal": "#FCDE9C",
        "Excess": "#F15946"
    }

    return (
        <div>
            <h2>Bayesian Networks</h2>
            <hr/>
            <PieNodeExample color = {colorScale}/>
            <hr/>
            <p>Inline, repeatable pie chart element</p>
            {pieNodes.map((node, i) => <PieNode idx = {i} nodeData = {node} color = {colorScale}/>)}
            <hr/>
            <p>To implement: <a href = "https://observablehq.com/@infographeo/bayesian-network-visualization">Evidence Propagation</a></p>
        </div>
    )
}