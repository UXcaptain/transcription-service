import { publishDirect, publishLogs } from "../config/messageBroker/LavinMQ.js";


export const globalErrorHandler = (err, req, res, next) => {

  publishLogs(`{"timestamp": ${new Date()}", "service": "example-service",
  "level": "INFO",
  "message": "${err.message}",
  "event":"${err.name}",
  "environment": "${process.env.DEPLOYMENT_ENVIRONMENT}"}`)

};
