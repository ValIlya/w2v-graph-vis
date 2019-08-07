const localStorageName = 'w2v-graph-vis';
var graph = {nodes: [], links:[], threshold: 0.3, topn: 10};
var node_indices = {};
var link_indices = {};
var neighbors = {};

const color = {
    "usual":"#1f77b4",
    "other":"#aec7e8",
    "chosen":"#5254a3",
};

// Define the div for the tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");



var simulation = d3.forceSimulation()
  .alphaMin(0.01)
  .force("link", d3.forceLink().id(d => d.id ).distance(100))
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width / 2, height / 2));

var link = svg.append("g")
  .attr("class", "links")
  .selectAll("line");

var node = svg.append("g")
  .attr("class", "nodes")
  .selectAll(".node");

var zoom_handler = d3.zoom()
    .on("zoom", zoom_actions);

zoom_handler(svg);

function zoom_actions(){
    svg.select('.links').attr("transform", d3.event.transform);
    svg.select('.nodes').attr("transform", d3.event.transform)
}

var defaultCoords = {
  "cx": 0,
  "cy": 0
};

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function add_similars(d) {
  console.log(d.id, "clicked");
  defaultCoords["cx"] = d.x;
  defaultCoords["cy"] = d.y;
  append_similars(d.id);
}

function delete_node(d) {
  d3.event.preventDefault();
  console.log(d.id, "right clicked");
  update_indices();
  graph.nodes.splice(node_indices[d.id], 1);
  graph.links = graph.links.filter(l => !is_link_connected_to_node(l, d.id));
  tooltip.transition()
            .duration(500)
            .style("opacity", 0);
  redraw(graph);
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
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; });

  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function get_source_id(l){
    if (typeof l.source == 'string') {
          // for new links, coming from json
          return l.source;
      } else {
          // old links, might be wrong pointers
          return l.source.id;
      };
}

function get_target_id(l){
    if (typeof l.target == 'string') {
          // for new links, coming from json
          return l.target;
      } else {
          // old links, might be wrong pointers
          return l.target.id;
      };
}

function get_link_id(l) {
    return get_source_id(l) + "-" + get_target_id(l);
}

function is_link_connected_to_node(l, node_id) {
    return (get_source_id(l) == node_id) || (get_target_id(l) == node_id);
}

function rewire_links(){
  // making pointers from string and rewiring old links
  graph.links.forEach(function (l) {
      l.source = graph.nodes[node_indices[get_source_id(l)]];
      l.target = graph.nodes[node_indices[get_target_id(l)]];
  });
}

function update_indices() {
    node_indices = {};
    link_indices = {};
    neighbors = {};
    graph.nodes.forEach(function (d, i) {
        node_indices[d.id] = i;
        neighbors[d.id] = {};
    });
    graph.links.forEach(function (l, i) {
        link_indices[get_link_id(l)] = i;
        neighbors[get_source_id(l)][get_target_id(l)] = l;
    });
}

function redraw(graph) {
  update_indices();
  rewire_links();
  graph.nodes.forEach(function (d) {
      d['cx'] = isNaN(d['x']) ? defaultCoords['cx'] : d['x'];
      d['cy'] = isNaN(d['y']) ? defaultCoords['cy'] : d['y'];

  });
  //define group and join
  node = node
    .data(graph.nodes);
  //exit, remove
  node.exit().remove();
  //enter
  var node_enter = node.enter()
    .append("g")
    .attr("class", "node")
    .attr("cx",defaultCoords["cx"])
    .attr("cy",defaultCoords["cy"])
    .attr("id", function(d) {
      return d.id
    })
    .on("click", add_similars)
    .on("contextmenu", delete_node)
    .on("mouseover", function(d) {
        color_neighbors(d.id);
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(d.text)
            .style("left", (d3.event.pageX + 30) + "px")
            .style("top", (d3.event.pageY - 90) + "px");
        })
    .on("mouseout", function() {
        color_neighbors("");
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

 node_enter
   .append("circle")
   .attr("x", -8)
   .attr("y", -8)
   .attr("r", 10)
   .attr("fill", function(d) {
     return color["usual"]
   });

  node_enter
    .append("text")
    .attr("dx", 12)
    .attr("dy", ".35em")
    .text(function(d) { return d.label });
  //merge
  node = node.merge(node_enter);

  // Update all labels by force
  node.data(graph.nodes).select('text').text(function(d) { return d.label });

  link = link.data(graph.links, function(l) {
    return get_link_id(l);
  });
  link.exit().remove();
  link = link.enter()
    .append("line")
    .attr("stroke-width", function(l) {
      return (parseFloat(l.similarity) - 0.25) * 5;
    })
    .attr("id", function(l) {
      return get_link_id(l);
    })
    .merge(link);

  link
    .exit()
    .remove();

  // applying saved positions before simulation
  graph.nodes.forEach(function (d) {
      d['x'] = d['cx'];
      d['y'] = d['cy'];
  });

  // save to local storage
  localStorage.setItem(localStorageName, JSON.stringify(graph));
  // start simulation
  simulation
    .nodes(graph.nodes)
    .on("tick", ticked);
  simulation.force("link").links(graph.links);
  simulation.alpha(0.5).restart();
}

function color_neighbors(node_id) {
    node
    .data(graph.nodes)
        .select('circle')
        .attr('fill', function (d) {
            if (d.id  == node_id) {
                return color["chosen"]
            } else if ((node_id in neighbors) && (!(d.id in neighbors[node_id])))
            {
                return color["other"]
            };
            return color["usual"]
        });

    link
    .data(graph.links)
        .style('stroke-opacity', function (l) {
            if (!(node_id in node_indices)) {
              return 0.6
            } else if (is_link_connected_to_node(l, node_id))  {
              return 0.8
            } else {
              return 0.2
            }
  })
}

function append_similars(word_id) {
    d3.json("graph_example.json", function (error, json_graph) {
        if (error) throw error;
        graph.nodes = json_graph.nodes;
        console.log("graph.threshold",graph.threshold);
        graph.links = json_graph.links.filter(l=>l.similarity > graph.threshold);
        redraw(graph);
    })
}

function restart(word) {
    console.log("restarting with the word '", word, "'");
    var needNewWords = true;
    if (word === null) {
        let loaded_graph = JSON.parse(localStorage.getItem(localStorageName));
        if (loaded_graph !== null) {
            graph = loaded_graph;
            document.querySelector("#threshold-range").value = graph.threshold;
            document.querySelector("#topn-range").value = graph.topn;
            console.log('initializing from the local storage');
            needNewWords = false;
        }
    } else {
        graph.nodes = [];
        graph.links = [];
    };
    if (needNewWords) {
        console.log(needNewWords);
        append_similars("")
    } else {
        redraw(graph)
    }
}

restart(null);
