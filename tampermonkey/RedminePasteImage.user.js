// ==UserScript==
// @name         Redmine Paste Image
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
    const pasteHandler = function(e){
        var items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type === "text/plain") {
                e.preventDefault();
                textPasteHandler(e);
            }
        }
    };
    const textPasteHandler = function(e){
        const isTableFormat = function(s){
            // タブで区切ると全行が同じ長さになること
            var lenSet = new Set();
            var lines = s.replace(/[\r\n]+$/, "").split(/\r\n|\r|\n/);
            if ( lines.length <= 1 ) return false;
            lines.forEach((line, i) => {
                lenSet.add(line.split("\t").length);
            });
            if ( lenSet.size != 1 ) return false;
            if ( lenSet.has(1) ) return false;
            return true;
        };
        const insText = function(src, target) {
            var st = target.selectionStart;
            var ed = target.selectionEnd;
            target.value = target.value.substring(0, st) + src + target.value.substring(ed);
            var src_len = src.replace(/\r\n/g, "\n").length;
            target.setSelectionRange(st + src_len, st + src_len);
        };
        const strCount = function(str) {
            let hanLen = String(str).match(/[\x01-\x7E\uFF65-\uFF9F]/g)?.length;
            return str.length + str.length - (hanLen??0);
        }
        const createTableMarkdown = function(s) {
            var result = [];
            var colLen = [];
            var pad = (str, cnt, pad) => {
                let len = strCount(str);
                if ( len >= cnt ) return pad+str+pad;
                return pad + str + pad.repeat(cnt - len + 1);
            };
            s.split(/\r\n|\r|\n/).forEach(line=>{
                line.split("\t").forEach((col, i) => {
                    let len = strCount(col);
                    if ( colLen.length <= i ) colLen[i] = len;
                    else colLen[i] = Math.max(colLen[i], len);
                });
            });
            s.split(/\r\n|\r|\n/).forEach((line, i)=>{
                result.push("|" + line.split("\t").map((col, j) => {
                    let len = col.length + (col.length - strCount(col));
                    return pad(col, colLen[j], " ");
                }).join("|") + "|");
                if ( i == 0 ) result.push("|" + colLen.map((i) => pad("", i, "-")).join("|") + "|");
            });
            return result.join("\r\n");
        };
        if ( e.target.tagName.toLowerCase() != "textarea" ) return;
        var items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type === "text/plain") {
                items[i].getAsString((s) => {
                    if ( isTableFormat(s) ) {
                        var text = createTableMarkdown(s.replace(/[\r\n]+$/, ""));
                        insText(text, e.target);
                    } else {
                        console.log("not table");
                        insText(s, e.target);
                    }
                });
            }
        }
    };
    // 新しい Redmine で画像貼り付けをサポートしたので、この function はもう使わない
    const imagePasteHandler = function(e){
        if( typeof(addFile) != "function" ) return;
        const getPastedBlob = function(e) {
            var blob = undefined;
            var items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (var i = 0; i < items.length; i++) {
                console.log("type = " + items[i].type);
                if (items[i].type.indexOf("image") === 0) {
                    blob = items[i].getAsFile();
                    e.preventDefault();
                    break;
                }
            }
            return blob;
        }
        const dateStr = function() {
            var n2 = function(n) { return !isNaN(n) && n < 10 ? "0" + n : "" + n; };
            var d = new Date();
            return d.getFullYear() + n2(d.getMonth() + 1) + n2(d.getDate())
                + "_" + n2(d.getHours()) + n2(d.getMinutes()) + n2(d.getSeconds())
                + "_" + ("000" + d.getMilliseconds()).substr(-3);
        }
        const insFileName = function(filename, target) {
            var st = target.selectionStart;
            var ed = target.selectionEnd;
            var fileWiki = "![](" + filename + ")";
            target.value = target.value.substring(0, st) + fileWiki + target.value.substring(ed);
            target.setSelectionRange(st + fileWiki.length, st + fileWiki.length);
        }
        const createImg = function(blob, alt) {
            var img = document.createElement("img");
            var reader = new FileReader();
            reader.onload = function() {
                img.src = reader.result;
            }
            reader.readAsDataURL(blob);
            img.onclick = function() {
                if ( this.getAttribute("ume.expand") ) {
                    img.style.height = "20px";
                    img.title = "クリックして拡大";
                    this.removeAttribute("ume.expand", false );
                } else {
                    img.style.height = "";
                    img.title = "クリックして縮小";
                    this.setAttribute("ume.expand", true );
                }
            }
            Object.assign(img.style, {
                height: "20px",
                display: "block",
                cursor: "pointer"
            });
            img.alt = alt;
            img.title = "クリックして拡大";
            return img;
        }
        var blob = getPastedBlob(e);
        if ( blob === undefined ) return;
        if ( blob ) {
            var filename = "image_" + dateStr() + ".png";
            var file = new File([blob], filename, {type: blob.type});
            addFile(document.querySelector("input[type=file][name='attachments[dummy][file]']"), file, true); // どのページも name 値は同じ？
            if ( e.target.tagName.toLowerCase() == "textarea" ) {
                insFileName(filename, e.target);
            }
            var img = createImg(blob);
            document.querySelector("span.attachments_fields")?.appendChild(img);
        }
    };

    document.querySelector("textarea#issue_notes.wiki-edit")?.addEventListener("paste", pasteHandler);
    document.querySelector("textarea#issue_description.wiki-edit")?.addEventListener("paste", pasteHandler);
    document.querySelector("textarea#content_text.wiki-edit")?.addEventListener("paste", pasteHandler);
})();
