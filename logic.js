function dofocus(r) {
    t = r.querySelector(".active-line");
    t.focus();

    // https://stackoverflow.com/a/69727327
    sel = window.getSelection();
    sel.selectAllChildren(t);
    sel.collapseToEnd();
}


function keydown(ele) {
    if (event.key == 'Enter') {
        // prevent <br> from appearing due to RETURN press.
        event.preventDefault();

        oldprompt = ele.closest(".prompt-line");

        var rsp = document.createElement("div");
        rsp.classList.add("response-line")
        var content = document.createTextNode(ele.textContent)
        rsp.appendChild(content);


        ele.after(rsp);
        ele.setAttribute("contenteditable", false);

        var newprompt = document.createElement("div");
        newprompt.classList.add("prompt-line");
        newprompt.setAttribute("onclick", "dofocus(this)");

        var pr = document.createElement("span");
        pr.classList.add("prompt")
        pr.textContent = "> "

        var active = document.createElement("span");
        active.classList.add("active-line");
        active.setAttribute("contenteditable", true);
        active.setAttribute("onkeydown", "keydown(this)");
        active.innerHTML = "";
        active.replaceChildren();   // get rid of <br> nodes...
        console.log(active)

        newprompt.appendChild(pr);
        newprompt.appendChild(active);

        oldprompt.after(newprompt);

        active.focus();
    }
}

function rchoice(a) {
    if (a.length == 0) {
        throw new Error("Empty choice.");
    }
    return a[Math.floor(a.length * Math.random())];
}

function get_one(nouns, word) {
    for (i = 0; i < 20; i += 1) {
        if (i > 13) {
            throw new Error("No answers after multiple tries: ", word);
        }

        if (word == null) {
            word = rchoice(Object.keys(nouns));
            console.log("word: ", word);
        }

        cse  = rchoice(Object.keys(nouns[word]["accented"]));
        anim = nouns[word]["animate"];
        gender = nouns[word]["gender"];
        plur = rchoice(Object.keys(nouns[word]["accented"][cse]));
        if (nouns[word]["accented"][cse][plur].length == 0) {
            const tmp = {'singular' : 'plural', 'plural' : 'singular'};
            plur = tmp[plur];
        }

        console.log(cse, anim, gender, plur);

        answers = nouns[word][cse][plur];
        if (answers.length > 0) {
            break;
        }
    }

    word_accented = nouns[word]['accented']['nominative']['singular']
    if (word_accented.length == 0) {
        // some words are pl only
        word_accented = nouns[word]['accented']['nominative']['plural']
    }
    word_accented = word_accented[0];
    answers_accented = nouns[word]['accented'][cse][plur];

    return {
        'word_accented' : word_accented,
        'answers_accented' : answers_accented,
        'case' : cse,
        'gender' : gender,
        'plur' : plur,
        'anim' : anim,
        'attrs' : nouns[word]['declension_attributes'],
    }
}
/*
            <div class="onequestion" onclick="dofocus(this)">
                <div class="prompt">&gt; </div>
                <div class="active-line"
                      contenteditable="false"
                      autofocus="true"
                      onkeydown="keydown(this)">
                    Press &lt;return&gt; to start.
                </div>
            </div>
*/

function add_question(ele) {
    let current = get_one(nouns);

    let q = document.createElement("div");
    q.classList.add("onequestion");
    q.setAttribute('current', JSON.stringify(current));

    let plur = current["plur"];
    let cse = current["case"];
    let d1 = `<div class="${plur}">${plur}</div>`;
    let d2 = `<div class="${cse}">${cse}</div>`;
    let d3 = `<div>${current["attrs"]}</div>`;
    let d4 = `<div>${current['word_accented']}</div>`;
    let t = d1 + d2 + d3 + d4;

    q.appendChild(create_prompt("Q:"));
    q.appendChild(create_inactive(t));

    q.appendChild(create_prompt(">> " ));
    q.appendChild(create_active());

    ele.appendChild(q);
}

function create_active() {
    let active = document.createElement("div");
    active.classList.add("active-line");
    active.setAttribute("contenteditable", true);
    active.setAttribute("onkeydown", "keydown(this)");
    return active;
}

function create_inactive(text) {
    let inactive = document.createElement("div");
    inactive.classList.add("inactive-line");
    inactive.setAttribute("contenteditable", false);
    inactive.innerHTML = text;
    return inactive;
}

function create_prompt(text) {
    let p = document.createElement("div");
    p.classList.add("prompt");
    p.textContent = text + " "
    return p;
}

function init() {
    //current = get_one(nouns) 
    term = document.querySelector("#term");
    add_question(term);
    console.log("DONE");
}

window.addEventListener("load", (e) => {init();});
