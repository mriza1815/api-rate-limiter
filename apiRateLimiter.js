const redis = require("redis");
const moment = require("moment");
const {
  WINDOW_SIZE_IN_HOURS,
  MAX_WINDOW_REQUEST_COUNT,
  WINDOW_LOG_INTERVAL_IN_HOURS,
} = require("./constants");

const redisClient = redis.createClient();
redisClient.on("error", (err) => console.log("Redis Client Error", err));

const apiRateLimiter = async (req, res, next) => {
  //#region check redis client whether open or closed
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  //#endregion

  try {
    //#region redis client check
    if (!redisClient) {
      throw new Error("Redis client does not exist!");
      process.exit(1);
    }
    //#endregion

    //#region fetch records of current user using IP address, returns null when no record is found
    const record = await redisClient.get(req.ip);
    const currentRequestTime = moment();
    //#endregion

    //#region if no record is found, create a new record for user and store to redis
    if (record == null) {
      let newRecord = [];
      const requestLog = {
        requestTimeStamp: currentRequestTime.unix(),
        requestCount: 1,
      };
      newRecord.push(requestLog);
      await redisClient.set(req.ip, JSON.stringify(newRecord));
      next();
    }
    //#endregion

    //#region if record is found, parse it's value and calculate number of requests users has made within the last window
    let data = JSON.parse(record);
    let windowStartTimestamp = moment()
      .subtract(WINDOW_SIZE_IN_HOURS, "hours")
      .unix();
    console.log("windowStartTimestamp", windowStartTimestamp);
    let requestsWithinWindow = data.filter((entry) => {
      return entry.requestTimeStamp > windowStartTimestamp;
    });
    let totalWindowRequestsCount = requestsWithinWindow.reduce(
      (accumulator, entry) => {
        return accumulator + entry.requestCount;
      },
      0
    );
    console.log("totalWindowRequestsCount", totalWindowRequestsCount);
    //#endregion

    //#region if number of requests made is greater than or equal to the desired maximum, return error
    if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
      console.log(
        `You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_HOURS} hrs limit!`
      );
      res
        .status(429)
        .send(
          `You have exceeded the ${MAX_WINDOW_REQUEST_COUNT} requests in ${WINDOW_SIZE_IN_HOURS} hrs limit!`
        );
      //#endregion
    } else {
      //#region if number of requests made is less than allowed maximum, log new entry
      let lastRequestLog = data[data.length - 1];
      let potentialCurrentWindowIntervalStartTimeStamp = currentRequestTime
        .subtract(WINDOW_LOG_INTERVAL_IN_HOURS, "hours")
        .unix();

      //#region if interval has not passed since last request log, increment counter
      if (
        lastRequestLog.requestTimeStamp >
        potentialCurrentWindowIntervalStartTimeStamp
      ) {
        lastRequestLog.requestCount++;
        data[data.length - 1] = lastRequestLog;
        //#endregion
      } else {
        //#region  if interval has passed, log new entry for current user and timestamp
        data.push({
          requestTimeStamp: currentRequestTime.unix(),
          requestCount: 1,
        });
        //#endregion
      }
      await redisClient.set(req.ip, JSON.stringify(data));
      next();
      //#endregion
    }
  } catch (error) {
    next(error);
  }
};

module.exports = apiRateLimiter;
