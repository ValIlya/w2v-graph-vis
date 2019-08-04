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

    console.log('resetting threshold');
    graph.links.forEach(function (l) {
        if (l.similarity < graph.threshold) {
            l.visibility="hidden";
        } else {
            l.visibility="visible";
        }
    });
    link
        .data(graph.links, l => get_link_id(l))
        .attr('visibility', l => l.visibility);

});


document.querySelector("#delete-weak-links").addEventListener("click", function(e){
    console.log('deleting weak links');
    graph.links = graph.links.filter(l => l.similarity >= graph.threshold);
    redraw(graph);
});