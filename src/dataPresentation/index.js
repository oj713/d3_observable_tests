import "./csvTable.css";
// formats CSV data into a neat table presentation
// table-hover for hoverable rows
// https://getbootstrap.com/docs/4.0/content/tables/
export default function CSVTable ({data, numRows = 100}) {
    const csv_keys = data ? Object.keys(data[0]) : [];
    return (
        <div className="forceVerticalScroll">
            {data ? 
            <table className = "table table-bordered table-sm">
                <thead className = "thead-dark">
                    <tr>
                        {csv_keys.map((key) => (
                            <th key={key}>{key}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {(numRows ? data.slice(0, numRows) : data).map((row, i) => (
                        <tr key = {i}>
                            {csv_keys.map((key) => (
                                <td key = {key}>{row[key]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            : <p> Loading... </p>}
        </div>
    )
}