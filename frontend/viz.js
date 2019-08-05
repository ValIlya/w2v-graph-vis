const localStorageName = 'w2v-graph-vis';
var graph = {nodes: [], links:[], threshold: 0.3, topn: 10};
var node_indices = {};
var link_indices = {};

// Define the div for the tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

var color = d3.scaleOrdinal(d3.schemeCategory20);

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
    svg.select('.links').attr("transform", d3.event.transform)
    svg.select('.nodes').attr("transform", d3.event.transform)
}

var defaultCoords = {
  "cx": 0,
  "cy": 0
};

var clickedOnce = false;
var timer;

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
  console.log(d.id, "double clicked");
  update_indices();
  graph.nodes.splice(node_indices[d.id], 1);
  graph.links = graph.links.filter(l => !is_link_connected_to_node(l, d));
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

function get_link_id(l) {
    return l.source.id + "-" + l.target.id;
}

function is_link_connected_to_node(l, node) {
    return (l.source.id == node.id) || (l.target.id == node.id);
}


function update_indices() {
    node_indices = {};
    link_indices = {};
    graph.links.forEach(function (l, i) {
        link_indices[get_link_id(l)] = i;
    });
    graph.nodes.forEach(function (d, i) {
        node_indices[d.id] = i;
    });
}

function redraw(graph) {
  update_indices();
  graph.nodes.forEach(function (d) {
      d['cx'] = isNaN(d['x']) ? defaultCoords['cx'] : d['x'];
      d['cy'] = isNaN(d['y']) ? defaultCoords['cy'] : d['y'];

  });
  // making pointers from string and rewiring old links
  graph.links.forEach(function (l) {
      var source_id, target_id;
      if (typeof l.source == 'string') {
          // for new links, coming from json
          source_id = l.source;
          target_id = l.target;
      } else {
          // old links, might be wrong pointers
          source_id = l.source.id;
          target_id = l.target.id;
      };
      l.source = graph.nodes[node_indices[source_id]];
      l.target = graph.nodes[node_indices[target_id]];
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
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        tooltip.html(d.id + '<br/>' + d.text + '<br/>' + d.pos)
            .style("left", (d3.event.pageX + 30) + "px")
            .style("top", (d3.event.pageY - 90) + "px");
        })
    .on("mouseout", function() {
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
     return color(1)
   });

  node_enter
    .append("text")
    .attr("dx", 12)
    .attr("dy", ".35em")
    .text(function(d) { return d.text });
  //merge
  node = node.merge(node_enter);

  // Update all labels & circles fill  by force
  node.data(graph.nodes).select('text').text(function(d) { return d.text });
  // node.data(graph.nodes).select('circle').attr("fill", function(d) { return color(1) });

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

function append_similars(word_id) {
    let query = "get_similar_words?word="+word_id+"&threshold="+graph.threshold+"&topn="+graph.topn;
    d3.json(query, function(error, similar_words) {
      if (error) throw error;
      if (similar_words.length > 0) {
          update_indices();
          let new_words = similar_words.filter(d => (!(d.id in node_indices)));
          graph.nodes.push(...new_words);
          var sim_words_str = similar_words.map(d=>d.id).join(',') + ',' + word_id;
          d3.json("get_links?words="+sim_words_str+"&threshold="+graph.threshold, function(error, links) {
              if (error) throw error;
              let new_links = links.filter(l =>(!(get_link_id(l) in link_indices)));
              graph.links.push(...new_links);
              redraw(graph);
          });
      } else {
          redraw(graph);
      }
    });
}

function restart(word) {
    console.log("restarting with word", word);
    var queryUrl = "get_word_info";
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
        if (word != "") {
            queryUrl += "?word="+word
        };
        graph.nodes = [];
        graph.links = [];
    };
    if (needNewWords) {
        d3.json(queryUrl, function(error, random_word) {
          if (error) throw error;
          graph.nodes.push(random_word);
          append_similars(random_word.id);
        });
    } else {
        redraw(graph)
    }
}

restart(null);
