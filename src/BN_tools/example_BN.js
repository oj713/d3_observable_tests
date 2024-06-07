// Simple example Bayesian Network
export const exampleNodes = [
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
export const exampleLinks = [
    {id: "b1", source: "a2", target: "a3", strength: .5},
    {id: "b2", source: "a3", target: "a4", strength: .2},
    {id: "b3", source: "a1", target: "a4", strength: .8}
]