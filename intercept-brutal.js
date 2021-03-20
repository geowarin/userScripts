// ==UserScript==
// @name        brutal
// @namespace   geowarin
// @match       *://localhost:*/*
// @version     1.2
// @author      -
// @description 19/03/2021 à 19:55:34
// @require     https://cdnjs.cloudflare.com/ajax/libs/cash/8.1.0/cash.min.js
// @grant       GM.setClipboard
// @run-at      document-start
// ==/UserScript==

const interceptors = [
    {
        name: "todos",
        url: new RegExp("https://jsonplaceholder.typicode.com/todos.*"),
        initialState: [],
        onResponse: (state, response) => state.concat(JSON.parse(response.responseText)),
        updateText: state => `${state.length} todos`
    },
    {
        name: "posts",
        url: new RegExp("https://jsonplaceholder.typicode.com/posts"),
        initialState: [],
        onRequest: (state, config) => state.concat(JSON.parse(config.body)),
        updateText: state => `Posted post ids: ${state.map(s => s.userId)}`
    }
];

function initState() {
    return interceptors.reduce((s, i) => Object.assign(s, {[i.name]: i.initialState}), {});
}

let state = initState();

const ui = {
    $uiNode: $('<div></div>')
        .attr("style", "position: absolute; top: 0; right: 0; width: 400px; height: 200px; background-color: rgba(100, 100, 100, 0.6)"),

    interceptorTextNodes: {},

    init: () => {
        interceptors.forEach(interceptor => {

            const rootNode = $("<div></div>");
            const textNode = $("<p></p>");
            const copyBtn = $("<button>copy</button>")
                .on("click", () => GM.setClipboard(JSON.stringify(state[interceptor.name])));

            ui.interceptorTextNodes[interceptor.name] = textNode;

            rootNode
                .append(textNode)
                .append(copyBtn);

            ui.$uiNode.append(rootNode);
        });
        const resetBtn = $("<button>reset state</button>")
            .on("click", () => {
                state = initState();
                ui.updateInterceptorUI();
            });
        ui.$uiNode.append(resetBtn);

        ui.$uiNode.appendTo(document.body);

        ui.updateInterceptorUI();
    },

    updateInterceptorUI: () => {
        interceptors.forEach(interceptor => {
            const interceptorState = state[interceptor.name];
            ui.interceptorTextNodes[interceptor.name].text(interceptor.updateText(interceptorState));
        });
    }
}

function fireCallback(callbackName, url, arg) {
    interceptors
        .filter(i => i[callbackName] && i.url.test(url))
        .forEach(interceptor => {
            const prevState = state[interceptor.name];
            const callback = interceptor[callbackName];
            state[interceptor.name] = callback(prevState, arg);
            ui.updateInterceptorUI();
        });
}

$(function () {
    ui.init();
});

const onResponse = (response) => {
    fireCallback("onResponse", response.config.url, response);
}

const onRequest = (config) => {
    fireCallback("onRequest", config.url, config);
}

(function (open) {
    window.XMLHttpRequest.prototype.open = function () {

        if (this.readyStateChangeCallback) {
            this.removeEventListener("readystatechange", this.readyStateChangeCallback)
        }

        this.config = {headers: {}};
        this.config.method = arguments[0];
        this.config.url = arguments[1];
        this.config.async = arguments[2];
        this.config.user = arguments[3];
        this.config.password = arguments[4];
        this.readyStateChangeCallback = () => {
            if (this.readyState === 4 && this.status !== 0) {
                const response = {
                    response: this.response,
                    responseText: this.responseText,
                    status: this.status,
                    config: this.config,
                }
                onResponse(response);
            }
        }

        this.addEventListener("readystatechange", this.readyStateChangeCallback);
        open.apply(this, arguments);
    };
})(window.XMLHttpRequest.prototype.open);

(function (send) {
    window.XMLHttpRequest.prototype.send = function () {
        var config = this.config;
        config.withCredentials = this.withCredentials;
        config.body = arguments[0];
        onRequest(config);
        send.apply(this, arguments);
    };
})(window.XMLHttpRequest.prototype.send);

(function (setRequestHeader) {
    window.XMLHttpRequest.prototype.setRequestHeader = function () {
        this.config.headers[arguments[0].toLowerCase()] = arguments[1];
        setRequestHeader.apply(this, arguments);
    };
})(window.XMLHttpRequest.prototype.setRequestHeader);
