let suggest = document.querySelector("#restart-input");
const awesomplete = new Awesomplete(suggest);
awesomplete.minChars = 1;

suggest.addEventListener("keyup", function(e) {
    let txt = String.fromCharCode(e.which);
    if(txt.match(/[A-Za-zа-яё0-9+#.]/)) {
        d3.json("suggest?string="+suggest.value, function(error, suggested_words) {
          if (error) throw error;
          awesomplete.list = suggested_words.result;
        })
    }
});
