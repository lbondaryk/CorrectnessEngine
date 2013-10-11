CorrectnessEngine
==========

The CorrectnessEngine is a REST Service implemented on Node.js with Hapi Framework.

Initial code based the BrixServer based on Pearson's nodejs-reference-app.

The project uses make tool. If you are using Mac, you must install Xcode first.

Directory Structure
-------------------
- lib    - Contains the application source code
  - controller.js  - The controller that includes the routes
  - cd.js          - The CE component
  - utils.js       - File that contains utility functions
- schema - Message validation schema
- test
  - integration   - Integration testing
  - test_messages - Messages for unit testing
  - unit          - Unit testing

Running Tests
-------------
There are two ways of running the tests:  
  'npm test'  
or  
  'make test'

Running 'make test-w' will run tests in "watch" mode, with the directory files will be watched for
file changes and tests re-run.  This is useful during development.

Running the Application
-----------------------

To run the application:
'node ceapp.js'.
Prior running the server, make sure that the port as defined in config.js is not in use.

Alternately, in development, nodemon can be used to run the application, watch files under the
main directory, and restart the server after every change.  This is useful during development.
'./bin/nm ceapp.js'

@todo - put health check here
Then to check: Start browser and go to URL http://localhost:8090/
Should display  
`{...}`