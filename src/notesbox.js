import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {materialOceanic} from 'react-syntax-highlighter/dist/esm/styles/prism';

const NotesBox = () => {

const ssr =
`import * as Plot from "@observablehq/plot";
import PlotFigure from "./PlotFigure.js";
import penguins from "./penguins.json";
export default function App() {
  return (
    <div>
      <h1>Penguins</h1>
      <PlotFigure
        options={{
            marks: [
              Plot.dot(penguins, {x: "culmen_length_mm", y: "culmen_depth_mm"})
          ]
        }}
      />
    </div>
  );
}
`;

const csr =
`import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import {useEffect, useRef, useState} from "react";
export default function App() {
  const containerRef = useRef();
  // asychronous data loading
  const [data, setData] = useState();
  useEffect(() => {
    d3.csv("/gistemp.csv", d3.autoType).then(setData);
  }, []);
  useEffect(() => {
    if (data === undefined) return;
    const plot = Plot.plot({
      y: {grid: true},
      color: {scheme: "burd"},
      marks: [
        Plot.ruleY([0]),
        Plot.dot(data, {x: "Date", y: "Anomaly", stroke: "Anomaly"})
      ]
    });
    containerRef.current.append(plot);
    // removing the element if the data changes
    return () => plot.remove();
  }, [data]);
  return <div ref={containerRef} />;
}
`;
return (
    <div>
        <h1>D3 and Observable Libraries</h1>
        <a href = "https://observablehq.com/plot/getting-started"> Getting started with Observable </a>

        <br/>

        <h2>Observable</h2>
        
        <p><b>Server Side Rendering</b>: Minimizes distracting reflow for better user experience, but only practical for small plots</p>
        <SyntaxHighlighter language = "javascript" style = {materialOceanic}>
          {ssr}
        </SyntaxHighlighter>

        <br/>

        <p><b>Client Side Rendering</b>: useful for complex plots due to large SVGs</p>
        <SyntaxHighlighter language = "javascript" style = {materialOceanic}>
          {csr}
        </SyntaxHighlighter>
    </div>
)
}

export default NotesBox;