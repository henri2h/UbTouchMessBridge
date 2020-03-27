var fs = require("fs");
var cl = require("./client.js");

import { getData } from "./controlServer"
import { sendPushNotification } from "./push";

var http = require('http');
var https = require('https');

const control = require("./controlServer");


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
    console.log("Could not get certificate. Https disabled.");
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
cl.connect((data) => {
    if (data.success) {
        api = data.api;

        api.listenMqtt(async (err, event) => {
            if (err) {
                console.log("Listening : error");
                console.error(err);
            }

            switch (event.type) {
                case "message":
                    console.log(event);
                    console.log(event.threadID + " : " + event.body);

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
                    if (!result) { console.log("Could not send message"); }
                    break;
                case "event":
                    console.log(event);
                    break;
                // case presence...
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


// functions :
// check if all is well setup : use this to check if https is properly set
app.get("/", (req, res, next) => { res.json({ "success": true }); });

app.post("/listConversations", async (req, res, next) => {
    console.log("request");
    if (req.body.token == token) {
        res.json(await cl.listData(api));
    }
    else {
        res.json({ "success": false, "error": "bad token" });
    }
});

app.post("/getThreadHistory", async (req, res, next) => {
    console.log("request");
    if (req.body.token == token) {
        res.json(await cl.getThreadHistory(api, req.body.threadID));
    }
    else {
        res.json({ "success": false, "error": "bad token" });
    }
});

app.post("/getThreadInfo", async (req, res, next) => {
    console.log("request");
    if (req.body.token == token) {
        res.json(await cl.getThreadInfo(api, req.body.threadID));
    }
    else {
        res.json({ "success": false, "error": "bad token" });
    }
});

// user
app.post("/getUserID", async (req, res, next) => {
    console.log("request");
    if (req.body.token == token) {
        res.json(await cl.getUserID(api, req.body.name));
    }
    else {
        res.json({ "success": false, "error": "bad token" });
    }
});

app.post("/getUserInfo", async (req, res, next) => {
    console.log("request");
    if (req.body.token == token) {
        res.json(await cl.getUserInfo(api, req.body.id));
    }
    else {
        res.json({ "success": false, "error": "bad token" });
    }
});


// messages...
app.post("/sendMessage", async (req, res, next) => {
    console.log("request");
    if (req.body.token == token) {
        res.json(await cl.sendMessage(api, req.body.text, req.body.threadID));
    }
    else {
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