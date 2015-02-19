#
# Makefile to build and test the correctness engine
#

.DELETE_ON_ERROR :
.PHONY : install update clean test test-spec test-w test-cov test-cov-html test-int test-int-spec tesst-xunit test-xunit-build

install: clean
	npm install

update: clean
	rm -rf npm-shrinkwrap.json
	npm install .
	npm shrinkwrap

clean:
	npm cache clean
	rm -rf node_modules/* coverage lib-test

test:
	@NODE_ENV=test ./node_modules/.bin/mocha --recursive --reporter tap --timeout 3000 test/unit
	 
test-spec:
	@NODE_ENV=test ./node_modules/.bin/mocha --recursive --reporter spec --timeout 3000 test/unit

# "Watch" mode runs your tests each time it sees a file change under the base directory.
# The 'tap' reporter seems to play nicest with this and also shows the most complete error messages.
test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha --watch --recursive --reporter tap --timeout 3000 test/unit

test-cov:
	@NODE_ENV=test ./node_modules/.bin/mocha --require blanket --recursive --timeout 3000 -R travis-cov test/unit

test-cov-html:
	@NODE_ENV=test ./node_modules/.bin/mocha --require blanket --recursive --timeout 3000 -R html-cov test/unit > test/coverage.html

test-int:
	@NODE_ENV=test ./node_modules/.bin/mocha --recursive --reporter tap --timeout 9000 test/integration

test-int-spec:
	@NODE_ENV=test ./node_modules/.bin/mocha --recursive --reporter spec --timeout 9000 test/integration	
	 
test-xunit:
	@NODE_ENV=test ./node_modules/.bin/mocha --recursive --reporter xunit --timeout 3000 test/unit > test-reports.log.xml
	 
test-xunit-build:
	@HOST=build ./node_modules/.bin/mocha --recursive --reporter xunit --timeout 3000 test/unit > test-reports.log.xml

