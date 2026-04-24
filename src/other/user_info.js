import Cookies from 'js-cookie'
import * as Axios from "./axios"

const userInfo = {};

export function getInfo(){
    return userInfo;
}

export function setInfo(data, serverInfo){
    userInfo.expiry = new Date(parseInt(data.exp_date+"000"));
    userInfo.username = data.username;
    userInfo.password = data.password;
    userInfo.max_connections = data.max_connections;
    userInfo.message = data.message;

    // Kick off EPG ingest on the Node backend so the cache is warm by the time
    // the user lands in Live TV. Fire-and-forget; failures surface as "No EPG".
    // Third arg `true` tells the axios wrapper to POST to the local path
    // (form-urlencoded) instead of appending to the provider DNS.
    Axios.post("/api/epg", {
        init: "1",
        username: userInfo.username,
        password: userInfo.password,
        dns: `${serverInfo.server_protocol}://${serverInfo.url}:${serverInfo.port}`,
    }, true);

    const cookieOpts = { expires: 365, sameSite: "strict", secure: window.location.protocol === "https:" };
    Cookies.set("username", data.username, cookieOpts);
    Cookies.set("password", data.password, cookieOpts);
}

export function logout(){
    Cookies.remove("dns");
    Cookies.remove("username");
    Cookies.remove("password");
    window.location = "/";
}