document.querySelector("#restart-form").addEventListener("submit", function(e){
    let word = document.querySelector("#restart-input").value;
    restart(word);
    e.preventDefault();    //stop form from submitting

});

let thresRange = document.querySelector("#threshold-range");
let thresValue = document.getElementById('threshold-value');
thresValue.innerHTML = "Threshold: " + thresRange.value;

thresRange.addEventListener("change", function(e){
    graph.threshold = thresRange.value;
    thresValue.innerHTML = "Threshold: " + graph.threshold;

    console.log('resetting threshold to ', graph.threshold);
    let sim_words_str = graph.nodes.map(d=>d.id).join(',');
    d3.json("get_links?words="+sim_words_str+"&threshold="+graph.threshold, function(error, links) {
      if (error) throw error;
      graph.links = links;
      redraw(graph);
    });

});

let topnRange = document.querySelector("#topn-range");
let topnValue = document.getElementById('topn-value');
topnValue.innerHTML = "Top N: " + topnRange.value;

topnRange.addEventListener("change", function(e){
    graph.topn = topnRange.value;
    topnValue.innerHTML = "Top N: " + graph.topn;

    console.log('resetting topn');

    link
        .data(graph.links, l => get_link_id(l))
        .attr('visibility', l => l.visibility);

});
