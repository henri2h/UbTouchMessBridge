import login from "facebook-chat-api";
import fs from "fs";

const control = require("./controlServer");
import { sendPushNotification } from "./push";

var fileName = "fappstate.json";

export default function () {
    console.log("Default function");
    return "";
}

export function connect(logger, callback) {

    // Create simple echo bot
    fs.exists(fileName, fileExist => {
        logger.info("File exist : " + fileExist);

        var data;
        if (fileExist) {
            logger.info("Getting from appstate");
            data = { appState: JSON.parse(fs.readFileSync(fileName, 'utf8')) };
        }
        else {
            var info = control.getData();
            logger.info(info);
            data = { email: info.email, password: info.password };
        }

        // seting up params
        var params = {
            selfListen: false,
            listenEvents: false,
            userAgent: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:74.0) Gecko/20100101 Firefox/74.0"
        };

        login(data, params, (err, api) => {
            if (err) {
                logger.error("Could not connect, check the browser, did you change password ?");
                logger.error("If not, your account may have been banned");
                /*fs.unlink(fileName, function (err) {
                    //Do whatever else you need to do here
                    if (err != null) logger.info("Could not unlink file : ", err);
                });*/
                console.error(err);

                switch (err.error) {
                    case 'login-approval':
                        logger.info('Enter code > ');
                        rl.on('line', (line) => {
                            err.continue(line);
                            rl.close();

                            logger.info("Success : connected");
                            fs.writeFileSync(fileName, JSON.stringify(api.getAppState()));
                            callback({ success: true, api: api });
                        });
                        break;
                    default:
                        console.error(err);
                }

                callback({ success: false, error: err });
                return;
            }
            logger.info("Success : connected");
            fs.writeFileSync(fileName, JSON.stringify(api.getAppState()));
            callback({ success: true, api: api });
        });
    });
}

// threads
export function listData(api) {
    return new Promise(resolve => {
        api.getThreadList(10, null, [], (err, list) => {
            // in case of error
            if (err) return console.error(err);
            resolve(list);
        });
    });
}


export function getThreadInfo(api, threadID) {
    return new Promise(resolve => {
        api.getThreadInfo(threadID, (err, info) => {
            // in case of error
            if (err) return console.error(err);
            resolve(info);
        });
    });
}


export function getThreadHistory(api, threadID, timestamp, count) {
    return new Promise(resolve => {
        api.getThreadHistory(threadID, count, timestamp, (err, history) => {
            // in case of error
            if (err) return console.error(err);
            /*
            Since the timestamp is from a previous loaded message,
            that message will be included in this history so we can discard it unless it is the first load.
        */
            if (timestamp != undefined) history.pop();
            resolve(history);
        });
    });
}


// user :
export function getCurrentUserID(api, name) {
    return new Promise(resolve => {
        api.getCurrentUserID((err, obj) => {
            // in case of error
            if (err) return console.error(err);
            resolve(obj);
        });
    });
}

export function getUserID(api, name) {
    return new Promise(resolve => {
        api.getUserID(name, (err, obj) => {
            // in case of error
            if (err) return console.error(err);
            resolve(obj);
        });
    });
}

export function getUserInfo(api, id) {
    return new Promise(resolve => {
        api.getUserInfo(id, (err, obj) => {
            // in case of error
            if (err) return console.error(err);
            resolve(obj);
        });
    });
}


export function searchForThread(api, name) {
    return new Promise(resolve => {
        api.searchForThread(name, (err, obj) => {
            // in case of error
            if (err) return console.error(err);
            resolve(obj);
        });
    });
}



// messages
export function sendMessage(api, text, threadID) {
    return new Promise(resolve => {

        // set typing indicator ...
        api.sendTypingIndicator(threadID);

        var msg = { body: text };
        api.sendMessage(msg, threadID, (err, result) => {
            // in case of error
            if (err) return console.error(err);
            resolve(result);
        });
    });
}



export function setMessageReaction(api, reaction, messageId) {
    return new Promise(resolve => {
        api.setMessageReaction(reaction, messageId, (err, obj) => {
            // in case of error
            if (err) return console.error(err);
            resolve(obj);
        });
    });
}


export function setTitle(api, newTitle, threadID) {
    return new Promise(resolve => {
        api.setTitle(newTitle, threadID, (err, obj) => {
            // in case of error
            if (err) return console.error(err);
            resolve(obj);
        });
    });
}


export function logout(api) {
    return new Promise(resolve => {
        api.logout((err, obj) => {
            // in case of error
            if (err) return console.error(err);
            resolve(obj);
        });
    });
}