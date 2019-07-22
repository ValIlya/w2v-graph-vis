PYTHON?=python3

help:
	@echo "build  - build docker image"
	@echo "run    - run service in docker"

.PHONY: vendor
vendor:
	$(PYTHON) -m pip install -r requirements.txt

.PHONY: run
run:
	PYTHONPATH=. $(PYTHON) bin/service.py
