"use strict"

function setBadgeText(enabled) {
    const text = enabled ? "ON" : "OFF"
    void chrome.action.setBadgeText({text: text})
}

function startUp(){
    chrome.storage.sync.get("enabled", (data) => {
        setBadgeText(!!data.enabled)
    })
}

chrome.runtime.onStartup.addListener(startUp)
chrome.runtime.onInstalled.addListener(startUp)

const finePrint_window = "https://fineprint-agreement-c7mf.bolt.host/?text"
chrome.runtime.onMessage.addListener((message) =>{
    if(message.type !== "openWindow"){
        return;
    }
    chrome.windows.create({url: finePrint_window, type: "popup", width: 900, height: 700, left: 100, top: 100 },
        (win) => {
        const tabId = win.tabs[0].id;
        const onUpdated = (id, info) => {
            if (id !== tabId || info.status !== "complete") return;
            chrome.tabs.onUpdated.removeListener(onUpdated);

            chrome.scripting.executeScript({target: { tabId }, func: fillTextarea, args: [message.text],});
        };
        chrome.tabs.onUpdated.addListener(onUpdated);
    }
  );
});

function fillTextarea(text) {
  const fill = () => {
    const box = document.getElementById("contract_input_box");
    if (!box){
        return false;
    }

    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
    setter.call(box, text);
    box.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  };

  if(fill()){ 
    return;
  }

  const observer = new MutationObserver(() => {
    if (fill()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 10000);
}