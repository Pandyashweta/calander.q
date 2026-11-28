import os
from flask import Flask, jsonify

app = Flask(__name__)

PYTHON_PORT = int(os.environ.get("PYTHON_PORT", "5001"))


@app.get("/api/python/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "runtime": "python-flask",
        }
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=PYTHON_PORT, debug=False, use_reloader=False)
