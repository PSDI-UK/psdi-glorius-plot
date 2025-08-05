"""
# post.py

This module defines the various web addresses which do something (the "POST" methods) provided by the website,
connecting them to relevant functions.
"""

from flask import Flask


def post_example():
    """Example method which would be called when a POST is used
    """
    pass


def init_post(app: Flask):
    """Connect the provided Flask app to each of the post methods
    """

    # app.route('/example/', methods=["POST"])(post_example)
