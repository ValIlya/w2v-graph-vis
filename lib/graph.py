class Node:

    def __init__(self, id, **kwargs):
        self.id = id
        self.properties = kwargs


class Link:

    def __init__(self, source, target, **kwargs):
        self.source = source
        self.target = target
        self.properties = kwargs

    def __eq__(self, other):
        if (self.source == other.source) and (self.target == other.target):
            return True

        if (self.target == other.source) and (self.source == other.target):
            return True

        return False

    def is_linked_to(self, id):
        return (self.target == id) or (self.source == id)


class Graph:

    def __init__(self):
        self.nodes = {}
        self.links = []

    @property
    def _node_ids(self):
        return [node.id for node in self.nodes.values()]

    def _has_node(self, node):
        return node.id in self._node_ids

    def add_node(self, node):
        if not self._has_node(node):
            self.nodes[node.id] = node

    def add_link(self, link):
        if link not in self.links:
            self.links.append(link)

    def del_node_by_id(self, id):
        if id in self.nodes:
            del self.nodes[id]

    def del_link_by_id(self, id1, id2=None):
        if id2 is None:
            self.links = [
                link for link in self.links
                if link.is_linked_to(id1)
            ]
        else:
            self.links = [
                link for link in self.links
                if link.is_linked_to(id1) and link.is_linked_to(id2)
            ]

    def json(self):
        nodes = []
        for node in self.nodes.values():
            node_dict = {
                key: value for key, value in node.properties.items()
            }
            node_dict.update({'id': node.id})
            nodes.append(node_dict)

        links = []
        for link in self.links:
            link_dict = {
                key: value for key, value in link.properties.items()
            }
            link_dict.update({'source': link.source, 'target': link.target})
            links.append(link_dict)

        json_dict = {
            'nodes': nodes,
            'links': links,
        }
        return json_dict
