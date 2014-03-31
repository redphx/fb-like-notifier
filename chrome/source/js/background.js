"use strict";

var getGraphUrlInfo = function(url, callback, errorCallback) {
    var apiUrl = 'https://graph.facebook.com/' + url;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', apiUrl, true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            try {
                var resp = JSON.parse(xhr.responseText);
                callback && callback.call(null, resp);
            } catch (e) {
                errorCallback && errorCallback.call(null, 0);
            }
        }
    }

    xhr.onerror = function() {
        errorCallback && errorCallback.call(null, 0);
    }
    xhr.send();
}

var NOTIFICATIONS_DATA = {};

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
    if (!NOTIFICATIONS_DATA[notificationId]) {
        return;
    }

    if (buttonIndex == 0) {
        chrome.tabs.create({
            url: NOTIFICATIONS_DATA[notificationId].href[0]
        });
    } else if (buttonIndex == 1) {
        chrome.tabs.create({
            url: 'https://www.facebook.com/me/allactivity?privacy_source=activity_log&log_filter=likes'
        });
    }
    /*
     else {
        var formData = '',
            notifData = NOTIFICATIONS_DATA[notificationId];

        for (key in notifData) {
            if (notifData.hasOwnProperty(key)) {
                var val = notifData[key][0];
                if (key === '__req') {
                    val = parseInt(val) + 1;
                }
                formData += key + '=' + encodeURIComponent(val) + '&'
            }
        }
        formData = formData.substr(0, formData.length - 1);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.facebook.com/plugins/like/disconnect', true);
        xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                console.log('unliked');
            }
        }

        xhr.send(formData);
    }
    */
    delete NOTIFICATIONS_DATA[notificationId];
});

chrome.notifications.onClosed.addListener(function(notificationId, byUser) {
    if (NOTIFICATIONS_DATA[notificationId]) {
        delete NOTIFICATIONS_DATA[notificationId];
    }
});

chrome.webRequest.onBeforeRequest.addListener(function(details) {
    if (!details.requestBody.formData || !details.requestBody.formData.href) {
        return;
    }

    var url = details.requestBody.formData.href[0];

    getGraphUrlInfo(url, function(resp) {
        var alertMessage;
        if (resp.name) {
            alertMessage = 'Bạn vừa thích fanpage ' + resp.name;
        } else {
            alertMessage = 'Bạn vừa thích trang ' + url;
        }

        var opt = {
            type: 'basic',
            title: 'Facebook Like Notifier',
            message: alertMessage,
            iconUrl: 'img/icon_128.png',
            buttons: [
                {
                    title: 'Xem trang vừa thích'
                },
                {
                    title: 'Quản lý'
                }
                /*,
                {
                    title: 'Unlike'
                }
                */
            ]
        }

        chrome.notifications.create('', opt, function(notificationId) {
            NOTIFICATIONS_DATA[notificationId] = details.requestBody.formData;
        });
    });

    
}, {
    urls: [
        'https://www.facebook.com/plugins/like/connect'
    ],
    types: [
        'xmlhttprequest'
    ]
}, ['requestBody']);