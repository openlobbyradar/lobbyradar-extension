if(SAFARI) {
    var ToolbarButton;
    safari.extension.toolbarItems.forEach(function(item) {
        if (item.identifier == 'lobbyradarBtn') {
            ToolbarButton = item;
        }
    });
    var updateBrowserButton = function( tabId ) {
        var storedTabdata = tabData.get(tabId);
        if(storedTabdata && storedTabdata.hits) {
            ToolbarButton.badge = storedTabdata.hits.toString();
        } else {
            ToolbarButton.badge = 0;
        }
    }

    var setBrowserButton_waiting = function( tabId ) {
        ToolbarButton.badge = '...';
    }
} else {
    var updateBrowserButton = function( tabId ) {
        chrome.browserAction.setTitle({title:'Lobbyradar',tabId:tabId});
        chrome.browserAction.setBadgeText({text:'',tabId:tabId});
        chrome.browserAction.setBadgeBackgroundColor({ color: "#555",tabId:tabId });
        var storedTabdata = tabData.get(tabId);
        if(storedTabdata.hits) {
            chrome.browserAction.setBadgeText({text:storedTabdata.hits.toString(),tabId:tabId});
        }
    }

    var setBrowserButton_waiting = function( tabId ) {
        chrome.browserAction.setTitle({title:'Lobbyradar arbeitet...',tabId:tabId});
        chrome.browserAction.setBadgeText({text:'...',tabId:tabId});
        chrome.browserAction.setBadgeBackgroundColor({ color: "#a00",tabId:tabId });
    }
}

// keep track of names found in each Browsertab
tabData = {
    // get data stored for a tab
    get: function(tabId) {
        return tabData[tabId];
    },

    // store value for tab
    set: function(tabId, value) {
        tabData[tabId] = value;
    },

    // When a tab is closed, delete all its data
    onTabClosed: function(tabId) {
        console.log('Tab '+tabId+' closed');
        delete tabData[tabId];
    }
};

function respondToLobbyradarBadgeMessage (request, sender, sendResponse) {
    switch(request.requestType) {
        case 'updateBrowserButton': updateBrowserButton( sender.tab.id );break;
        case 'setBrowserButton_waiting': setBrowserButton_waiting( sender.tab.id );break;
    }
    return true;
};

if(SAFARI) {
    safari.application.activeBrowserWindow.addEventListener("activate",function(msgEvent){console.log(msgEvent);});
    safari.application.addEventListener("message",function(msgEvent){
        var sender = {tab:msgEvent.target};
        sender.tab.id=_.indexOf(safari.application.activeBrowserWindow.tabs,sender.tab);

        var sendResponse=function(data) {
            var callbackID = msgEvent.message.callbackID;
            msgEvent.target.page.dispatchMessage( msgEvent.name, { value:data,
                                                                   callbackID:callbackID
            });
        }
        respondToLobbyradarBadgeMessage( msgEvent.message, sender, sendResponse );
    },false);

} else {
    chrome.runtime.onMessage.addListener(respondToLobbyradarBadgeMessage);
    chrome.tabs.onRemoved.addListener(tabData.onTabClosed);
}
