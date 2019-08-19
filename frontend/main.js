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


function append_similars(word_id) {
    let query = "get_similar_words?word="+word_id+"&topn="+graph.topn;
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
    console.log("restarting with the word '", word, "'");
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
