var svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

var simulation = d3.forceSimulation()
  .alphaMin(0.01)
  .force("link", d3.forceLink().id(function(d) { return d.id }).distance(100))
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width / 2, height / 2));

var link = svg.append("g")
  .attr("class", "links")
  .selectAll("line");

var node = svg.append("g")
  .attr("class", "nodes")
  .selectAll("circle");

var text = svg.append("g")
  .attr("class", "texts")
  .selectAll("text");

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function clicknode(d) {
  console.log(d.id, "clicked");
  d.isClicked=true;
  d3.select(this).attr("fill", function(d) {
    return color(d.isClicked)
  });
  console.log(d3.select(this));
  d3.json("get_graph?add_word=" + d.id, function(error, graph) {
    if (error) throw error;
    console.log(graph);
    redraw(graph);
  })
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function ticked() {
  link
    .attr("x1", function(d) {
      return d.source.x;
    })
    .attr("y1", function(d) {
      return d.source.y;
    })
    .attr("x2", function(d) {
      return d.target.x;
    })
    .attr("y2", function(d) {
      return d.target.y;
    });

  node
    .attr("cx", function(d) {
      return d.x;
    })
    .attr("cy", function(d) {
      return d.y;
    });

  text
    .attr("x", function(d) {
      return d.x;
    })
    .attr("y", function(d) {
      return d.y;
    });
}

function redraw(graph) {
  //define group and join
  node = node
    .data(graph.nodes);
  //exit, remove
  node.exit().remove();
  //enter
  var node_enter = node.enter()
    .append("circle")
    .attr("r", 10)
    .attr("fill", function(d) {
      return color(d.isClicked)
    })
    .attr("id", function(d) {
      return d.id
    })
    .on("click", clicknode)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));
  //merge
  node = node.merge(node_enter);

  text = text
    .data(graph.nodes)
    .enter()
    .append("text")
    .attr("width", "10")
    .attr("height", "10")
    .attr("dy", ".35em")
    .attr("dx", "12px")
    .style("font-size", "12px")
    .text(function(d) {
      return d.text;
    })
    .merge(text);

  text
    .exit()
    .remove();

  link = link.data(graph.links, function(d) {
    return d.source + "-" + d.target;
  });
  link.exit().remove();
  link = link.enter()
    .append("line")
    .attr("stroke-width", function(d) {
      return Math.sqrt(d.value);
    })
    .merge(link);

  link
    .exit()
    .remove();

  simulation
    .nodes(graph.nodes)
    .on("tick", ticked);
  simulation.force("link").links(graph.links);
  simulation.alpha(0.5).restart();
}

d3.json("get_graph", function(error, graph) {
  if (error) throw error;
  redraw(graph);
});
