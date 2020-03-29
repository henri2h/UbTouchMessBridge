var fs = require("fs");
var cl = require("./client.js");

import { getData, getIp } from "./controlServer"
import { sendPushNotification } from "./push";

var http = require('http');
var https = require('https');

const control = require("./controlServer");

// logger

const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}


// first run ?
if (getData() == "created") {
    console.log("");
    console.log("####################################################");
    console.log("#  data.json created : Please fill and restart...  #");
    console.log("####################################################");
    console.log("");
    process.exit();
}


// not first run : continue

// certificate and private key
var httpsEnabled = false;
try {
    var data = getData();
    var privateKey = fs.readFileSync(data.certKey, 'utf8');
    var certificate = fs.readFileSync(data.cert, 'utf8');
    httpsEnabled = true;
} catch (error) {
    logger.warn("Could not get certificate. Https disabled.");
}

var credentials = { key: privateKey, cert: certificate };

// loading express
var express = require('express');
const bodyParser = require('body-parser')
var app = express();
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)
app.use(bodyParser.json())



// get token : prevent use by other people
var token = getData().app_token;

// starting the app
sendPushNotification("MessBridge", "Started");

// login
var api;
cl.connect(logger, (data) => {
    if (data.success) {
        api = data.api;

        api.listenMqtt(async (err, event) => {
            try {
                if (err) {
                    logger.error("Listening : error", err);
                }

                switch (event.type) {
                    case "message":
                        logger.info(event);
                        logger.info(event.threadID + " : " + event.body);

                        var uinfo = await cl.getUserInfo(api, event.senderID).catch(err => {
                            console.log(err);
                        });

                        console.log(uinfo);

                        var title = "";
                        if (event.isGroup) { // group
                            var tinfo = await cl.getThreadInfo(api, event.threadID).catch(err => {
                                console.log(err);
                            });;
                            console.log("Group");
                            console.log(tinfo);

                            title = uinfo[event.senderID].name + "@" + tinfo.name
                        }
                        else { // not group
                            title = uinfo[event.senderID].name;
                        }

                        console.log(title);
                        var result = sendPushNotification(title, event.body)
                        if (!result) {
                            logger.error("Could not send push notification ...");
                            console.log("Could not send message");
                        }
                        break;
                    case "event":
                        console.log(event);
                        break;
                    // case presence...
                }
            } catch (erro) {
                // in case of error
                console.log(error);
            }

        });
    }
});

// enable cross origin
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
    next();
});

// TODO : there is currently to much copy and paste here...
// we should work on preventing this code duplication !!


// functions :
// check if all is well setup : use this to check if https is properly set
app.get("/", (req, res, next) => { res.json({ "success": true }); });

app.post("/listConversations", async (req, res, next) => {
    if (req.body.token == token) {
        logger.info("[" + getIp(req) + "] /listConversation");
        res.json(await cl.listData(api));
    }
    else {
        res.json({ "success": false, "error": "bad token" });
    }
});

app.post("/getThreadHistory", async (req, res, next) => {
    if (req.body.token == token) {
        logger.info("[" + getIp(req) + "] /getThreadHistory");
        res.json(await cl.getThreadHistory(api, req.body.threadID, req.body.timestamp, req.body.messageCount));
    }
    else {
        logger.warn("[" + getIp() + "] /getThreadHistory : wrong token");
        res.json({ "success": false, "error": "bad token" });
    }
});

app.post("/getThreadInfo", async (req, res, next) => {
    if (req.body.token == token) {
        logger.info("[" + getIp(req) + "] /getThreadInfo");
        res.json(await cl.getThreadInfo(api, req.body.threadID));
    }
    else {

        logger.warn("[" + getIp(req) + "] /getThreadInfo : wrong token");
        res.json({ "success": false, "error": "bad token" });
    }
});

// user
app.post("/getUserID", async (req, res, next) => {
    if (req.body.token == token) {
        logger.info("[" + getIp(req) + "] /getUserID");
        res.json(await cl.getUserID(api, req.body.name));
    }
    else {
        logger.warn("[" + getIp(req) + "] /getUserID : wrong token");
        res.json({ "success": false, "error": "bad token" });
    }
});

app.post("/getUserInfo", async (req, res, next) => {
    if (req.body.token == token) {
        logger.info("[" + getIp(req) + "] /getUserInfo");
        res.json(await cl.getUserInfo(api, req.body.id));
    }
    else {
        logger.warn("[" + getIp(req) + "] /getUserInfo : wrong token");
        res.json({ "success": false, "error": "bad token" });
    }
});

app.post("/searchForThread", async (req, res, next) => {
    if (req.body.token == token) {
        logger.info("[" + getIp(req) + "] /searchForThread");
        res.json(await cl.searchForThread(api, req.body.name));
    }
    else {
        logger.warn("[" + getIp(req) + "] /searchForThread : wrong token");
        res.json({ "success": false, "error": "bad token" });
    }
});

app.post("/getCurrentUserID", async (req, res, next) => {
    if (req.body.token == token) {
        logger.info("[" + getIp(req) + "] /getCurretUserID");
        res.json(await cl.getCurrentUserID(api));
    }
    else {
        logger.warn("[" + getIp(req) + "] /getCurrentUserID : wrong token");
        res.json({ "success": false, "error": "bad token" });
    }
});


// messages...
app.post("/sendMessage", async (req, res, next) => {
    if (req.body.token == token) {
        logger.info("[" + getIp(req) + "] /sendMessage");
        res.json(await cl.sendMessage(api, req.body.text, req.body.threadID));
    }
    else {
        logger.warn("[" + getIp(req) + "] /sendMessage : wrong token");
        res.json({ "success": false, "error": "bad token" });
    }
});

app.post("/setMessageReaction", async (req, res, next) => {
    if (req.body.token == token) {
        logger.info("[" + getIp() + "] /setMessageReaction");
        res.json(await cl.setMessageReaction(api, req.body.reaction, req.body.messageID));
    }
    else {
        res.json({ "success": false, "error": "bad token" });
    }
});

app.post("/setTitle", async (req, res, next) => {
    if (req.body.token == token) {
        logger.info("[" + getIp(req) + "] /setTitle");
        res.json(await cl.setTitle(api, req.body.newTitle, req.body.threadID));
    }
    else {
        logger.warn("[" + getIp(req) + "] /setTitle : wrong token");
        res.json({ "success": false, "error": "bad token" });
    }
});


// start server
// https only if enabled, fallback to http
if (httpsEnabled) {
    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(8073, function () {
        var host = httpsServer.address().address
        var port = httpsServer.address().port
        console.log("Bridge listening securely at https://%s:%s", host, port)
    });
}
else {
    var httpServer = http.createServer(app);
    httpServer.listen(8070, function () {
        var host = httpServer.address().address
        var port = httpServer.address().port
        console.log("Bridge listening (not secure !!!! for developpement purpose only) at http://%s:%s", host, port)
    });
}