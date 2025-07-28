# Install all dependencies
install:
	pip install -r back/src/chat-bot/requirements.txt
	cd back && npm install

# Python lint and format (chat-bot)
lint-python:
	cd back/src/chat-bot && ruff check .
format-python:
	cd back/src/chat-bot && ruff format .

# Node.js lint (if eslint is set up)
lint-node:
	cd back && npm run lint || echo "No lint script defined"

# Unified linting
lint: lint-python

# Format code for both Python and Node.js
format: format-python

format-node:
	cd back && npm run format || echo "No format script defined"

# Clean Python cache files
clean-python:
	find back/src/chat-bot -type d -name "__pycache__" -exec rm -r {} +

# Clean Node.js build artifacts
clean-node:
	rm -rf back/node_modules

# Clean all
clean: clean-python clean-node

