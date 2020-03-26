import fs from "fs";

// variables
var fileName = "data.json";

// functions
export function getAuthorisations(){
    console.log("hello");
}

export function getData(){
    return JSON.parse(fs.readFileSync("data.json", 'utf8'));
}

export function getToken(){
    return getData().token;
}
