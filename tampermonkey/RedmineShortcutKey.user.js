// ==UserScript==
// @name         RedmineShortcutKey
// @namespace    https://works.freemind.co.jp/redmine/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://works.freemind.co.jp/redmine/*
// @match        https://works.freemind.co.jp/pub-redmine/*
// @icon         https://www.google.com/s2/favicons?domain=google.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Your code here...


    /** ショートカットキー機能 */

    // 次の項目・前の項目
    let marker = document.createElement("div");
    Object.assign(marker.style, {
        position: "absolute",
        marginLeft: "-8px",
        width: "3px",
        height: "20px",
        backgroundColor: "yellow",
        zIndex: 10,
        display: "none"
    });
    marker.id = "marker";
    document.body.appendChild(marker);
    let moveJournal = (dt) => {
        let idx = document.idx ?? -1;
        idx += dt;
        let targets = document.querySelectorAll(
            "div.description, div.description h2, div.description h3, div.description h4, div.journal, div.subject" + // チケット
            ", div.wiki-page h4, div.wiki-page h3, div.wiki-page h2, div.wiki-page h1" + // wiki
            ", body");
        if ( targets.length == 0 ) return;
        if ( targets.length <= idx ) idx = 0;
        else if ( idx < 0 ) idx = targets.length - 1;
        const {left, top, height} = targets[idx].getBoundingClientRect();
        const {left: bodyL, top: bodyT} = document.body.getBoundingClientRect();
        document.idx = idx;
        marker.style.display = "block";
        marker.style.left = (left - bodyL) + "px";
        marker.style.top = (top - bodyT) + "px";
        marker.style.height = height + "px";
        scrollTo({top: top-bodyT, behavior: "smooth"});
        //targets[idx].scrollIntoView({behavior: "smooth", block: "center"}); // body が対応していない
    };
    // キーマッピング
    const KEYUP_DEF = {
        "normal": {
            "name": "通常",
            "keys": [
                {
                    key1: "",
                    key2: "m",
                    targetElement: "body",
                    description: "編集リンクをクリック",
                    func: (e) => {
                        document.querySelector("div.contextual a.icon-edit")?.click();
                    }
                },
                {
                    key1: "",
                    key2: "W",
                    targetElement: "body",
                    description: "チケット説明内の編集可否を切り替えます。",
                    func: (e) => {
                        document.querySelectorAll("div.issue.details div.description").forEach((obj, i)=>{
                            let editable = obj.contentEditable;
                            if ( editable == "true" ) {
                                obj.contentEditable = "inherit";
                                console.log("編集不可能にしました。");
                            } else {
                                obj.contentEditable = "true";
                                console.log("編集可能にしました。");
                            }
                        });
                    }
                },
                {
                    key1: "",
                    key2: "t",
                    targetElement: "body",
                    description: "「時間を記録」をクリック",
                    func: (e) => {
                        document.querySelector("div.contextual a.icon-time-add")?.click();
                    }
                },
                {
                    key1: "",
                    key2: "T",
                    description: "テーブル範囲を選択している場合、そのマークダウン文字列をクリップボードにコピーする（某テストケースを想定）",
                    func: (e) => {
                        if ( window.getSelection().rangeCount == 0 ) return;
                        let dom = window.getSelection().getRangeAt(0).cloneContents();
                        let t = "";
                        if ( dom.querySelectorAll("tr").length == 0 ) return;
                        dom.querySelectorAll("tr").forEach((e, i) => {
                            e.querySelectorAll("td,th").forEach((td,j) => {
                                t = t + "|" + (td.innerText?.replaceAll("\n", "&#10;")??"");
                            });
                            t = t + "|\n";
                            if ( i === 0 ) {
                                e.querySelectorAll("td,th").forEach((td,j) => {
                                    t = t + "|--";
                                });
                                t = t + "|\n";
                            }
                        });
                        navigator.clipboard.writeText(t).then(e => {});
                    }
                },
                {
                    key1: "",
                    key2: "/",
                    targetElement: "body",
                    description: "検索窓にフォーカス",
                    func: (e) => {
                        document.getElementById("q").focus();
                    }
                },
                {
                    key1: "",
                    key2: "p",
                    targetElement: "body",
                    description: "プロジェクト選択",
                    func: (e) => {
                        document.querySelector("#project-jump span")?.click();
                        document.getElementById("projects-quick-search").focus();
                    }
                },
                {
                    key1: "",
                    key2: "j",
                    targetElement: "body",
                    description: "次の項目へスクロール",
                    func: (e) => {
                        moveJournal(1);
                    }
                },
                {
                    key1: "",
                    key2: "k",
                    targetElement: "body",
                    description: "前の項目へスクロール",
                    func: (e) => {
                        moveJournal(-1);
                    }
                },
                {
                    key1: "",
                    key2: "Escape",
                    description: "（全ての）「キャンセル」ボタンをクリック",
                    func: (e) => {
                        [].slice.call(document.getElementsByTagName("a")).filter(node => {
                            return node.innerText == "キャンセル";
                        }).forEach(node => {
                            if ( node.closest("form")?.style?.display != "none" ) {
                                node.click();
                            }
                        });
                        document.activeElement.blur();
                    }
                },
                {
                    key1: "Ctrl",
                    key2: "Enter",
                    description: "【編集時】「送信」ボタンをクリック",
                    func: (e) => {
                        if ( document.querySelector("div#update").length > 0 && document.querySelector("div#update")?.style.display != "none" ) {
                            document.querySelector("input[value='送信']")?.click();
                            document.mode = null;
                        }
                    }
                },
                {
                    key1: "",
                    key2: "?",
                    targetElement: "body",
                    description: "ヘルプ（この画面）を表示",
                    func: (e) => {
                        showHelp();
                        document.mode = "help";
                    }
                },
            ]
        },
        "help": {
            "name": "ヘルプ表示時",
            "keys": [
                {
                    key1: "",
                    key2: "Escape",
                    description: "ヘルプを非表示にする",
                    func: (e) => {
                        hideHelp();
                        document.mode = null;
                    }
                }
            ]
        }
    };

    var helpCanvas = document.createElement("div");
    Object.assign(helpCanvas.style, {
        width: "100%",
        height: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        backgroundColor: "rgb(0,0,0,0.7)",
        display: "none"
    });
    var helpBody = document.createElement("div");
    Object.assign(helpBody.style, {
        width: "50%",
        height: "50%",
        overflowY: "auto",
        position: "absolute",
        top: "25%",
        left: "25%",
        backgroundColor: "rgb(0,0,0,0.4)",
        borderRadius: "10px",
        display: "block"
    });
    for ( let mode in KEYUP_DEF ) {
        let modeDiv = document.createElement("div");
        Object.assign(modeDiv.style, {
            width: "calc(100% - 8px)",
            padding: "15px 0 4px 4px",
            borderBottom: "solid 1px #999",
            clear: "both",
            color: "white"
        });
        modeDiv.innerHTML = KEYUP_DEF[mode].name;
        helpBody.appendChild(modeDiv);
        for ( let i = 0; i < KEYUP_DEF[mode].keys.length; i++ ) {
            let obj = KEYUP_DEF[mode].keys[i];
            let line = document.createElement("div");
            Object.assign(line.style, {
                width: "10%",
                float: "left",
                padding: "4px",
                color: "#fff0cc",
                marginLeft: "5%"
            });
            line.innerHTML = (obj.key1 ? obj.key1 + "+" : "") + obj.key2;
            let desc = document.createElement("div");
            Object.assign(desc.style, {
                width: "75%",
                float: "left",
                padding: "4px",
                color: "white"
            });
            desc.innerHTML = obj.description;
            helpBody.appendChild(line);
            helpBody.appendChild(desc);
        }
    }
    helpCanvas.appendChild(helpBody);
    helpCanvas.show = () => {
        helpCanvas.style.display = "block";
    };
    helpCanvas.hide = () => {
        helpCanvas.style.display = "none";
    };
    var showHelp = () => {
        helpCanvas.show();
    };
    var hideHelp = () => {
        helpCanvas.hide();
    };
    document.body.appendChild(helpCanvas);
    const doFunc = ({e, _mode}) => {
        console.log({e, _mode});
        for ( let i = 0; i < KEYUP_DEF[_mode].keys.length; i++ ) {
            let def = KEYUP_DEF[_mode].keys[i];
            if ( e.key == def.key2 ) {
                if ( def.key1 == "Ctrl" && !e.ctrlKey ) continue;
                if ( def.key1 == "Alt" && !e.altKey ) continue;
                if ( def.targetElement ) {
                    if ( e.target.nodeName?.toLowerCase() != def.targetElement.toLowerCase() ) continue;
                }

                def.func(e);
                break;
            }
        }
    }
    document.addEventListener("keyup", (e) => {
        doFunc({e, _mode: document.mode??"normal"});
    });

})();
