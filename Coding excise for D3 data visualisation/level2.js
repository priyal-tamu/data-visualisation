d3.csv("temperature_daily.csv").then(data => {
    data.forEach(d => {
        d.date = new Date(d.date);
        d.year = d.date.getFullYear();
        d.month = d.date.getMonth() + 1;
        d.day = d.date.getDate();
        d.max_temperature = +d.max_temperature;
        d.min_temperature = +d.min_temperature;
    });

    let recent = d3.max(data, d => d.year);
    let filteredData = data.filter(d => d.year >= recent - 9);
    let nestedData = d3.group(filteredData, d => d.year, d => d.month);

    let years = Array.from(new Set(filteredData.map(d => d.year))).sort();
    let months = Array.from({ length: 12 }, (_, i) => i + 1);

    let cellSize = 60;
    let width = cellSize * years.length;
    let height = cellSize * months.length;

    let svg = d3.select("#heatmap")
        .attr("width", width + 100)
        .attr("height", height + 60)
        .append("g")
        .attr("transform", "translate(50,30)");

    // **HEATMAP COLOR SCALE (Orange-Red)**
    let colorScale = d3.scaleSequential(d3.interpolateOrRd)
        .domain([10, 35]); 

    let currentMetric = "max";

    let tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid black")
        .style("padding", "6px")
        .style("border-radius", "5px")
        .style("font-size", "12px")
        .style("display", "none");

    function drawHeatmap() {
        svg.selectAll("*").remove();

        // **Year Labels (X-axis)**
        svg.append("g")
            .selectAll("text")
            .data(years)
            .enter().append("text")
            .attr("x", (d, i) => i * cellSize + 25)
            .attr("y", -5)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text(d => d);

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

        let cells = svg.selectAll(".cell")
            .data(years.flatMap(year => months.map(month => ({ year, month }))))
            .enter().append("g")
            .attr("transform", d => `translate(${years.indexOf(d.year) * cellSize}, ${(d.month - 1) * cellSize})`);

        // **Draw Heatmap Cells**
        cells.append("rect")
            .attr("width", cellSize - 5)
            .attr("height", cellSize - 5)
            .attr("fill", d => {
                let tempData = nestedData.get(d.year)?.get(d.month);
                if (!tempData) return "#ddd";
                let avgTemp = d3.mean(tempData, x => x[currentMetric + "_temperature"]);
                return avgTemp ? colorScale(avgTemp) : "#ddd";
            })
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .on("mouseover", function (event, d) {
                let tempData = nestedData.get(d.year)?.get(d.month);
                if (!tempData) return;
                let avgMax = d3.mean(tempData, x => x.max_temperature);
                let avgMin = d3.mean(tempData, x => x.min_temperature);
                tooltip.style("display", "block")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px")
                    .html(`Year: ${d.year} <br> Month: ${d.month} <br> Max: ${avgMax.toFixed(1)}°C <br> Min: ${avgMin.toFixed(1)}°C`);
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        // **Mini Line Charts**
        let xScale = d3.scaleLinear().domain([1, 31]).range([5, cellSize - 10]);
        let yScale = d3.scaleLinear().domain([10, 35]).range([cellSize - 10, 5]);

        let lineMax = d3.line()
            .x(d => xScale(d.day))
            .y(d => yScale(d.max_temperature));

        let lineMin = d3.line()
            .x(d => xScale(d.day))
            .y(d => yScale(d.min_temperature));

        cells.each(function (d) {
            let tempData = nestedData.get(d.year)?.get(d.month);
            if (!tempData) return;

            d3.select(this).append("path")
                .datum(tempData)
                .attr("fill", "none")
                .attr("stroke", "#008000")  // **Aqua Blue**
                .attr("stroke-width", 2)
                .attr("d", lineMax);

            // **Min Temperature (Green)**
            d3.select(this).append("path")
                .datum(tempData)
                .attr("fill", "none")
                .attr("stroke", "#5EC8E5")  // **Green**
                .attr("stroke-width", 2)
                .attr("d", lineMin);
        });

        drawLegend();
    }

    function drawLegend() {
        let legendData = d3.range(10, 36, 5);
        let legend = d3.select("#legend").selectAll("div").data(legendData);

        legend.enter().append("div")
            .merge(legend)
            .style("display", "inline-block")
            .style("margin", "2px")
            .style("background", d => colorScale(d))
            .style("width", "30px")
            .style("height", "20px")
            .style("font-size", "10px")
            .text(d => d + "°C");
    }



    drawHeatmap();
});
