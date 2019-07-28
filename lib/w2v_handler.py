import json
import random
import zipfile

from gensim import models


def load_embeddings(embeddings_file):
    # Detect the model format by its extension:
    # Binary word2vec format:
    if embeddings_file.endswith('.bin.gz') or embeddings_file.endswith('.bin'):
        emb_model = models.KeyedVectors.load_word2vec_format(embeddings_file, binary=True,
                                                             unicode_errors='replace')
    # Text word2vec format:
    elif embeddings_file.endswith('.txt.gz') or embeddings_file.endswith('.txt') \
            or embeddings_file.endswith('.vec.gz') or embeddings_file.endswith('.vec'):
        emb_model = models.KeyedVectors.load_word2vec_format(
            embeddings_file, binary=False, unicode_errors='replace')
    # ZIP archive from the NLPL vector repository:
    elif embeddings_file.endswith('.zip'):
        with zipfile.ZipFile(embeddings_file, "r") as archive:
            # Loading and showing the metadata of the model:
            metafile = archive.open('meta.json')
            metadata = json.loads(metafile.read())
            for key in metadata:
                print(key, metadata[key])
            print('============')
            # Loading the model itself:
            stream = archive.open("model.bin")  # or model.txt, if you want to look at the model
            emb_model = models.KeyedVectors.load_word2vec_format(
                stream, binary=True, unicode_errors='replace')
    else:
        # Native Gensim format?
        emb_model = models.KeyedVectors.load(embeddings_file)
        # If you intend to train further: emb_model = models.Word2Vec.load(embeddings_file)

    emb_model.init_sims(replace=True)  # Unit-normalizing the vectors (if they aren't already)
    return emb_model


class W2VHandler:

    def __init__(self):
        self.model = None
        self.threshold = 0.3

    def load_model(self, embeddings_file):
        self.model = load_embeddings(embeddings_file)

    def get_similar_words(self, word, topn=10):
        similar_word_closeness = self.model.similar_by_word(word, topn=topn)
        close_words = [
            word for word, closeness in similar_word_closeness
            if closeness > self.threshold
        ]
        return close_words

    def are_close(self, word1, word2):
        return self.model.similarity(word1, word2) > self.threshold

    def get_links_between_words(self, words):
        pairs = []
        for word1_pos, word1 in enumerate(words[:-1]):
            for word2 in words[word1_pos + 1:]:
                if self.are_close(word1, word2):
                    pairs.append((word1, word2))

        return pairs

    def get_random_word(self):
        return random.choice(list(self.model.vocab))

    def has_word(self, word):
        return word in self.model.vocab
