// ==UserScript==
// @name        intercept
// @namespace   geowarin
// @match       *://localhost:*/*
// @version     1.2
// @author      -
// @description 19/03/2021 à 19:55:34
// @require     https://cdnjs.cloudflare.com/ajax/libs/cash/8.1.0/cash.min.js
// @require     https://unpkg.com/ajax-hook@2.0.3/dist/ajaxhook.min.js
// @grant       GM.setClipboard
// @run-at      document-start
// ==/UserScript==

const interceptors = [
    {
        name: "todos",
        url: new RegExp("https://jsonplaceholder.typicode.com/todos.*"),
        onResponse: response => response,
        updateText: state => `${state.length} todos`
    },
    {
        name: "posts",
        url: new RegExp("https://jsonplaceholder.typicode.com/posts"),
        onRequest: config => {
            console.log(config);
        },
        updateText: state => `${state.length} posts posted`
    }
];

let state = {};

const ui = {
    $uiNode: $('<div></div>')
        .attr("style", "position: absolute; top: 0; right: 0; width: 400px; height: 200px; background-color: rgba(100, 100, 100, 0.6)"),

    interceptorTextNodes: {},

    init: () => {
        interceptors.forEach(interceptor => {
            const textNode = $("<p>text</p>");
            const copyBtn = $("<button>copy</button>")
                .on("click", () => GM.setClipboard(state[interceptor.name] || []));

            ui.interceptorTextNodes[interceptor.name] = textNode;

            ui.$uiNode
                .append(textNode)
                .append(copyBtn);
        });
        ui.$uiNode.appendTo(document.body);

        ui.updateInterceptorUI();
    },

    updateInterceptorUI: () => {
        interceptors.forEach(interceptor => {
            const interceptorState = state[interceptor.name] || [];
            ui.interceptorTextNodes[interceptor.name].text(interceptor.updateText(interceptorState));
        });
    }
}

function fireCallback(callbackName, url, arg) {
    interceptors
        .filter(i => i[callbackName] && i.url.test(url))
        .forEach(interceptor => {
            const result = interceptor[callbackName](arg);
            if (result) {
                state[interceptor.name] = (state[interceptor.name] || []).concat(result);
            }
            ui.updateInterceptorUI();
        });
}

ah.proxy({
    onRequest: (config, handler) => {
        fireCallback("onRequest", config.url, config);
        handler.next(config);
    },
    onResponse: (response, handler) => {
        fireCallback("onResponse", response.config.url, response);
        handler.next(response)
    }
});

$(function () {
    ui.init();
});