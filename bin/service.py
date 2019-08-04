import os

from flask import Flask, request, jsonify

from lib.logger import configure_logger
from lib.word_handler import WordHandler

logger = configure_logger('app', level='DEBUG')

app = Flask(__name__, static_url_path=os.getcwd())
word_handler = WordHandler()
word_handler.load_model(os.environ['EMBEDPATH'])

TOPN = 10
THRESHOLD = 0.3

@app.route('/')
def index():
    return open('frontend/index.html', 'r').read()


@app.route('/js/<file>')
def get_js(file):
    return open(f'frontend/{file}', 'r').read()


@app.route('/get_word_info')
def get_word_info():
    word = request.args.get('word', word_handler.get_random_word())
    if not word_handler.has_word(word):
        return f"don't know word {word}", 500
    return jsonify(word_handler.get_word_info(word))


@app.route('/get_similar_words')
def get_similar_words():
    word = request.args['word']
    threshold = float(request.args.get('threshold', THRESHOLD))
    topn = int(request.args.get('topn', TOPN))
    similar_words = word_handler.get_similar_words(word, threshold=threshold, topn=topn)
    return jsonify(similar_words)


@app.route('/get_links')
def get_links():
    words_list = request.args['words'].split(',')
    threshold = float(request.args.get('threshold', THRESHOLD))
    links = word_handler.get_directed_links_between_words(words_list, threshold=threshold)
    return jsonify(links)


if __name__ == "__main__":
    print(os.getcwd())
    app.run(port=5000, host='0.0.0.0', debug=True)
