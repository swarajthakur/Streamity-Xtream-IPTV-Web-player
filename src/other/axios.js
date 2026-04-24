import Axios from "axios";
import Cookies from 'js-cookie'
import qs from "qs"

let dns = null;
let proxyRequired = window.cors;

setDns(window.dns);

export async function get(url, timeout = 1) {
    return Axios.get(url).catch(err => err);
}

export async function post(url, params = {}, local, useProxy) {
    if (!dns)
        return null;

    let uri = url

    // Anything flagged `local` (e.g. /api/epg) stays local regardless of origin
    // — Vite's dev proxy forwards /api/* to BACKEND_URL (the Fastify server).
    if (local === true) {
        return Axios.post(uri, qs.stringify(params)).catch(err => err)
    }

    const parts = [];
    for (const key in params) {
        const v = params[key];
        if (v === undefined || v === null || v === "") continue;
        parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(v));
    }
    uri += "?" + parts.join("&");

    if ((proxyRequired || useProxy) === true)
        uri = "/api/proxy?url=" + encodeURIComponent(dns + uri);
    else
        uri = dns + uri;

    return Axios.get(uri, { timeout: 25000 }).catch(err => {
        if (proxyRequired === false && !useProxy && !err.response)
            return post(url, params, local, true)
        return err
    });
}


export function setDns(data) {
    if (!data)
        return;
    if (window.location.protocol !== 'https:' && /^https:\/\//i.test(data))
        data = data.replace(/^https:\/\//i, "http://");
    else if (window.location.protocol === 'https:' && /^http:\/\//i.test(data))
        data = data.replace(/^http:\/\//i, "https://");

    if (window.isDebug === 1)
        data = window.dns;
    else if (data[data.length - 1] !== "/")
        data += "/";

    dns = data;
    Cookies.set("dns", data, { expires: 365, sameSite: "strict", secure: window.location.protocol === "https:" })
}

export function getDns() {
    return dns;
}
