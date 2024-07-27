
function handle_success(q, answers) {
    let t = '<div class="correct">correct</div>';
    t += '<div></div>';
    t += `<div class="answers">correct: ${answers}</div>`
    let correct = create_inactive(t);
    q.appendChild(create_prompt(""));
    q.appendChild(correct);
    add_question();
}

function handle_error(q, giveup, answers) {
    let t = '<div class="incorrect">incorrect</div>';
    if (giveup) {
        t += '<div></div>';
        t += `<div class="answers">correct: ${answers}</div>`
    }

    let incorrect = create_inactive(t);

    q.appendChild(create_prompt(""));
    q.appendChild(incorrect);
    if (!giveup) {
        q.appendChild(create_prompt(">> " ));
        let tofocus = create_active()
        q.appendChild(tofocus);
        tofocus.focus();
    }
    else {
        add_question();
    }
}

function keydown(ele) {
    if (event.key == 'Enter') {
        // prevent <br> from appearing due to RETURN press.
        event.preventDefault();

        let q = ele.closest(".onequestion");
        let current = JSON.parse(q.getAttribute("current"));
        let guess = ele.innerText.trim().toLowerCase();

        let correct = current['answers'].includes(guess);
        let giveup = guess == "";

        ele.setAttribute("contenteditable", false);

        let tallied = q.getAttribute("tallied");
        if (correct) {
            handle_success(q, current['answers_accented']);
            if (!tallied) {
                update_stats(true);
            }
        }
        else {
            handle_error(q, giveup, current['answers_accented']);
            let tallied = q.getAttribute("tallied");
            if (!tallied) {
                q.setAttribute("tallied", true);
                update_stats(false,
                    current["word_accented"],
                    current["plur"] + "," + current["case"]);
            }
        }

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
        }

        cse  = rchoice(Object.keys(nouns[word]["accented"]));
        anim = nouns[word]["animate"];
        gender = nouns[word]["gender"];
        plur = rchoice(Object.keys(nouns[word]["accented"][cse]));
        if (nouns[word]["accented"][cse][plur].length == 0) {
            const tmp = {'singular' : 'plural', 'plural' : 'singular'};
            plur = tmp[plur];
        }


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
        'word' : word,
        'answers' : nouns[word][cse][plur],
        'word_accented' : word_accented,
        'answers_accented' : answers_accented,
        'case' : cse,
        'gender' : gender,
        'plur' : plur,
        'anim' : anim,
        'attrs' : nouns[word]['declension_attributes'],
    }
}

function add_question(first) {
    term = document.querySelector("#term");

    if (!first) {
        let hr = create_inactive("<div><hr></div>".repeat(3));
        term.appendChild(hr);
    }

    let current = get_one(nouns);

    let q = document.createElement("div");
    q.classList.add("onequestion");
    q.setAttribute('current', JSON.stringify(current));

    let url = `https://en.wiktionary.org/wiki/${current["word"]}#Russian`;
    let plur = current["plur"];
    let cse = current["case"];
    let d1 = `<div class="${plur}">${plur}</div>`;
    let d2 = `<div class="${cse}">${cse}</div>`;
    let d3 = `<div>[${current["attrs"]}]</div>`;
    let d4 = `<div class="word">
                <a href=${url} target="_blank">${current['word_accented']}</a>
              </div>`;
    let d5 = "<div></div>"
    let t = d4 + d5 + d3 + d1 + d2;

    q.appendChild(create_prompt("Q:"));
    q.appendChild(create_inactive(t));

    q.appendChild(create_prompt(">> " ));
    tofocus = create_active();
    q.appendChild(tofocus);

    term.appendChild(q);
    tofocus.focus();
}

function create_active(focus) {
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

function init_stats() {
    let stats = document.querySelector("#stats");
    stats.setAttribute("total", 0);
    stats.setAttribute("correct", 0);
    stats.setAttribute("word_errors", "{}");
    stats.setAttribute("case_errors", "{}");
    let tmp = "Press [return] on an empty line for answer.<br><br><br>";
    tmp += "0 / 0";
    stats.innerHTML = tmp
}

function update_stats(correct, word, cse) {
    let stats = document.querySelector("#stats");
    let tmp = parseInt(stats.getAttribute("total")) + 1;
    stats.setAttribute("total", tmp);
    if (correct) {
        tmp = parseInt(stats.getAttribute("correct")) + 1;
        stats.setAttribute("correct", tmp);
    }
    else {
        let word_errors = JSON.parse(stats.getAttribute("word_errors"));
        if (word in word_errors) {
            word_errors[word] += 1;
        }
        else {
            word_errors[word] = 1;
        }
        stats.setAttribute('word_errors', JSON.stringify(word_errors));

        let case_errors = JSON.parse(stats.getAttribute("case_errors"));
        if (cse in case_errors) {
            case_errors[cse] += 1;
        }
        else {
            case_errors[cse] = 1;
        }
        stats.setAttribute('case_errors', JSON.stringify(case_errors));
    }
    let word_errors = JSON.parse(stats.getAttribute("word_errors"));
    let case_errors = JSON.parse(stats.getAttribute("case_errors"));

    tmp = "Press [return] on an empty line to see answer.<br><br><br>"
    tmp += `${stats.getAttribute("correct")} / ${stats.getAttribute("total")}`;
    tmp += "<br><br>Words:<br>";
    for (const [k,v] of Object.entries(word_errors)) {
        tmp += `${k} : ${v}<br>`
    }
    tmp += "<br>Cases:<br>";
    for (const [k,v] of Object.entries(case_errors)) {
        tmp += `${k} : ${v}<br>`
    }
    stats.innerHTML = tmp;

}

function init() {
    add_question(true);
    init_stats();
}

window.addEventListener("load", (e) => {init();});
