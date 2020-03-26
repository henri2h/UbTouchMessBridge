import login from "facebook-chat-api";
import fs from "fs";

const control = require("./controlServer");
import { sendPushNotification } from "./push";

var fileName = "fappstate.json";

export default function () {
    console.log("Default function");
    return "";
}

export function connect(callback) {

    // Create simple echo bot
    fs.exists(fileName, fileExist => {
        console.log("File exist : " + fileExist);

        var data;
        if (fileExist) {
            console.log("Getting from appstate");
            data = { appState: JSON.parse(fs.readFileSync(fileName, 'utf8')) };
        }
        else {
            var info = control.getData();
            console.log(info);
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
                console.log("Could not connect, check the browser, did you change password ?");
                console.log("If not, your account may have been banned");
                /*fs.unlink(fileName, function (err) {
                    //Do whatever else you need to do here
                    if (err != null) console.log("Could not unlink file : ", err);
                });*/
                console.error(err);
                callback({ success: false, error: err });
                return;
            }
            console.log("Success : connected");
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


export function getThreadHistory(api, threadID) {
    return new Promise(resolve => {
        var timestamp = undefined;
        api.getThreadHistory(threadID, 50, timestamp, (err, history) => {
            // in case of error
            if (err) return console.error(err);
            /*
            Since the timestamp is from a previous loaded message,
            that message will be included in this history so we can discard it unless it is the first load.
        */
            if (timestamp != undefined) history.pop();

            /*
                Handle message history
            */

            //timestamp = history[0].timestamp;

            resolve(history);
        });
    });
}


// user :
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


// messages
export function sendMessage(api, text, threadID) {
    return new Promise(resolve => {

        // set typing indicator ...
        api.sendTypingIndicator(threadID);

        var msg = {body:text};
        api.sendMessage(msg, threadID, (err, result) => {
            // in case of error
            if (err) return console.error(err);
            resolve(result);
        });
    });
}