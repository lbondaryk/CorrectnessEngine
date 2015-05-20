/* **************************************************************************
 * $Workfile:: numeric.tests.js                                             $
 * *********************************************************************/ /**
 *
 * @fileoverview Contains unit tests for numeric.js
 *
 *
 * Created on       February 13, 2015
 * @author          Michael Jay Lippert
 *
 * @copyright (c) 2015 Pearson, All rights reserved.
 *
 * **************************************************************************/

//force test environment
process.env.NODE_ENV = 'test';

var Q = require('q');
var sinon = require('sinon');
var nock = require('nock');
var expect = require('chai').expect;
var config = require('config');

var utils = require('../../lib/utils');
var CE = require('../../lib/ce');
var Numeric = require('../../lib/types/numeric');

// mock Numeric assessment payload from the controller that is passed to ce.processSubmission
var mockdata = require('../test_messages/numeric.json');

// @todo - We're just testing numeric through the Engine's assess methods to date.  At
// some point we may want to test the individual methods exposed from numeric
// but as we're considering abstracting those at some point to a common module or a
// base class let's hold off on that for now.

/**
 * Numeric Assessment tests.  We have to test these through the
 * engine's assess method.
 */
describe('Numeric assessments', function() {

    // The numeric assessment handler being tested. It is stateless so we don't bother creating a new one for each test.
    var numericAssessmentHandler = Numeric.createAssessmentHandler();

    describe('answerSchema', function () {

        var validNumericAnswerKeyTemplate =
            {
                'assessmentType': 'numeric',
                'answers':
                {
                    'correctValue': 42,
                    'acceptableError': 10,
                    'notifyOnCorrectNotExact': true,
                    'correctResponse': 'Moving the slider shows that the parallax angle of this star is slightly less than that of a star at a distance of 20 light-years. Therefore, its distance must be slightly larger.',
                    'incorrectResponses':
                    [
                        {
                            'wrongRange': [1, 42],
                            'feedback': 'Is it possible to make the parallax angle small enough by moving the slider? What does that tell you about this star’s distance? Try again.'
                        },
                        {
                            'wrongRange': [42, 1000000],
                            'feedback': 'What parallax angle do you get when you set the slider? Try again.'
                        }
                    ]
                },
                'nonRecordable': true,
                'description': 'This is a numeric answerkey w/ all required and optional properties specified',
            };

        // promise schema validation handlers
        var validateExpectedSuccess = function () {};
        var validateUnexpectedFailure = function () { expect(false, 'answerSchema validation to succeed').to.be.true; };
        var validateExpectedFailure = function () {};
        var validateUnexpectedSuccess = function () { expect(false, 'answerSchema validation to fail').to.be.true; };

        describe('given answerKey w/ all correct properties', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);

            it('should pass validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateExpectedSuccess, validateUnexpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/o nonRecordable and description properties', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            delete validNumericAnswerKey.nonRecordable;
            delete validNumericAnswerKey.description;
            expect(validNumericAnswerKey.nonRecordable, 'precondition to be true').to.be.undefined;
            expect(validNumericAnswerKey.description, 'precondition to be true').to.be.undefined;

            it('should pass validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateExpectedSuccess, validateUnexpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/o answers.notifyOnCorrectNotExact property', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            delete validNumericAnswerKey.answers.notifyOnCorrectNotExact;
            expect(validNumericAnswerKey.answers.notifyOnCorrectNotExact, 'precondition to be true').to.be.undefined;

            it('should pass validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateExpectedSuccess, validateUnexpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/o answers.acceptableError property', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            delete validNumericAnswerKey.answers.acceptableError;
            expect(validNumericAnswerKey.answers.acceptableError, 'precondition to be true').to.be.undefined;

            it('should pass validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateExpectedSuccess, validateUnexpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/ answers.acceptableError a 2 number array', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            validNumericAnswerKey.answers.acceptableError = [1, 2];

            it('should pass validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateExpectedSuccess, validateUnexpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/o answers.correctValue property', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            delete validNumericAnswerKey.answers.correctValue;

            it('should fail validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateUnexpectedSuccess, validateExpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/o answers.correctResponse property', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            delete validNumericAnswerKey.answers.correctResponse;

            it('should fail validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateUnexpectedSuccess, validateExpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/o answers.incorrectResponses property', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            delete validNumericAnswerKey.answers.incorrectResponses;

            it('should fail validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateUnexpectedSuccess, validateExpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/ answers.correctValue a string', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            validNumericAnswerKey.answers.correctValue = 'a string';

            it('should fail validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateUnexpectedSuccess, validateExpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/ answers.acceptableError a 1 number array', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            validNumericAnswerKey.answers.acceptableError = [1];

            it('should fail validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateUnexpectedSuccess, validateExpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/ answers.acceptableError a 3 number array', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            validNumericAnswerKey.answers.acceptableError = [1, 2, 3];

            it('should fail validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateUnexpectedSuccess, validateExpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/o answers.incorrectResponses.wrongRange property', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            delete validNumericAnswerKey.answers.incorrectResponses[1].wrongRange;

            it('should fail validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateUnexpectedSuccess, validateExpectedFailure).then(done, done);
            });
        });

        describe('given answerKey w/o answers.incorrectResponses.feedback property', function () {
            var validNumericAnswerKey = utils.cloneObject(validNumericAnswerKeyTemplate);
            delete validNumericAnswerKey.answers.incorrectResponses[0].feedback;

            it('should fail validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericAnswerKey, numericAssessmentHandler.answerSchema());
                promise.then(validateUnexpectedSuccess, validateExpectedFailure).then(done, done);
            });
        });
    });

    describe('submissionSchema', function () {

        var validNumericSubmissionTemplate =
            {
                'value': 42
            };

        // promise schema validation handlers
        var validateExpectedSuccess = function () {};
        var validateUnexpectedFailure = function () { expect(false, 'submissionSchema validation to succeed').to.be.true; };
        var validateExpectedFailure = function () {};
        var validateUnexpectedSuccess = function () { expect(false, 'submissionSchema validation to fail').to.be.true; };

        describe('given submission w/ all correct properties', function () {
            var validNumericSubmission = utils.cloneObject(validNumericSubmissionTemplate);

            it('should pass validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericSubmission, numericAssessmentHandler.submissionSchema());
                promise.then(validateExpectedSuccess, validateUnexpectedFailure).then(done, done);
            });
        });

        describe('given submission w/o value property', function () {
            var validNumericSubmission = utils.cloneObject(validNumericSubmissionTemplate);
            delete validNumericSubmission.value;
            expect(validNumericSubmission.value, 'precondition to be true').to.be.undefined;

            it('should fail validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericSubmission, numericAssessmentHandler.submissionSchema());
                promise.then(validateUnexpectedSuccess, validateExpectedFailure).then(done, done);
            });
        });

        describe('given submission w/ string value property', function () {
            var validNumericSubmission = utils.cloneObject(validNumericSubmissionTemplate);
            validNumericSubmission.value = 'a string';
            expect(validNumericSubmission.value, 'precondition to be true').to.be.a('string');

            it('should fail validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericSubmission, numericAssessmentHandler.submissionSchema());
                promise.then(validateUnexpectedSuccess, validateExpectedFailure).then(done, done);
            });
        });

        describe('given submission w/ extra unexpected property', function () {
            var validNumericSubmission = utils.cloneObject(validNumericSubmissionTemplate);
            validNumericSubmission.foobar = 'a string';

            it('should fail validation', function (done) {
                var promise = numericAssessmentHandler.validateObj(validNumericSubmission, numericAssessmentHandler.submissionSchema());
                promise.then(validateUnexpectedSuccess, validateExpectedFailure).then(done, done);
            });
        });
    });

    describe('preprocess', function () {
        var data = utils.cloneObject(mockdata);
        var testData = { foo: 'bar' };

        // promise schema validation handlers
        var unexpectedFailure = function () { expect(false, 'preprocess validation to succeed').to.be.true; };

        it('should return the given returnData unchanged', function (done) {
            var promise = numericAssessmentHandler.preprocess(testData, data.payload.answerKey, data.payload.studentSubmission);
            var expectedSuccess = function (returnData)
            {
                expect(returnData).to.equal(testData);
            };

            promise.then(expectedSuccess, unexpectedFailure).then(done, done);
        });
    });

    describe('calculateScoreAndFeedback', function () {

        // promise schema validation handlers
        var unexpectedFailure = function () { expect(false, 'calculateScoreAndFeedback validation to succeed').to.be.true; };

        describe('acceptableError', function () {

            // promise schema validation handlers
            var expectedCorrect = function (expectMsg)
            {
                var fn = function (returnData)
                {
                    expect(returnData.correctness, expectMsg).to.equal(1);
                };

                return fn;
            };

            var expectedIncorrect = function (expectMsg)
            {
                var fn = function (returnData)
                {
                    expect(returnData.correctness, expectMsg).to.equal(0);
                };

                return fn;
            };

            describe('is undefined', function () {
                var data = utils.cloneObject(mockdata);
                delete data.payload.answerKey.answers.acceptableError;

                it('should only return correct for a submission that is the exact correct value', function (done) {
                    var correctSubmission = { 'value': 42 };
                    var incorrectLowSubmission = { 'value': 42 - 0.001 };
                    var incorrectHighSubmission = { 'value': 42 + 0.001 };

                    var tests =
                        [
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, correctSubmission)
                                .then(expectedCorrect('correctSubmission'), unexpectedFailure),
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, incorrectLowSubmission)
                                .then(expectedIncorrect('incorrectLowSubmission'), unexpectedFailure),
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, incorrectHighSubmission)
                                .then(expectedIncorrect('incorrectHighSubmission'), unexpectedFailure),
                        ];

                    Q.all(tests)
                        .then(function () { done(); }, done);
                });
            });

            describe('is a number', function () {
                var data = utils.cloneObject(mockdata);
                data.payload.answerKey.answers.acceptableError = 5;

                it('should return correct for a submission that is in the range correct value +/- the acceptableError', function (done) {
                    var correctSubmission = { 'value': 42 };
                    var correctLowSubmission = { 'value': 42 - 5 };
                    var correctHighSubmission = { 'value': 42 + 5 };

                    var tests =
                        [
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, correctSubmission)
                                .then(expectedCorrect('correctSubmission'), unexpectedFailure),
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, correctLowSubmission)
                                .then(expectedCorrect('correctLowSubmission'), unexpectedFailure),
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, correctHighSubmission)
                                .then(expectedCorrect('correctHighSubmission'), unexpectedFailure),
                        ];

                    Q.all(tests)
                        .then(function () { done(); }, done);
                });

                it('should return incorrect for a submission that is outside the range correct value +/- the acceptableError', function (done) {
                    var incorrectLowSubmission = { 'value': 42 - 5.001 };
                    var incorrectHighSubmission = { 'value': 42 + 5.001 };

                    var tests =
                        [
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, incorrectLowSubmission)
                                .then(expectedIncorrect('incorrectLowSubmission'), unexpectedFailure),
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, incorrectHighSubmission)
                                .then(expectedIncorrect('incorrectHighSubmission'), unexpectedFailure),
                        ];

                    Q.all(tests)
                        .then(function () { done(); }, done);
                });
            });

            describe('is an array', function () {
                var data = utils.cloneObject(mockdata);
                data.payload.answerKey.answers.acceptableError = [2, 6];

                it('should return correct for a submission that is in the range correct value - acceptableError[0] to correct value + acceptableError[1]', function (done) {
                    var correctSubmission = { 'value': 42 };
                    var correctLowSubmission = { 'value': 42 - 2 };
                    var correctHighSubmission = { 'value': 42 + 6 };

                    var tests =
                        [
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, correctSubmission)
                                .then(expectedCorrect('correctSubmission'), unexpectedFailure),
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, correctLowSubmission)
                                .then(expectedCorrect('correctLowSubmission'), unexpectedFailure),
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, correctHighSubmission)
                                .then(expectedCorrect('correctHighSubmission'), unexpectedFailure),
                        ];

                    Q.all(tests)
                        .then(function () { done(); }, done);
                });

                it('should return incorrect for a submission that is outside the range correct value - acceptableError[0] to correct value + acceptableError[1]', function (done) {
                    var incorrectLowSubmission = { 'value': 42 - 2.001 };
                    var incorrectHighSubmission = { 'value': 42 + 6.001 };

                    var tests =
                        [
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, incorrectLowSubmission)
                                .then(expectedIncorrect('incorrectLowSubmission'), unexpectedFailure),
                            numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, incorrectHighSubmission)
                                .then(expectedIncorrect('incorrectHighSubmission'), unexpectedFailure),
                        ];

                    Q.all(tests)
                        .then(function () { done(); }, done);
                });
            });
        });

        describe('notifyOnCorrectNotExact', function () {

            describe('is true', function () {
                var data = utils.cloneObject(mockdata);
                data.payload.answerKey.answers.notifyOnCorrectNotExact = true;

                describe('w/ exact correct value', function () {

                    it('should not prepend anything to the correct response feedback', function (done) {
                        var correctSubmission = { 'value': 42 };

                        var testExpectedResponse = function (returnData)
                        {
                            expect(returnData.correctness).to.equal(1);
                            expect(returnData.feedback).to.equal(data.payload.answerKey.answers.correctResponse);
                        };

                        numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, correctSubmission)
                            .then(testExpectedResponse, unexpectedFailure)
                            .then(done, done);
                    });
                });

                describe('w/ non-exact correct value', function () {

                    it('should prepend tolerance message to the correct response feedback', function (done) {
                        var correctSubmission = { 'value': 40 };

                        var testExpectedResponse = function (returnData)
                        {
                            expect(returnData.correctness).to.equal(1);
                            expect(returnData.feedback).to.equal('Your answer is close enough to be correct, but check for tolerance or other errors. ' + data.payload.answerKey.answers.correctResponse);
                        };

                        numericAssessmentHandler.calculateScoreAndFeedback({}, data.payload.answerKey, correctSubmission)
                            .then(testExpectedResponse, unexpectedFailure)
                            .then(done, done);
                    });
                });
            });
        });

        describe('incorrectResponses', function () {

            // We should be testing that the expected incorrect response is returned depending on submitted value, but later. -mjl 2/16/2015
            // test ranges that overlap the correct answer
            // test ranges that overlap other ranges
            // test ranges that are bogus because the 1st value is greater than the 2nd
            // test values that don't fall in any range
        });
    });

    describe('functional tests of CE', function () {
        var ce = null;
        var handler = null;

        describe('.processSubmission()', function () {

            before(function () {
                ce = new CE.EngineHandler();
            });

            it('should complain if answerKey is badly formatted', function (done) {
                var data = utils.cloneObject(mockdata);
                data.payload.answerKey = {assessmentType: 'numeric', assessmentWrong: 'thingy', answers: 'string'};
                ce.processSubmission(data,
                    function (err, result)
                    {
                        try
                        {
                            expect(err).to.not.be.null;
                            expect(err.errors[0]).to.be.an.instanceOf(Error);
                            expect(err.errors[0].code).to.equal('INVALID_TYPE');
                            expect(result).to.be.null;
                            done();
                        }
                        catch (e)
                        {
                            done(e);
                        }
                    });
            });

            it('should complain if submission is badly formatted', function (done) {
                var data = utils.cloneObject(mockdata);
                data.payload.studentSubmission.value =
                    {
                        value: 'a string'
                    };

                ce.processSubmission(data,
                    function (err, result)
                    {
                        try
                        {
                            expect(err).to.not.be.null;
                            //console.log(err);
                            expect(err.errors[0]).to.be.an.instanceOf(Error);
                            expect(err.errors[0].code).to.equal('INVALID_TYPE');
                            expect(result).to.be.null;
                            done();
                        }
                        catch (e)
                        {
                            done(e);
                        }
                    });
            });

            it('should handle incorrect submission', function (done) {
                var data = utils.cloneObject(mockdata);
                data.payload.studentSubmission =
                    {
                        'value': 100
                    };

                ce.processSubmission(data,
                    function (err, result)
                    {
                        try
                        {
                            expect(result.correctness).to.equal(0);
                            expect(result.feedback).to.equal('What parallax angle do you get when you set the slider? Try again.');
                            expect(result.stats.response).to.be.null;
                            expect(result.stats.answerId).to.be.null;
                            expect(result.stats.assessmentItemQuestionType).to.equal('Numeric');
                            expect(result).to.not.have.property('brixState');
                            expect(result).to.have.property('correctAnswer');
                            expect(result.correctAnswer).to.be.null;
                            done();
                        }
                        catch (e)
                        {
                            done(e);
                        }
                    });
            });

            it('should handle another incorrect submission', function (done) {
                var data = utils.cloneObject(mockdata);
                data.payload.studentSubmission =
                    {
                        'value': 31
                    };

                ce.processSubmission(data,
                    function (err, result)
                    {
                        try
                        {
                            expect(result.correctness).to.equal(0);
                            expect(result.feedback).to.equal('Is it possible to make the parallax angle small enough by moving the slider?  What does that tell you about this star’s distance? Try again.');
                            expect(result.stats.response).to.be.null;
                            expect(result.stats.answerId).to.be.null;
                            expect(result.stats.assessmentItemQuestionType).to.equal('Numeric');
                            expect(result).to.not.have.property('brixState');
                            expect(result).to.have.property('correctAnswer');
                            expect(result.correctAnswer).to.be.null;
                            done();
                        }
                        catch (e)
                        {
                            done(e);
                        }
                    });
            });

            it('should handle correct submission', function (done) {
                var data = utils.cloneObject(mockdata);

                ce.processSubmission(data,
                    function (err, result)
                    {
                        try
                        {
                            expect(result.correctness).to.equal(1);
                            expect(result.feedback).to.equal('Moving the slider shows that the parallax angle of this star is slightly less than that of a star at a distance of 20 light-years.  Therefore, its distance must be slightly larger.');
                            expect(result.stats.response).to.be.null;
                            expect(result.stats.answerId).to.be.null;
                            expect(result.stats.assessmentItemQuestionType).to.equal('Numeric');
                            expect(result).to.not.have.property('brixState');
                            expect(result).to.have.property('correctAnswer');
                            expect(result.correctAnswer).to.be.null;
                            done();
                        }
                        catch (e)
                        {
                            done(e);
                        }
                    });
            });

            it('should report back the correct answer if isLastAttempt is true', function (done) {
                var data = utils.cloneObject(mockdata);
                data.payload.studentSubmission =
                    {
                        'value': 31
                    };
                data.payload.isLastAttempt = true;

                ce.processSubmission(data,
                    function (err, result)
                    {
                        try
                        {
                            expect(result.correctness).to.equal(0);
                            expect(result.feedback).to.equal('Is it possible to make the parallax angle small enough by moving the slider?  What does that tell you about this star’s distance? Try again.');
                            expect(result.stats.response).to.be.null;
                            expect(result.stats.answerId).to.be.null;
                            expect(result.stats.assessmentItemQuestionType).to.equal('Numeric');
                            expect(result).to.not.have.property('brixState');

                            expect(result).to.have.property('correctAnswer');
                            expect(result.correctAnswer).to.be.an('object');
                            expect(result.correctAnswer.answer.value).to.equal(42);
                            expect(result.correctAnswer.feedback).to.equal(data.payload.answerKey.answers.correctResponse);

                            done();
                        }
                        catch (e)
                        {
                            done(e);
                        }
                    });
            });
        });

        /**
         * Numeric Assessment Retrieve answer tests.  We have to test these through the
         * engine's retrieveAnswer method.
         */
        describe('.retrieveAnswer()', function () {

            before(function () {
                ce = new CE.EngineHandler();
            });

            it('should retrieve the correct answer', function (done) {
                var data = utils.cloneObject(mockdata);

                ce.retrieveAnswer(data,
                    function (err, result)
                    {
                        try
                        {
                            expect(result.correctAnswer.answer).to.deep.equal({ 'value': 42 });
                            done();
                        }
                        catch (e)
                        {
                            done(e);
                        }
                    });
            });
        });
    });
});
