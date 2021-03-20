
const onResponse = (response) => {
    console.log("response", response);
}

const onRequest = (config) => {
    console.log("request", config);
}

(function (open) {
    window.XMLHttpRequest.prototype.open = function () {
        var config = this.config = {headers: {}};
        config.method = arguments[0];
        config.url = arguments[1];
        config.async = arguments[2];
        config.user = arguments[3];
        config.password = arguments[4];
        this.config = config;

        this.addEventListener("readystatechange", function () {
            if (this.readyState === 4 && this.status !== 0) {
                const response = {
                    response: this.response,
                    responseText: this.responseText,
                    status: this.status,
                    config: this.config,
                }
                onResponse(response);
            }
        });
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
