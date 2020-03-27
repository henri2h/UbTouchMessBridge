const fetch = require('node-fetch');
const control = require("./controlServer");

export default function () {
    console.log("Default");
}

export async function sendPushNotification(title, text) {

    var approxExpire = new Date();
    approxExpire.setUTCMinutes(approxExpire.getUTCMinutes() + 10);

    var params = {
        "appid": "pushclient.christianpauly_pushclient",
        "token": control.getData().push_device_token,
        "expire_on": approxExpire.toISOString(),
        "data": {
            "notification": {
                "card": {
                    "icon": "message",
                    "summary": title,
                    "body": text,
                    "popup": true,
                    "persist": true
                },
                "vibrate": true,
                "sound": true
            }
        }
    };

    return await fetch("https://push.ubports.com/notify", {
        "method": "POST",
        "headers": {
            "content-type": "application/json"
        },
        "body": JSON.stringify(params)
    })
        .then(response => {
            return response.json();
        }).then(response => { 
            
            // not success
            if(!response.ok)         {
                console.log("Push notification failed :")
                console.log(response);
            }  

            return response.ok;
        })
        .catch(err => {
            console.log(err);
        });
}