import os

from flask import Flask, request, jsonify

from lib.graph import Graph, Node, Link
from lib.logger import configure_logger
from lib.w2v_handler import W2VHandler

logger = configure_logger('app', level='DEBUG')

app = Flask(__name__, static_url_path=os.getcwd())
w2v_handler = W2VHandler()
w2v_handler.load_model(os.environ['EMBEDPATH'])
graph = Graph()

INIT_WORD = 'лук_NOUN'


def add_similars(word):
    graph.nodes[word].properties['isClicked'] = True
    close_words = w2v_handler.get_similar_words(word)
    for close_word in close_words:
        graph.add_node(Node(id=close_word, text=close_word, isClicked=False))
        graph.add_link(Link(source=word, target=close_word))

    links = w2v_handler.get_links_between_words(close_words)
    for word1, word2 in links:
        graph.add_link(Link(source=word1, target=word2))


def restart(init_word):
    global graph
    graph = Graph()
    graph.add_node(Node(id=init_word, text=init_word, isClicked=False))
    add_similars(init_word)


restart(INIT_WORD)


@app.route('/')
def index():
    return open('frontend/index.html', 'r').read()


@app.route('/viz.js')
def get_js():
    return open('frontend/viz.js', 'r').read()


@app.route('/restart')
def restart_handler():
    word = request.args.get('word', INIT_WORD)
    restart(word)
    return jsonify(graph.json())


@app.route('/get_graph')
def get_graph():
    add_word = request.args.get('add_word')
    del_word = request.args.get('del_word')
    if add_word is not None:
        add_similars(add_word)
    if del_word is not None:
        graph.del_node_by_id(del_word)
        graph.del_link_by_id(del_word)
    return jsonify(graph.json())


if __name__ == "__main__":
    print(os.getcwd())
    app.run(port=5000, host='0.0.0.0', debug=True)
