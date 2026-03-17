import { scenes } from "./scenes.js";

const table = document.getElementById("table");
const frameCaption = document.getElementById("frame-caption");
const sceneTitle = document.getElementById("scene-title");
const coachText = document.getElementById("coach-text");
const quizQuestion = document.getElementById("quiz-question");
const quizAnswers = document.getElementById("quiz-answers");
const quizFeedback = document.getElementById("quiz-feedback");
const xpValue = document.getElementById("xp-value");
const streakValue = document.getElementById("streak-value");

const state = {
  sceneIndex: 0,
  frameIndex: 0,
  xp: 0,
  streak: 0,
  answered: false
};

const ballNodes = new Map();

function createTableBase() {
  table.innerHTML = `
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f7a83b" />
      </marker>
    </defs>
    <rect x="20" y="20" width="960" height="460" rx="12" fill="#246d43" stroke="#1a3d2c" stroke-width="3" />
    <g id="overlays"></g>
    <g id="balls"></g>
  `;
}

function ensureBalls(scene) {
  const ballsGroup = table.querySelector("#balls");
  ballsGroup.innerHTML = "";
  ballNodes.clear();

  for (const ball of scene.balls) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("class", "ball");
    c.setAttribute("r", "18");
    c.setAttribute("cx", ball.x);
    c.setAttribute("cy", ball.y);
    c.setAttribute("fill", ball.color);
    c.setAttribute("stroke", "#111");
    c.setAttribute("stroke-width", "2");

    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.textContent = ball.label;
    t.setAttribute("x", ball.x);
    t.setAttribute("y", ball.y + 5);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-size", "12");
    t.setAttribute("font-weight", "700");
    t.setAttribute("fill", ball.id === "cue" ? "#222" : "#fff");

    g.append(c, t);
    ballsGroup.appendChild(g);
    ballNodes.set(ball.id, { circle: c, text: t });
  }
}

function drawOverlays(frame) {
  const overlaysGroup = table.querySelector("#overlays");
  overlaysGroup.innerHTML = "";

  for (const overlay of frame.overlays || []) {
    if (overlay.type === "line") {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "overlay");
      line.setAttribute("x1", overlay.from[0]);
      line.setAttribute("y1", overlay.from[1]);
      line.setAttribute("x2", overlay.to[0]);
      line.setAttribute("y2", overlay.to[1]);
      line.setAttribute("stroke", overlay.color || "#f7a83b");
      line.setAttribute("stroke-width", "4");
      if (overlay.dash) line.setAttribute("stroke-dasharray", overlay.dash);
      line.setAttribute("marker-end", "url(#arrow)");
      overlaysGroup.appendChild(line);
    }

    if (overlay.type === "zone") {
      const zone = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      zone.setAttribute("class", "overlay");
      zone.setAttribute("cx", overlay.at[0]);
      zone.setAttribute("cy", overlay.at[1]);
      zone.setAttribute("r", overlay.radius);
      zone.setAttribute("fill", "none");
      zone.setAttribute("stroke", overlay.color || "#35c48f");
      zone.setAttribute("stroke-width", "4");
      zone.setAttribute("stroke-dasharray", "8 6");
      overlaysGroup.appendChild(zone);
    }
  }
}

function renderFrame() {
  const scene = scenes[state.sceneIndex];
  const frame = scene.frames[state.frameIndex];

  sceneTitle.textContent = scene.title;
  coachText.textContent = scene.coachText;
  frameCaption.textContent = frame.caption;

  for (const [ballId, [x, y]] of Object.entries(frame.positions)) {
    const node = ballNodes.get(ballId);
    if (!node) continue;
    node.circle.setAttribute("cx", x);
    node.circle.setAttribute("cy", y);
    node.text.setAttribute("x", x);
    node.text.setAttribute("y", y + 5);
  }

  drawOverlays(frame);
}

function renderQuiz() {
  const scene = scenes[state.sceneIndex];
  quizQuestion.textContent = scene.quiz.question;
  quizAnswers.innerHTML = "";
  quizFeedback.textContent = "";
  state.answered = false;

  for (const answer of scene.quiz.answers) {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.textContent = answer.text;

    btn.addEventListener("click", () => {
      if (state.answered) return;
      state.answered = true;

      if (answer.correct) {
        btn.classList.add("correct");
        state.xp += 20;
        state.streak += 1;
        quizFeedback.textContent = `✅ Dobrze! ${scene.quiz.explanation}`;
      } else {
        btn.classList.add("wrong");
        state.streak = 0;
        quizFeedback.textContent = `❌ Nie tym razem. ${scene.quiz.explanation}`;
      }

      xpValue.textContent = String(state.xp);
      streakValue.textContent = String(state.streak);
    });

    quizAnswers.appendChild(btn);
  }
}

function loadScene(index) {
  state.sceneIndex = (index + scenes.length) % scenes.length;
  state.frameIndex = 0;
  createTableBase();
  ensureBalls(scenes[state.sceneIndex]);
  renderFrame();
  renderQuiz();
}

async function playScene() {
  const scene = scenes[state.sceneIndex];
  for (let i = 0; i < scene.frames.length; i += 1) {
    state.frameIndex = i;
    renderFrame();
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
}

document.getElementById("prev-frame").addEventListener("click", () => {
  const scene = scenes[state.sceneIndex];
  state.frameIndex = (state.frameIndex - 1 + scene.frames.length) % scene.frames.length;
  renderFrame();
});

document.getElementById("next-frame").addEventListener("click", () => {
  const scene = scenes[state.sceneIndex];
  state.frameIndex = (state.frameIndex + 1) % scene.frames.length;
  renderFrame();
});

document.getElementById("play-scene").addEventListener("click", playScene);
document.getElementById("next-scene").addEventListener("click", () => loadScene(state.sceneIndex + 1));

loadScene(0);
