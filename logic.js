function tabclick(e) {
    document.querySelectorAll(".tab").forEach((t) => {
        t.style.backgroundColor = "white";
    });
    document.querySelectorAll(".term").forEach((t) => {
        t.style.display = "none";
    });
    document.querySelectorAll(".stats").forEach((t) => {
        t.style.display = "none";
    });

    let term = null;
    let stats = null;
    if (e.id == "noun_tab") {
        term  = document.querySelector("#noun_term");
        stats = document.querySelector("#noun_stats");
    }
    else if (e.id == "verb_tab") {
        term  = document.querySelector("#verb_term");
        stats = document.querySelector("#verb_stats");
    }
    term.style.display = "block";
    stats.style.display = "block";
    e.style.backgroundColor = "linen";
}

function handle_success(q, answers, fn) {
    let t = '<div class="correct">correct</div>';
    t += '<div></div>';
    t += `<div class="answers">correct: ${answers}</div>`
    let correct = create_inactive(t);
    q.appendChild(create_prompt(""));
    q.appendChild(correct);
    fn();
}

function handle_error(q, giveup, answers, fn) {
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
        fn();
    }
}

function keydown(ele) {
    if (event.key == 'Enter') {
        // prevent <br> from appearing due to RETURN press.
        event.preventDefault();

        term = ele.closest(".term");
        let fn = null;
        let stats = null;
        if (term.id == "noun_term") {
            fn = add_noun_question;
            stats = document.querySelector("#noun_stats");
        }
        else if (term.id == "verb_term") {
            fn = add_verb_question;
            stats = document.querySelector("#verb_stats");
        }

        let q = ele.closest(".onequestion");
        let current = JSON.parse(q.getAttribute("current"));
        let guess = ele.innerText.trim().toLowerCase().replace(/s+/, ' ');

        let correct = null;
        let giveup = guess == "";
        correct = current['answers'].includes(guess);
        correct &&= !giveup;

        ele.setAttribute("contenteditable", false);

        let tallied = q.getAttribute("tallied");
        if (correct) {
            handle_success(q, current['answers_accented'], fn);
            if (!tallied) {
                update_stats(stats, true);
            }
        }
        else {
            handle_error(q, giveup, current['answers_accented'], fn);
            let tallied = q.getAttribute("tallied");
            if (!tallied) {
                q.setAttribute("tallied", true);
                let k1 = null;
                let k2 = null;
                if ("tense" in current && "subj" in current) {
                    k1 = "tense";
                    k2 = "subj";
                }
                else if ("case" in current && "plur" in current){
                    k1 = "case";
                    k2 = "plur";
                }
                else {
                    console.log("Error getting error data.", current)
                }
                update_stats(stats, false,
                    current["word_accented"],
                    current[k1] + "," + current[k2]);
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

function weighted_choice(a, weights) {
    //console.log('weighted_choice', a, weights)
    if (a.length == 0) {
        throw new Error("Empty choice.");
    }
    if (a.length != weights.length) {
        throw new Error("Different number of weights and choices");
    }
    let tot = 0;
    let i;
    for (i = 0; i < weights.length; i += 1) { tot += weights[i] }
    let rnd = Math.random();
    for (i = 0; i < weights.length; i += 1) {
        let tmp = weights[i] / tot;
        if (rnd <= tmp) { return a[i]; }
        else { rnd -= tmp; }
    }
    throw new Error("Unreachable");
}

function get_noun(nouns, word) {
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

function get_verb(v, word) {
    let tense = null;
    let subj = null;
    let anwser = null;
    for (i = 0; i < 100; i += 1) {
        if (i > 70) {
            throw new Error("No answers after multiple tries: ", word);
        }

        if (word == null) {
            word = rchoice(Object.keys(v));
        }


        let weights = new Array();
        let j;
        let keys = Object.keys(v[word]["accented"]);
        for (j = 0; j < keys.length; j += 1) {
            let tmpkey = keys[j];
            if (tmpkey == "infinitive") {weights.push(0); continue;}
            weights.push(Object.keys(v[word]["accented"][tmpkey]).length);
            //console.log(weights);
        }
        
        //console.log(word, Object.keys(v[word]['accented']), weights);
        tense = weighted_choice(Object.keys(v[word]["accented"]), weights);

        //console.log(word, tense, Object.keys(v[word]["accented"][tense]));
        subj = rchoice(Object.keys(v[word]["accented"][tense]));

        answer = v[word][tense][subj];
        if (answer != null) {
            // some things have nulls when that form isn't used/is missing.
            break; 
        }
        //console.log('no answer', word, tense, subj, answer);
    }

    //let word_accented = v[word]['accented']['nominative']['singular']
    // TODO
    let word_accented = v[word]['accented']['infinitive'];

    return {
        'word' : word,
        'word_accented' : word_accented,
        'subj' : subj,
        'tense' : tense,
        'answers' : answer,
        'answers_accented' : v[word]['accented'][tense][subj],
        'attrs' : v[word]['attrs'],
    }
}

function add_verb_question(first) {
    term = document.querySelector("#verb_term");

    if (!first) {
        let hr = create_inactive("<div><hr></div>".repeat(3));
        term.appendChild(hr);
    }

    let current = get_verb(verbs);

    let q = document.createElement("div");
    q.classList.add("onequestion");
    q.setAttribute('current', JSON.stringify(current));

    let url = `https://en.wiktionary.org/wiki/${current["word"]}#Russian`;
    let tense = current["tense"];
    let subj = current["subj"];
    let d1 = `<div class="${tense}">${tense}</div>`;
    let d2 = `<div>${subj}</div>`;
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

function add_noun_question(first) {
    term = document.querySelector("#noun_term");

    if (!first) {
        let hr = create_inactive("<div><hr></div>".repeat(3));
        term.appendChild(hr);
    }

    let current = get_noun(nouns);

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
    var i;
    let ids = ['noun_stats', 'verb_stats'];
    for (i = 0;  i < ids.length; i += 1) {
        let id = ids[i];
        let stats = document.querySelector("#" + id);
        stats.setAttribute("total", 0);
        stats.setAttribute("correct", 0);
        stats.setAttribute("word_errors", "{}");
        stats.setAttribute("case_errors", "{}");
        let tmp = "Press [return] on an empty line for answer.<br><br><br>";
        tmp += "0 / 0";
        stats.innerHTML = tmp;
    }
}

function update_stats(stats, correct, word, cse) {
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
    tmp += "<br>Cases/Tenses:<br>";
    for (const [k,v] of Object.entries(case_errors)) {
        tmp += `${k} : ${v}<br>`
    }
    stats.innerHTML = tmp;

}

function init() {
    add_noun_question(true);
    add_verb_question(true);
    init_stats();
}

window.addEventListener("load", (e) => {init();});
