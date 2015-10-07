ES6_CC = babel

clean:
	@echo [clean]
	rm -rf dist/

es6cc:
	@echo [es6 cc]
	$(ES6_CC) src --out-dir dist

build: es6cc

clean-build: clean es6cc
