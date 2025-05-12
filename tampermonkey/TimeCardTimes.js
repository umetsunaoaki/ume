// ==UserScript==
// @name         TimeCard-TotalWorkType-by-Ticket
// @namespace    http://192.168.251.231/freemind/business/workreport/daily_work/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://192.168.251.231/freemind/business/workreport/daily_work/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==
/**
 * 日報登録画面で、日報の「メモ」に入力した "#" から始まる値ごとに、日別に合計時間を算出して表示します。
 */
(function() {
    'use strict';

    document.umeCreateCanvas = (opt) => {
        var canvas = document.createElement("div");
        Object.assign(canvas.style, {
            position: "absolute",
            top: opt?.top??0,
            left: opt?.left??0,
            right: opt?.right??0,
            width: opt?.width??"200px",
            height: opt?.height??"200px",
            padding: "2px",
            fontSize: "10pt",
            backgroundColor: "white",
            border: "solid 1px gray",
            overflowY: "auto",
        });
        var btnClose = document.createElement("button");
        Object.assign(btnClose.style, {
            position: "absolute",
            top: 0,
            right: 0,
            fontSize: "10px",
            textAlign: "center",
            padding: 0
        });
        btnClose.onclick = () => {
            canvas.style.display = "none";
        };
        btnClose.innerHTML = "×";
        canvas.appendChild(btnClose);
        var board = document.createElement("div");
        Object.assign(board.style, {
            position: "absolute",
            top: "12px",
            left: "2px",
            width: "calc(100% - 4px)",
            textAlign: "left"
        });
        canvas.appendChild(board);
        canvas.html = (txt) => {
            board.innerHTML = txt;
        };
        document.body.appendChild(canvas);
        return canvas;
    };

    // Your code here...
    const BTN_UP = "&#x1f53c;";
    const BTN_DOWN = "&#x1f53d;";
    const BTN_CALC = "calc";
    var ticketTimes = {};
    var dayLabels = {};
    var ticketMemos = {};
    document.body.fmTags = new Set();
    const calc = (m1, s1, m2, s2) => {
        let _m1 = parseInt(m1, 10);
        let _s1 = parseInt(s1, 10);
        let _m2 = parseInt(m2, 10);
        let _s2 = parseInt(s2, 10);
        return _m2*60 + _s2 - _m1*60 - _s1;
    }
    const toTime = (num) => {
        const KETA = 2;
        if(isNaN(num)) return "";
        let rounded = Math.round(num / 60 * Math.pow(10,KETA)) / Math.pow(10,KETA);
        if ( String(rounded).indexOf(".") == -1 ) {
            return rounded + "." + "0".repeat(KETA);
        } else {
            let zeroPad = String(rounded) + "00";
            return zeroPad.substring(0, zeroPad.indexOf(".") + 1 + KETA);
        }
    }
    const calcTime = () => {
        ticketTimes = {};
        dayLabels = {};
        ticketMemos = {};
        document.querySelectorAll("div.calendar-header > div.day").forEach((day, di) => {
            let [,dayClass] = day.className.match(/(day\d)/) ?? "";
            if ( !dayClass ) return;
            let labelObj = day.querySelector("div.day-label");
            dayLabels[di] = labelObj.innerText;
        });
        document.querySelectorAll("div.calendar-body > div.day").forEach((day, di) => {
            let [,dayClass] = day.className.match(/(day\d)/) ?? "";
            if ( !dayClass ) return;
            ticketTimes[di] = {};
            ticketMemos[di] = {};
            day.querySelectorAll("div.day-body > div[title].work").forEach((e, i) => {
                let title = e.title.substring(e.title.indexOf("\n")+1);
                let [,stm,sts,etm,ets] = e.title.match(/(\d\d):(\d\d).(\d\d):(\d\d)/) ?? "";
                let [,tn] = title.match(/(#[^ :\r\n]+)/) ?? "";
                if ( tn ) {
                    let time = calc(stm, sts, etm, ets);
                    if ( !ticketTimes[di][tn] ) ticketTimes[di][tn] = 0;
                    ticketTimes[di][tn] += time;
                    document.body.fmTags.add(tn);
                    let memo = e.title.indexOf("\n", e.title.indexOf("\n") + 1) > 0 ? e.title.substring(e.title.indexOf("\n", e.title.indexOf("\n") + 1)) : "";
                    ticketMemos[di][tn] = ticketMemos[di][tn] || new Set();
                    ticketMemos[di][tn].add(memo);
                }
            });
        });
    }
    /** 仕掛かり */
    const createTabContainer = () => {
        let container = document.createElement("div");
        Object.assign(container.style, {
            position: "relative"
        });
        container.tabs = [];
        let tabArea = document.createElement("ul");
        Object.assign(tabArea.style, {
            display: "block",
            margin: 0,
            padding: 0,
            position: "absolute",
            top: 0,
            left: 0,
            height: "13px"
        });
        container.addTab = (tabName, content, tabClick) => {
            let tab = document.createElement("li");
            Object.assign(tab.style, {
                display: "inline-block",
                fontSize: "11px",
                padding: "1px",
                borderStyle: "solid",
                borderWidth: "1px",
                borderColor: "gray",
            });
            tab.innerHTML = tabName;
            let body = document.createElement("body");
            Object.assign(body.style, {
                display: "block",
                fontSize: "11px",
                padding: "2px",
                marginTop: "-1px"
            });
            body.appendChild(content);
            tabArea.appendChild(tab);
        }
        let board = document.createElement("div");
        Object.assign(board.style, {
            marginTop: "20px",
            textAlign: "left",
            maxHeight: "220px",
            overflowY: "scroll",
            display: "block"
        });
        board.isOpen = true;
        return container;
    }
    const getNthDate = (idx) => {
        const startDate = new Date(document.getElementById("date").value);
        return new Date(startDate.getTime() + 86400000 * idx);
    }
    const formatDate = (d) => {
        let d2 = (n) => {
            if ( n >= 0 && n < 10 ) return "0" + n;
            else return "" + n;
        }
        return d.getFullYear() + "-" +
            d2(d.getMonth()+1) + "-" +
            d2(d.getDate());
    }
    const ready = () => {
        if ( !document.querySelector("div.calendar-body") ) return;
        let container = document.createElement("div");
        Object.assign(container.style, {
            position: "fixed",
            bottom: "20px",
            left: "15px",
            width: "200px",
            minHeight: "24px",
            padding: "2px",
            border: "solid 1px #ccc",
            backgroundColor: "white",
            zIndex: 10,
        });
        let btn = document.createElement("button");
        Object.assign(btn.style, {
            position: "absolute",
            top: "2px",
            left: "2px",
            width: "42px",
            height: "18px",
            padding: "2px",
            backgroundColor: "#999",
            color: "white",
            fontSize: "5px"
        });
        btn.innerHTML = BTN_CALC;
        btn.addEventListener("click", (e) => {
            calcTime();
            let msg = [];
            for ( let day in ticketTimes ) {
                msg.push("▼" + dayLabels[day]);
                let msg_at_date = [];
                for ( let key in ticketTimes[day] ) {
                    // ticketTimes のインデックスは 1 スタート
                    var a1 = `<a href="https://works.freemind.co.jp/redmine/issues/${key.substring(1)}/time_entries/new?time_entry[spent_on]=${formatDate(getNthDate(day-1))}&time_entry[hours]=${toTime(ticketTimes[day][key])}&time_entry[comments]=${Array.from(ticketMemos[day][key]).join("、")}" target="_blank">`;
                    var a2 = "</a>";
                    msg_at_date.push("　" + a1 + key + " " + toTime(ticketTimes[day][key]) + a2);
                }
                msg_at_date.sort();
                msg = [...msg, ...msg_at_date];
            }
            board.innerHTML = msg.join("<br/>");
            //getTags();
        });
        let btnMin = document.createElement("button");
        Object.assign(btnMin.style, {
            position: "absolute",
            top: "2px",
            right: "2px",
            padding: "2px",
            textAlign: "center",
            fontSize: "5px"
        });
        btnMin.innerHTML = BTN_DOWN;
        let board = document.createElement("div");
        Object.assign(board.style, {
            marginTop: "20px",
            textAlign: "left",
            maxHeight: "220px",
            overflowY: "scroll",
            display: "block"
        });
        board.isOpen = true;
        btnMin.addEventListener("click", (e) => {
            board.isOpen = !board.isOpen;
            board.style.display = board.isOpen ? "block" : "none";
            btnMin.innerHTML = board.isOpen ? BTN_DOWN : BTN_UP;
        });
        container.appendChild(btn);
        container.appendChild(btnMin);
        container.appendChild(board);
        document.body.appendChild(container);
        createSearchWork();
    }
    const createSearchWork = function() {
        let container = document.createElement("div");
        Object.assign(container.style, {
            position: "absolute",
            width: "150px",
            zIndex: 1000,
            padding: "2px",
            top: "10px",
            left: "400px"
        });
        let searchForm = document.createElement("input");
        searchForm.type = "text";
        searchForm.id = "searchText";
        searchForm.name = "searchText";
        searchForm.style.width = "100px";
        searchForm.placeholder = "検索キーワード";
        let searchBtn = document.createElement("button");
        searchBtn.innerHTML = "検索";
        container.appendChild(searchForm);
        container.appendChild(searchBtn);
        searchBtn.onclick = function(){
            let text = searchForm.value;
            if ( !text ) return false;
            document.querySelectorAll("div.day div.work").forEach((e) => {
                let reText = new RegExp(text);
                let targetObj = e.querySelector("div.body");
                if ( e.innerText?.match(reText) ) {
                    targetObj.className = targetObj.className + " blink";
                } else {
                    targetObj.className.replace("blink", "");
                }
            });
        };
        document.body.appendChild(container);
        let style = document.createElement("style");
        style.innerText = "@keyframes blinkAni {"
            + "  0% {"
            + "    border: 2px solid #cc2200;"
            + "  }"
            + "  100% {"
            + "    border: 2px solid #efefef;"
            + "  }"
            + "}"
            + ".blink {"
            + "  animation: blinkAni 1s ease infinite alternate;"
            + "}"
        ;
        document.body.appendChild(style);
    }
    const getTags = () => {
        var createDiv=()=>{
            var div=document.createElement("div");
            Object.assign(div.style, {
                position: "fixed",
                top: "20px",
                right: "20px",
                backgroundColor: "white",
                padding: "2px",
                borderStyle: "solid",
                borderWidth: "1px",
                borderColor: "#ccc",
                height: "200px",
                width: "150px",
                zIndex: 101/*TBより前に*/
            });
            var closeBtn = document.createElement("button");
            Object.assign(closeBtn.style, {
                fontSize: "10px",
                position: "absolute",
                top: "2px",
                right: "2px",
                height: "20px"
            });
            closeBtn.innerHTML="×";
            closeBtn.onclick=()=>{
                console.log("none");
                div.style.display="none";
            };
            div.appendChild(closeBtn);
            var memo = document.createElement("div");
            Object.assign(memo.style, {
                position: "absolute",
                top: "22px",
                width: "100%",
                fontSize: "11px",
                height: "170px",
                padding: "1px",
                textAlign: "left",
                overflowY: "auto"
            });
            div.appendChild(memo);
            div.write = (t)=>{
                memo.innerHTML = t;
            };
            div.append = (arr) => {
                while ( memo.firstChild ) {
                    memo.removeChild(memo.firstChild);
                }
                arr.forEach((e) => {
                    let elem = document.createElement("div");
                    Object.assign(elem.style, {
                        userSelect: "all",
                        cursor: "default"
                    });
                    elem.innerHTML = e;
                    memo.appendChild(elem);
                });
            }
            return div;
        };
        if ( !document.body.fmMemo ) {
            let div = createDiv();
            document.body.fmMemo = div;
            document.body.appendChild(div);
        }
        if(document.body.fmMemo.style.display=="none")document.body.fmMemo.style.display="block";
        //document.body.fmMemo.write(Array.from(document.body.fmTags?.values()).sort().join("<br/>"));
        document.body.fmMemo.append(Array.from(document.body.fmTags?.values()).sort());
    }
    setTimeout(ready, 2 * 1000);
})();
