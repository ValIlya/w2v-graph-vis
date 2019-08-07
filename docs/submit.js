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
    d3.json("graph_example.json", function (error, json_graph) {
        if (error) throw error;
        update_indices();
        graph.links = json_graph.links
            .filter(l=>l.similarity > graph.threshold)
            .filter(l=>l.source in node_indices)
            .filter(l=>l.target in node_indices);
        redraw(graph);
    })

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
