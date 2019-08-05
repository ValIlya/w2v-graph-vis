import json
import random
import zipfile
from functools import lru_cache
from itertools import product
from typing import List

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


class WordHandler:

    def __init__(self):
        self.model = None

    def load_model(self, embeddings_file: str):
        self.model = load_embeddings(embeddings_file)

    def get_word_info(self, word: str) -> dict:
        text, pos = word.split('_')
        text = text.replace('::', ' ')
        return {'id': word, 'label': text, 'text': text+"</br>"+pos}

    def get_similar_words(self, word: str, threshold: float = 0.3, topn: int = 10) -> List[dict]:
        similar_word_with_similarity = self.model.similar_by_word(word, topn=topn)
        sim_words = [
            (word, similarity) for word, similarity in similar_word_with_similarity
            if similarity > threshold
        ]
        sim_words_info = [
            self.get_word_info(sim_word)
            for sim_word, _ in sim_words
        ]
        return sim_words_info

    @lru_cache(maxsize=1024)
    def get_similarity(self, word1: str, word2: str) -> float:
        return float(self.model.similarity(word1, word2))

    def get_directed_links_between_words(self, words: List[str], threshold: float = 0.3) -> List[dict]:
        return [
            {'source': source, 'target': target, 'similarity': self.get_similarity(source, target)}
            for source, target in product(words, words)
            if (self.get_similarity(source, target) > threshold)
            and (source != target)
        ]

    def get_random_word(self) -> str:
        return random.choice(list(self.model.vocab))

    def has_word(self, word: str) -> bool:
        return word in self.model.vocab
