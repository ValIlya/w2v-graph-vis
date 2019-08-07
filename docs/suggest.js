let suggest = document.querySelector("#restart-input");
const awesomplete = new Awesomplete(suggest);
awesomplete.minChars = 1;

suggest.addEventListener("keyup", function(e) {
    let txt = String.fromCharCode(e.which);
    if(txt.match(/[A-Za-zа-яё0-9+#.]/)) {
        awesomplete.list = graph.nodes.map(d=>d.id);
    }
});
