var Joi = require('joi');

module.exports = {
    "numWorkers":           Joi.Types.Number().min(1).required(),
    "maxDeadWorkerSize":    Joi.Types.Number().required(),
    "host":                 Joi.Types.String().required(),
    "port":                 Joi.Types.Number().required(),
    "maxSockets":           Joi.Types.Number().min(1).required(),
    "logLevel":             Joi.Types.String(),
    "logToScreen":          Joi.Types.Boolean(),
    "logToFile":            Joi.Types.Boolean(),
    "logDir":               Joi.types.String(),
    "logAllowWebAccess":    Joi.types.Boolean().optional(),
    "validateSchema":       Joi.types.Boolean(),
    "turingsCraft":         Joi.Types.Object().required() 
};