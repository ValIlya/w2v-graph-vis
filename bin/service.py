import os

from flask import Flask, request

from lib.logger import configure_logger
from lib.w2v_handler import W2VHandler

logger = configure_logger('app', level='DEBUG')

app = Flask(__name__, static_url_path=os.getcwd())
w2v_handler = W2VHandler()
w2v_handler.load_model(os.environ['EMBEDPATH'])


@app.route('/')
def index():
    return open('frontend/index.html', 'r').read()


@app.route('/get_close_words')
def get_close_words():
    word = request.args.get('word', 'лук_NOUN')
    close_words = w2v_handler.get_similar_words(word)

    return {
        'result': close_words
    }


@app.route('/get_links')
def get_links():
    words = request.args['words']
    words_list = words.split(',')
    links = w2v_handler.get_links_between_words(words_list)

    return {
        'result': [
            list(link) for link in links
        ]
    }


if __name__ == "__main__":
    print(os.getcwd())
    app.run(port=5000, host='0.0.0.0', debug=True)
