const zoomer_btn = document.querySelector("#zoom");
  let zoom_or_not = true;
  zoomer_btn.addEventListener("click", function () {
  if(zoom_or_not){
        start_brush_tool();
    } else {
      end_brush_tool();
    }
    zoom_or_not = !zoom_or_not;
});
  
//set the dimensions and margins of the graph
const margin = { top: 10, right: 30, bottom: 30, left: 60 },
  width = 1100 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

//set the zoom and pan features
const zoom = d3
  .zoom()
  .on("zoom", zoomed);

//append the SVG object to the body of the page
const SVG = d3
  .select("#graph")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .call(zoom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const x0 = [0, 250000];
const y0 = [0, 13000000];

const x = d3.scaleLinear().domain(x0).range([0, width]);

const y = d3.scaleLinear().domain(y0).range([height, 0]);

let newX = x;
let newY = y;

let brush = d3
    .brush()
    .extent([
      [0, 0],
      [width, height]
    ])
    .on("end", brushended),
  idleTimeout,
  idleDelay = 350;

//add x axis
const xAxis = SVG.append("g")
  .attr("class", "y axis")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x));

//add y axis
const yAxis = SVG.append("g").attr("class", "y axis").call(d3.axisLeft(y));

//add a clipPath: everything out of this area won't be drawn.
const clip = SVG.append("defs")
  .append("SVG:clipPath")
  .attr("id", "clip")
  .append("SVG:rect")
  .attr("width", width)
  .attr("height", height)
  .attr("x", 0)
  .attr("y", 0);

//create the scatter variable: where both the circles and the brush take place
const scatter = SVG.append("g").attr("clip-path", "url(#clip)");

function updateChart(newX, newY) {
  const t = SVG.transition().duration(750);

  //update axes with these new boundaries
  xAxis.transition(t).call(d3.axisBottom(newX));
  yAxis.transition(t).call(d3.axisLeft(newY));

  //update circle position
  scatter
    .selectAll("circle")
    .transition(t)
    .attr("cx", function (d) {
      return newX(d.price);
    })
    .attr("cy", function (d) {
      return newY(d.population);
    });
}

//now the user can zoom and it will trigger the function called updateChart
//a function that updates the chart when the user zoom and thus new boundaries are available
function zoomed() {
  // recover the new scale
  newX = d3.event.transform.rescaleX(x);
  newY = d3.event.transform.rescaleY(y);

  //update axes with these new boundaries
  xAxis.call(d3.axisBottom(newX));
  yAxis.call(d3.axisLeft(newY));

  //update circle position
  scatter
    .selectAll("circle")
    .attr("cx", function (d) {
      return newX(d.price);
    })
    .attr("cy", function (d) {
      return newY(d.population);
    });
}

function idled() {
  idleTimeout = null;
}

function brushended() {
  const s = d3.event.selection;

  if (!s) {
    if (!idleTimeout) return (idleTimeout = setTimeout(idled, idleDelay));
    newX = x.domain(x0);
    newY = y.domain(y0);
  } else {
    newX = x.domain([s[0][0], s[1][0]].map(newX.invert));
    newY = y.domain([s[1][1], s[0][1]].map(newY.invert));

    SVG.select(".brush").call(brush.move, null);
  }
  updateChart(newX, newY);
}

function end_brush_tool() {
  SVG.selectAll("g.brush").remove();
}

function start_brush_tool() {
  SVG.append("g").attr("class", "brush").call(brush);
}

function end_brush_tool() {
  SVG.selectAll("g.brush").remove();
}

const tooltip = d3
  .select("#graph")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

//tooltip mouseover event handler
const tipMouseover = function (d) {
  const name = d.locality;
  const city = name.split(", ")[1];
  const area = name.split(", ")[0];

  const html =
    `<b>${city}</b>, ${area}<br/>` +
    `Население: ${d.population} чел.,<br/>` +
    `Средняя стоимость жилья: ${d.price} руб/м²`;
  d3.select(this).style("stroke", "#d18b90");
  d3.select(this).style("fill", "#a31621");
  d3.select(this).style("stroke-width", "4px");
  d3.select(this).attr("r", "5");
  tooltip
    .html(html)
    .style("left", d3.event.pageX + 15 + "px")
    .style("top", d3.event.pageY - 28 + "px")
    .transition()
    .duration(200) // ms
    .style("opacity", 0.9);
};
//tooltip mouseout event handler
const tipMouseout = function (d) {
  d3.select(this).style("stroke", "none");
  d3.select(this).style("fill", "#4E8098");
  d3.select(this).attr("r", "3");
  tooltip
    .transition()
    .duration(300) //ms
    .style("opacity", 0);
};

function res_zoom() {
  newX = x.domain(x0);
  newY = y.domain(y0);

  updateChart(newX, newY);
}

SVG
      .append("text")
      .attr("class", "text")
      .attr("transform", "rotate(-90)")
      .attr("x", -300)
      .attr("y", 25)
      .text("Численность населения")
      .attr("fill", "#a31621");
$.getJSON(
  "https://raw.githubusercontent.com/ajdivotf/home-price-scatterplot/main/files/data.json",
  function (data) {
    //add circles
    scatter
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", function (d) {
        return x(d.price);
      })
      .attr("cy", function (d) {
        return y(d.population);
      })
      .attr("r", 3)
      .style("fill", "#4E8098")
      .style("opacity", "0.7")
      .on("mouseover", tipMouseover)
      .on("mouseout", tipMouseout);
  }
);
