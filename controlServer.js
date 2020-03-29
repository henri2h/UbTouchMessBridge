import fs from "fs";

// variables
var fileName = "data.json";

// functions
export function getAuthorisations() {
    console.log("hello");
}

export function getData() {
    try {
        return JSON.parse(fs.readFileSync(fileName, 'utf8'));
    }
    catch (error) {
        if (error.code == "ENOENT") {
            createData();
        }
        return "created";
    }
}

export function getToken() {
    return getData().app_token;
}

export function getPushDeviceToken() {
    return getData().push_device_token;
}

export function createData() {
    var params = {
        cert: "path to certificate.crt",
        certKey: "path to certificate.key",
        app_token: "",
        email: "<your email>",
        password: "<your password>",
        push_device_token: ""
    }

    fs.writeFileSync(fileName, JSON.stringify(params, null, "\t"), 'utf8');
    console.log("Initialised : data.json created");
}

export function getIp(req){
    return req.ip;
}