.PHONY: install-backend install-frontend install run-backend run-frontend lint format test clean

install-backend:
	pip install -r backend/requirements.txt

install-frontend:
	cd frontend && npm install

install: install-backend install-frontend

run-backend:
	export PYTHONPATH=${PYTHONPATH}:. && export FLASK_APP=backend.app && export FLASK_DEBUG=1 && flask run

run-frontend:
	cd frontend && npm run dev

lint:
	cd backend && pylint app tests
	cd frontend && npm run lint

format:
	black backend
	cd frontend && npm run format

test:
	pytest
	cd frontend && npm run test

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
