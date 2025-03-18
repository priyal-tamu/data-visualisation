console.log("level1.js is loaded!");
d3.csv("temperature_daily.csv").then(data => {
    data.forEach(d => {
        d.date = new Date(d.date);
        d.year = d.date.getFullYear();
        d.month = d.date.getMonth() + 1;
        d.max_temperature = +d.max_temperature;
        d.min_temperature = +d.min_temperature;
    });

    // Filtering data from 1997 onward
    data = data.filter(d => d.year >= 1997);

    // Aggregating data by year and month
    let nestedData = d3.rollup(
        data,
        v => ({
            max: d3.mean(v, d => d.max_temperature),
            min: d3.mean(v, d => d.min_temperature)
        }),
        d => d.year, 
        d => d.month
    );

    let years = Array.from(new Set(data.map(d => d.year))).sort();
    let months = Array.from({ length: 12 }, (_, i) => i + 1);

    let cellSize = 30;
    let width = cellSize * years.length;
    let height = cellSize * months.length;

    let svg = d3.select("#heatmap")
        .attr("width", width + 100)
        .attr("height", height + 80)
        .append("g")
        .attr("transform", "translate(50,30)");

    let colorScale = d3.scaleSequential(d3.interpolateOrRd)
        .domain([10, 35]);

    let currentMetric = "max"; // Default to max temperature

    function drawHeatmap() {
        svg.selectAll("*").remove();

        // Add year labels
        svg.append("g")
            .selectAll("text")
            .data(years)
            .enter().append("text")
            .attr("x", (d, i) => i * cellSize + 10)
            .attr("y", -8)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .text(d => d);

        // Add month labels
        let monthNames = ["January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December"];

        svg.append("g")
        .selectAll("text")
        .data(months)
        .enter().append("text")
        .attr("x", -5)
        .attr("y", d => (d - 1) * cellSize + 15)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .text(d => monthNames[d - 1]); // Convert month number to name

        let tooltip = d3.select("#tooltip");

        // Draw heatmap cells
        svg.selectAll(".cell")
            .data(years.flatMap(year => months.map(month => ({ year, month }))))
            .enter().append("rect")
            .attr("x", d => years.indexOf(d.year) * cellSize)
            .attr("y", d => (d.month - 1) * cellSize)
            .attr("width", cellSize - 2)
            .attr("height", cellSize - 2)
            .attr("fill", d => {
                let temp = nestedData.get(d.year)?.get(d.month)?.[currentMetric];
                return temp ? colorScale(temp) : "#ddd";
            })
            .on("mouseover", (event, d) => {
                let temp = nestedData.get(d.year)?.get(d.month)?.[currentMetric];
                if (temp) {
                    tooltip.style("display", "block")
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px")
                        .html(`Year: ${d.year}<br>Month: ${d.month}<br>Temp: ${temp.toFixed(1)}°C`);
                }
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        drawLegend();
    }

    function drawLegend() {
        let legendData = d3.range(10, 36, 5);
        let legend = d3.select("#legend").selectAll("div").data(legendData);

        legend.enter().append("div")
            .merge(legend)
            .style("background", d => colorScale(d))
            .style("width", "30px")
            .style("height", "20px")
            .text(d => d + "°C");
    }


    drawHeatmap();
});