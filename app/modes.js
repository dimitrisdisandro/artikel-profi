'use strict';
/*
 * Übungsmodi von «Artikel-Profi».
 * Ein Modus bekommt (task, ui) und meldet das Ergebnis mit ui.done(ok, given).
 * Statistik, Zähler, Abzeichen und «Weiter» übernimmt der Kern.
 */
const Cloze = {
  build(task, typed) {
    const root = el('div', 'cloze');
    if (task.before) root.appendChild(el('span', 'cz-text', task.before));

    let blank;
    if (typed) {
      blank = el('input', 'cz-input');
      blank.type = 'text';
      blank.autocomplete = 'off';
      blank.spellcheck = false;
      blank.setAttribute('autocapitalize', 'off');
      blank.setAttribute('autocorrect', 'off');
      blank.setAttribute('aria-label', 'Artikel');
    } else {
      blank = el('span', 'cz-blank', '\u00A0');
    }
    root.appendChild(blank);

    // Nomen und Satzzeichen bleiben zusammen (kein Leerraum vor dem Punkt)
    const tail = el('span', 'cz-tail');
    const noun = el('span', 'cz-noun', task.noun);
    tail.appendChild(noun);
    const rest = task.after.indexOf(task.noun) === 0 ? task.after.slice(task.noun.length) : task.after;
    if (rest) tail.appendChild(document.createTextNode(rest));
    root.appendChild(tail);
    return { root: root, blank: blank, noun: noun };
  },

  // Lücke füllen; das Nomen bekommt erst jetzt die Farbe seines Geschlechts
  reveal(c, task, ok) {
    const shown = task.before ? task.answer : task.answer.charAt(0).toUpperCase() + task.answer.slice(1);
    const filled = el('span', 'cz-filled ' + (ok ? 'ok' : 'bad'), shown);
    c.root.replaceChild(filled, c.blank);
    c.noun.classList.add('g-' + task.gender);
  }
};

function normalizeAnswer(s) {
  return String(s || '').trim().toLowerCase();
}

const Modes = [
  {
    id: 'choose',
    label: 'Auswählen',
    title: 'Welcher Artikel passt?',
    sub: 'Tippe auf den richtigen Artikel.',
    render(task, ui) {
      const sentence = Cloze.build(task, false);
      ui.body.appendChild(sentence.root);

      const grid = el('div', 'opt-grid');
      let finished = false;
      task.options.forEach((opt) => {
        const b = el('button', 'opt-btn', opt);
        b.type = 'button';
        b.onclick = () => {
          if (finished) return;
          finished = true;
          const ok = opt === task.answer;
          Cloze.reveal(sentence, task, ok);
          grid.querySelectorAll('button').forEach((x) => {
            x.disabled = true;
            if (x.textContent === task.answer) x.classList.add('correct');
            else if (x === b) x.classList.add('wrong');
          });
          ui.done(ok, opt);
        };
        grid.appendChild(b);
      });
      ui.body.appendChild(grid);
      ui.row.appendChild(ui.hintButton());
    }
  },
  {
    id: 'type',
    label: 'Eintippen',
    title: 'Schreibe den Artikel',
    sub: 'Tippe den fehlenden Artikel in die Lücke.',
    render(task, ui) {
      const sentence = Cloze.build(task, true);
      ui.body.appendChild(sentence.root);
      const input = sentence.blank;
      let finished = false;

      const check = el('button', 'btn btn-primary', 'Prüfen');
      check.type = 'button';
      const run = () => {
        if (finished) return;
        const given = normalizeAnswer(input.value);
        if (!given) { input.focus(); return; }
        finished = true;
        const ok = given === normalizeAnswer(task.answer);
        Cloze.reveal(sentence, task, ok);
        ui.done(ok, given);
      };
      check.onclick = run;
      input.onkeydown = (e) => { if (e.key === 'Enter') run(); };

      ui.row.appendChild(ui.hintButton());
      ui.row.appendChild(check);
      setTimeout(() => { try { input.focus(); } catch (e) { /* ignorieren */ } }, 60);
    }
  }
];
