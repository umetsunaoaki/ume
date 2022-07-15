// ==UserScript==
// @name         Redmine title
// @namespace    https://works.freemind.co.jp/redmine/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://works.freemind.co.jp/redmine/*
// @match        https://works.freemind.co.jp/pub-redmine/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...

    // タイトル
    /** ヘッダ部分にタイトルを表示 */
    if ( document.querySelector("div.subject h3") ) {
        var div = document.createElement("div");
        div.id="tm_util_container";
        let contStyle={
            position: "fixed",
            top: "0",
            width: "450px",
            left: "calc(50% - 450px / 2)",
            backgroundColor: "white",
            zIndex: 3,
        };
        Object.assign(div.style, contStyle);
        var divTitle = document.createElement("div");
        divTitle.id="tm_util_title";
        let titleStyle = {
            borderStyle: "solid",
            borderWidth: "1px",
            borderColor: "gray",
            paddingLeft: "2px",
            userSelect: "all",
            overflowX: "hidden",
            whiteSpace: "nowrap",
        };
        Object.assign(divTitle.style, titleStyle);
        divTitle.innerHTML = document.getElementsByTagName("h2")[0]?.innerText + ": " + document.querySelector("div.subject h3")?.innerText;

        div.appendChild(divTitle);
        document.body.appendChild(div);
    }

})();