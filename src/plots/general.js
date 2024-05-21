import * as Plot from "@observablehq/plot";
import {useEffect, useRef, useState} from "react";
import PlotFigure from "./plotFigure.js";
import CSVTable from "../dataPresentation";
import {letterData} from "./exampleData.js";
import {svg} from "htl";
import Papa from "papaparse";
//import * as d3 from "d3";

const LetterExample = () => {
  const letterExampleRef = useRef();
  const [sort, setSort] = useState("Alphabetical");

  useEffect(() => {
    const letterPlot = Plot.plot({
      marks: [
        Plot.ruleY([1/26], {stroke: "blue", strokeWidth: 3}),
        () => svg`<defs>
          <linearGradient id="gradient" gradientTransform="rotate(90)">
            <stop offset="15%" stop-color="purple" />
            <stop offset="75%" stop-color="red" />
            <stop offset="100%" stop-color="gold" />
          </linearGradient>
        </defs>`,
        // plottype
        Plot.barY(letterData, {
          x: "letter", 
          y: "frequency", 
          sort: sort === "Alphabetical" ? null : {x: "y", reverse: sort.startsWith("Desc")},
          fill: "url(#gradient)",
          fillOpacity: 1,
          tip: true
        }),
        Plot.ruleY([0])
      ],
      y: {
        grid: true
      },
      marginLeft: 50,
      marginTop: 20, 
      marginBottom: 35
    });

    letterExampleRef.current.append(letterPlot);
    // cleanup
    return () => letterPlot.remove();
  }, [sort])

  return (
    <div>
      <b>Letter Example</b> - <a href = "https://codesandbox.io/p/sandbox/observable-plot-in-react-uwz97?file=%2Fsrc%2FApp.js"> source </a>
      <br/>
      <label>Sort by: 
        <select name = "sort" id = "sort-select" onChange={(e => setSort(e.target.value))}>
          <option key = "al" value = "Alphabetical">Alphabetical</option>
          <option key = "de" value = "Descending">Descending</option>
          <option key = "as" value = "Ascending">Ascending</option>
        </select>
      </label>
      <div ref = {letterExampleRef}>
      </div>
    </div>
  )
}

// target: 2d heat density raster of 2 variables from bread dataset
const BreadHeatmap = ({breadData}) => {
  const breadDataRef = useRef();

  useEffect(() => {
    if (breadData) {
      const breadHeatmap = Plot.plot({
        width: 800,
        marginBottom: 30,
        marginLeft: 60,
        aspectRatio: 1,
        color: {label: "Count", legend: true, scheme: "viridis"},

        marks: [
          Plot.cell(breadData, Plot.group({fill: "count"}, {x: "period_day", y: "weekday_weekend"})),
        ]
      })
      breadDataRef.current.append(breadHeatmap);
      // cleanup
      return () => breadHeatmap.remove();
    }
  }, [breadData])

  return (
    <div>
      <h3>Bread Heatmap</h3>
      <p> Data &#40;<a href = "https://www.kaggle.com/datasets/mittalvasu95/the-bread-basket?resource=download"> source </a>&#41;</p>
      <CSVTable data = {breadData} numRows = {100}/>
      <br/>
      <h4>Heatmap of Results</h4>
      <div ref = {breadDataRef}></div>
    </div>
  )
}
const GeneralPage = () => {
  const framedTextRef = useRef();
  const [breadData, setBreadData] = useState();

  // this is inside a useEffect so that it passes down to the breadData render helper
  useEffect(() => {
    // reading CSV bread data
    fetch( "./data/breaddataeg.csv" )
    .then( response => response.text() )
    .then( responseText => {
        // -- parse csv
        const parsedData = Papa.parse(responseText, {header: true}).data;
        // remove the last row, which is empty
        parsedData.pop();
        setBreadData(parsedData);
    });
  }, [])

  //client side rendering on page load
  useEffect(() => {
    const framedText = Plot.plot({
      marks: [
        Plot.frame(),
        Plot.text(["Client-side rendering"], {frameAnchor: "middle"})
      ]
    });
    framedTextRef.current.append(framedText);
    // cleanup function, remove the chart when the component is unmounted.
    return () => framedText.remove();
  }, [])

  return (
  <div>
      <h2> General Plots </h2>
      
      <div ref={framedTextRef}>
        Client-side rendering, simple framed text.
      </div>

      <br/>

      <div>
        Server-side rendering, simple framed text.
        <PlotFigure
          options={{
            marks: [
              Plot.frame(),
              Plot.text(["Server-side rendering"], {frameAnchor: "middle"})
            ]
        }}/>
      </div>
      
      <hr/>

      <LetterExample/>

      <hr/>
      
      <BreadHeatmap breadData = {breadData}/>

  </div>
  )
}

export default GeneralPage;