"use strict"

//import * as pdfjsLib from './src/pdf.min.mjs';
//pdfjsLib.GlobalWorkerOptions.workerSrc = './src/pdf.worker.min.mjs';

const highlightFilterLow = 'rgba(152, 245, 152, 0.92)'
const highlightFilterMedium = 'rgba(241, 241, 131, 0.88)'
const highlightFilterHigh = 'rgba(237, 87, 87, 0.94)'

let totalWeight = 0.0
let highlightedElements = 0;

const CATEGORIES = {
  "Rights You Give Up": ["binding arbitration", "mandatory arbitration", "class action", "waiver of class", "waive your right", "waive", "jury trial", "opt out of arbitration"],
  "Personal Data Sale & Tracking": ["sell your data", "sell your personal information", "biometric", "precise location", "track your"],
  "Money & Commitment": ["auto-renew", "automatically renew", "automatically charged", "unless you cancel", "non-refundable", "no refund", "late fee", "cancellation fee", "free trial", "billing cycle", "change the price", "price change", "chargeback"],
  "Content & IP Ownership": ["perpetual", "irrevocable", "sublicense", "royalty-free", "worldwide license", "derivative works", "you grant us", "likeness", "use your name"],
  "Warranties & Liability": ["as is", "no warranty", "disclaim", "not liable", "limitation of liability", "indemnify", "hold harmless", "consequential damages", "indirect damages", "at your own risk"],
  "Surveillance & Monitoring": ["monitor your", "scan your", "access your contacts", "access your camera", "review your content"],
  "Data Sharing & Advertising": ["third parties", "third-party", "third party", "affiliates", "behavioral advertising", "targeted advertising", "data broker", "profiling", "data retention"],
  "Legal Venue & Deadlines": ["governing law", "exclusive jurisdiction", "statute of limitations"],
  "Control & Changes": ["sole discretion", "without notice", "terminate", "suspend", "reserve the right", "modify these terms", "change these terms", "discontinue", "deactivate"],
}

let ELEMENT_WEIGHT = new Map();

const CATEGORY_WEIGHTS = {
  "Rights You Give Up": 5,
  "Personal Data Sale & Tracking": 5,
  "Money & Commitment": 3,
  "Content & IP Ownership": 3,
  "Warranties & Liability": 3,
  "Surveillance & Monitoring": 5,
  "Data Sharing & Advertising": 3,
  "Legal Venue & Deadlines": 3,
  "Control & Changes": 1,
}

function processNode(node){
    if(node.childNodes.length > 0){
        Array.from(node.childNodes).forEach(processNode)
    }
    if(node.nodeType === Node.TEXT_NODE && node.textContent !== null && node.textContent.trim().length > 0){
        const parent = node.parentElement
        //|| parent.classList.contains("highlighted")
        if(parent !== null && (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(parent.tagName) || parent.classList.contains("highlighted"))){
            return
        }
        const sentences = node.textContent.split(/(?<=[.!?])\s+/);
        const fragment = document.createDocumentFragment()
        let shouldSwap = false
        for(const sentence of sentences){
            let simplified = sentence.toLowerCase()
            let foundPhrase = false
            for(const [category, phrases] of Object.entries(CATEGORIES)) {
                for(const phrase of phrases){
                    if(simplified.includes(phrase)){
                        const mark = document.createElement("mark")
                        mark.className = "highlighted"
                        //calculateWeight(mark, category)
                        highlightElement(mark, category)
                        mark.textContent = sentence
                        ELEMENT_WEIGHT.set(mark.textContent, CATEGORY_WEIGHTS[category]);
                        if(!foundPhrase){
                            fragment.appendChild(mark)
                        }
                        foundPhrase = true;
                        shouldSwap = true;
                    }
                }
            }
            if(!foundPhrase){
                fragment.appendChild(document.createTextNode(sentence))
            }
        }
        if(shouldSwap){
            parent.replaceChild(fragment, node);
        }
    }
}

function highlightElement(elem, category){
    let weight = CATEGORY_WEIGHTS[category];
    if(weight === 5){
        let previousColor = elem.style.backgroundColor;
        if(previousColor === highlightFilterMedium){
            totalWeight -= 3;
            highlightedElements--
        }
        if(previousColor === highlightFilterLow){
            totalWeight -= 1;
            highlightedElements--
        }
        totalWeight += weight
        highlightedElements++
        elem.style.backgroundColor = highlightFilterHigh
    }
    else if(weight === 3){
        let previousColor = elem.style.backgroundColor;
        if(previousColor !== highlightFilterHigh){
            if(previousColor === highlightFilterLow){
                totalWeight -= 1;
                highlightedElements--
            }
            totalWeight += weight
            highlightedElements++
            elem.style.backgroundColor = highlightFilterMedium
        }
    }
    else {
        let previousColor = elem.style.backgroundColor;
        if(previousColor !== highlightFilterHigh && previousColor !== highlightFilterMedium){
            totalWeight += weight
            highlightedElements++
            elem.style.backgroundColor = highlightFilterLow
        }
    }
}

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) =>{
        if(mutation.addedNodes.length > 0){
            mutation.addedNodes.forEach(processNode)
        }
        else {
            processNode(mutation.target)
        }
    })
})

//let allText = [];
let analyzed = false;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.type !== "analyze" || analyzed){
        return
    }
    analyzed = true;
    (async() => {
        try{
            const currentUrl = window.location.href;
            let allText = await extractPDFText(currentUrl);
            for(const sentence of allText){
                let simplified = sentence.toLowerCase()
                for(const [category, phrases] of Object.entries(CATEGORIES)) {
                    for(const phrase of phrases){
                        if(simplified.includes(phrase)){
                            if(ELEMENT_WEIGHT.has(sentence)){
                                const pastWeight = ELEMENT_WEIGHT.get(category);
                                if(CATEGORY_WEIGHTS[category] > pastWeight){
                                    ELEMENT_WEIGHT.set(sentence, CATEGORY_WEIGHTS[category]);
                                }
                            }
                            else {
                                ELEMENT_WEIGHT.set(sentence, CATEGORY_WEIGHTS[category]);
                            }
                        }
                    }
                }
            }
            for(const [sentence, weight] of ELEMENT_WEIGHT) {
                highlightedElements++;
                totalWeight += weight;
            }
            //const average = highlightedElements > 0 ? Math.ceil(totalWeight / highlightedElements) : 0
            const average = highlightedElements > 0 ? Math.ceil(totalWeight / highlightedElements) : 0
            sendResponse({average: average, elements: Array.from(ELEMENT_WEIGHT)});
            analyzed = false;
        }
        catch(error){
            observer.observe(document, {
                attributes: false,
                characterData: true,
                childList: true,
                subtree: true,
            })
            processNode(document)
            const average = highlightedElements > 0 ? Math.ceil(totalWeight / highlightedElements) : 0
            sendResponse({average: average, elements: Array.from(ELEMENT_WEIGHT)});
            analyzed = false;
        }
    })();
    return true;
})

async function extractPDFText(url){
    //pdf.min.mjs
    //pdf.worker.min.mjs
    const pdfJsUrl = chrome.runtime.getURL('pdf.min.mjs');
    //chrome-extension://gmgfdehapgihagmainliaopidndkhojl/pdf.min.mjs
    //chrome-extension://gmgfdehapgihagmainliaopidndkhojl/pdf.worker.min.mjs
    const workerUrl = chrome.runtime.getURL('pdf.worker.min.mjs');

    const pdfjsLib = await import(pdfJsUrl);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

    const loadingTask = pdfjsLib.getDocument({url});
    const pdf = await loadingTask.promise;
    let allPDFText = "";
    for(let i = 1; i <= pdf.numPages; i++){
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const pageString = content.items.filter((item) => 'str' in item).map((item) => item.str + (item.hasEOL ? '\n' : ' ')).join('').trim();
        allPDFText += pageString + '\n';
        page.cleanup();
    }
    return allPDFText.split(/(?<=[.!?])\s+/);
}
