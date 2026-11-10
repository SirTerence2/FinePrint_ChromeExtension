"use strict";

function setBadgeText(enabled){
    const text = enabled ? "ON" : "OFF"
    void chrome.action.setBadgeText({text: text})
}

const input = document.getElementById("analyze")

let rgb_color = "rgb_box"
const scoreCard = `
<div class="rgb_box" style="position: relative; left: 10px; top: 20px;">
    <div style="position: relative; left: 25px; top: 22px">
        <h1 style="position: relative; left: 12px; text-decoration: underline;">Score:</h1>
        <div id = "average_score" style="position: relative; left: 30px; font-weight: bold; font-size: 40px;">Please Press The Analyze Button</div>
    </div>
</div>`;

const greenInfoReportCard = `
<div class="rgb_box_green" style="position: relative; left: 30px; top: 50px;">
    <div style="position: relative; top: 20px" class="flex-container-text-box">
        <h1 style="position: relative; left: 12px; text-decoration: underline; font-weight: bold;">Low Importance:</h1>
        <ul style="position: relative; top: 35px;" class="vertical-scroll">
        </ul>
    </div>
</div>
`;

const yellowInfoReportCard = `
<div class="rgb_box_yellow" style="position: relative; left: 30px; top: 50px;">
    <div style="position: relative; top: 20px" class="flex-container-text-box">
        <h1 style="position: relative; left: 12px; text-decoration: underline; font-weight: bold;">Medium Importance:</h1>
        <ul style="position: relative; top: 35px;" class="vertical-scroll">
        </ul>
    </div>
</div>
`

const redInfoReportCard = `
<div class="rgb_box_red" style="position: relative; left: 30px; top: 50px;">
    <div style="position: relative; top: 20px" class="flex-container-text-box">
        <h1 style="position: relative; left: 12px; text-decoration: underline; font-weight: bold;">High Importance:</h1>
        <ul style="position: relative; top: 35px;" class="vertical-scroll">
        </ul>
    </div>
</div>
`;
const reportSections = document.querySelectorAll("section");
const reportSection = reportSections[reportSections.length - 1];
const scoreSection = reportSections[0];

let hasScoreCard = false;
let createdCards = false;
input.addEventListener("click", async () => {
    if(scoreSection){
        if(!hasScoreCard){
            //style="position:relative; left: 50px"
            scoreSection.insertAdjacentHTML('afterbegin', scoreCard)
            scoreSection.style.marginLeft = "200px";
            hasScoreCard = true;
        }
    }
    //void chrome.storage.sync.set({"analyze": Date.now()})
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: "analyze" });
        //showResults(response);
        portrayData(response.average, response.elements);
    } catch (err) {
        console.log("Could not reach the page:", err);
    }
})

/*
chrome.storage.onChanged.addListener((changes, areaName) => {
    if(areaName !== "sync" || !changes.time){
        return
    }
    chrome.storage.sync.get("text", ({text}) => {
        if(!text){
            return;
        }
        const div = document.getElementById("average_score")
        div.innerHTML = text
        if(parseInt(text) >= 4){
            div.style.color = "#ff1e00";
            rgb_color = "rgb_box_red_score_box";
        }
        else if(parseInt(text) >= 2){
            div.style.color = "#fff700";
            rgb_color = "rgb_box_yellow_score_box";
        }
        else {
            div.style.color = "#0dff00";
            rgb_color = "rgb_box_green_score_box";
        }
        let card = document.querySelector(".rgb_box");
        for(let i = 0; i < 3 && !card; i++){
            if(i === 0){
                card = document.querySelector(".rgb_box_red_score_box");
            }
            else if(i === 1){
                card = document.querySelector(".rgb_box_yellow_score_box");
            }
            else {
                card = document.querySelector(".rgb_box_green_score_box");
            }
        }
        if(card.classList.contains("rgb_box")){
            card.classList.replace("rgb_box", rgb_color); 
        }
        else if(card.classList.contains("rgb_box_red_score_box")){
            card.classList.replace("rgb_box_red_score_box", rgb_color); 
        }
        else if(card.classList.contains("rgb_box_yellow_score_box")){
            card.classList.replace("rgb_box_yellow_score_box", rgb_color); 
        }
        else if(card.classList.contains("rgb_box_green_score_box")){
            card.classList.replace("rgb_box_green_score_box", rgb_color); 
        }
    })
});
*/
/*
chrome.storage.onChanged.addListener((changes, areaName) => {
    if(areaName !== "local" || !changes.time){
        return
    }
    chrome.storage.local.get("ELEMENT_WEIGHT", ({ELEMENT_WEIGHT}) => {
        if(!ELEMENT_WEIGHT){
            return;
        }
        const map = new Map(ELEMENT_WEIGHT)

        if(!createdCards){
            reportSection.insertAdjacentHTML('afterbegin', redInfoReportCard)
            reportSection.insertAdjacentHTML('afterbegin', yellowInfoReportCard)
            reportSection.insertAdjacentHTML('afterbegin', greenInfoReportCard)
            createdCards = true;
        }

        const redUlElement = document.querySelector(".rgb_box_red ul");
        const yellowUlElement = document.querySelector(".rgb_box_yellow ul");
        const greenUlElement = document.querySelector(".rgb_box_green ul");

        for (const [element, count] of map) {
            if(count == 5){
                const redLi = document.createElement('li');
                redLi.textContent = element;
                redUlElement.appendChild(redLi);
            }
            else if(count == 3){
                const yellowLi = document.createElement('li');
                yellowLi.textContent = element;
                yellowUlElement.appendChild(yellowLi);
            }
            else {
                const greenLi = document.createElement('li');
                greenLi.textContent = element;
                greenUlElement.appendChild(greenLi);
            }
        }
    });
});
*/

function portrayData(text, ELEMENT_WEIGHT){
    const div = document.getElementById("average_score")
    div.innerHTML = text
    if(parseInt(text) >= 4){
        div.style.color = "#ff1e00";
        rgb_color = "rgb_box_red_score_box";
    }
    else if(parseInt(text) >= 2){
        div.style.color = "#fff700";
        rgb_color = "rgb_box_yellow_score_box";
    }
    else {
        div.style.color = "#0dff00";
        rgb_color = "rgb_box_green_score_box";
    }
    let card = document.querySelector(".rgb_box");
    for(let i = 0; i < 3 && !card; i++){
        if(i === 0){
            card = document.querySelector(".rgb_box_red_score_box");
        }
        else if(i === 1){
            card = document.querySelector(".rgb_box_yellow_score_box");
        }
        else {
            card = document.querySelector(".rgb_box_green_score_box");
        }
    }
    if(card.classList.contains("rgb_box")){
        card.classList.replace("rgb_box", rgb_color); 
    }
    else if(card.classList.contains("rgb_box_red_score_box")){
        card.classList.replace("rgb_box_red_score_box", rgb_color); 
    }
    else if(card.classList.contains("rgb_box_yellow_score_box")){
        card.classList.replace("rgb_box_yellow_score_box", rgb_color); 
    }
    else if(card.classList.contains("rgb_box_green_score_box")){
        card.classList.replace("rgb_box_green_score_box", rgb_color); 
    }

    const map = new Map(ELEMENT_WEIGHT)

    if(!createdCards){
        reportSection.insertAdjacentHTML('afterbegin', redInfoReportCard)
        reportSection.insertAdjacentHTML('afterbegin', yellowInfoReportCard)
        reportSection.insertAdjacentHTML('afterbegin', greenInfoReportCard)
        createdCards = true;
    }

    const redUlElement = document.querySelector(".rgb_box_red ul");
    const yellowUlElement = document.querySelector(".rgb_box_yellow ul");
    const greenUlElement = document.querySelector(".rgb_box_green ul");

    redUlElement.replaceChildren();
    yellowUlElement.replaceChildren();
    greenUlElement.replaceChildren();

    for (const [element, count] of map) {
        if(count == 5){
            const redLi = document.createElement('li');
            redLi.textContent = element;
            redUlElement.appendChild(redLi);
        }
        else if(count == 3){
            const yellowLi = document.createElement('li');
            yellowLi.textContent = element;
            yellowUlElement.appendChild(yellowLi);
        }
        else {
            const greenLi = document.createElement('li');
            greenLi.textContent = element;
            greenUlElement.appendChild(greenLi);
        }
    }
}