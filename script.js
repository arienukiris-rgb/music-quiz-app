// ==========================================
// 音楽クイズ アプリ本体
// ==========================================

// 1回のプレイで出題する問題数（ジャンルの問題プールがこれより少ない場合は全問出題）
const QUESTIONS_PER_ROUND = 10;

// --- アプリの状態を1箇所にまとめておく ---
const state = {
  genreKey: null,       // 選択中のジャンルキー（例: "rock"）
  questions: [],         // 出題する問題の配列（順番はシャッフル済み）
  currentIndex: 0,       // 今何問目か
  score: 0,              // 正解数
  currentChoices: [],    // 今の問題のシャッフルされた選択肢
  correctAnswerText: "", // 今の問題の正解のテキスト
  answered: false         // 今の問題にすでに解答したか
};

// --- 画面要素の参照をまとめて取得 ---
const screens = {
  genre: document.getElementById("screen-genre"),
  quiz: document.getElementById("screen-quiz"),
  result: document.getElementById("screen-result")
};

const genreListEl = document.getElementById("genre-list");
const quizGenreNameEl = document.getElementById("quiz-genre-name");
const quizProgressEl = document.getElementById("quiz-progress");
const quizScoreEl = document.getElementById("quiz-score");
const questionTextEl = document.getElementById("question-text");
const choiceListEl = document.getElementById("choice-list");
const feedbackEl = document.getElementById("feedback");
const btnNext = document.getElementById("btn-next");
const resultScoreEl = document.getElementById("result-score");
const resultMessageEl = document.getElementById("result-message");
const btnRetry = document.getElementById("btn-retry");
const btnBackGenre = document.getElementById("btn-back-genre");
const shareXEl = document.getElementById("share-x");
const shareLineEl = document.getElementById("share-line");

// --- 画面の切り替え ---
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
  document.body.dataset.screen = name; // 画面ごとに背景を変えるための目印
}

// --- 配列をシャッフルするユーティリティ（元の配列は壊さない） ---
function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// --- ジャンル選択ボタンを描画 ---
function renderGenreList() {
  genreListEl.innerHTML = "";
  Object.entries(QUIZ_DATA).forEach(([key, genre]) => {
    const btn = document.createElement("button");
    btn.className = "genre-btn";
    btn.innerHTML = `<span class="genre-emoji">${genre.emoji}</span><span>${genre.name}</span>`;
    btn.addEventListener("click", () => startQuiz(key));
    genreListEl.appendChild(btn);
  });
}

// --- クイズ開始 ---
function startQuiz(genreKey) {
  const genre = QUIZ_DATA[genreKey];
  state.genreKey = genreKey;
  state.questions = shuffleArray(genre.questions).slice(0, QUESTIONS_PER_ROUND);
  state.currentIndex = 0;
  state.score = 0;

  quizGenreNameEl.textContent = `${genre.emoji} ${genre.name}`;
  showScreen("quiz");
  renderQuestion();
}

// --- 現在の問題を描画 ---
function renderQuestion() {
  state.answered = false;
  feedbackEl.classList.add("hidden");
  btnNext.classList.add("hidden");

  const total = state.questions.length;
  const q = state.questions[state.currentIndex];

  quizProgressEl.textContent = `第${state.currentIndex + 1}問 / 全${total}問`;
  quizScoreEl.textContent = `正解数: ${state.score}`;
  questionTextEl.textContent = q.question;

  state.correctAnswerText = q.choices[q.answerIndex];
  state.currentChoices = shuffleArray(q.choices);

  choiceListEl.innerHTML = "";
  state.currentChoices.forEach(choiceText => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choiceText;
    btn.addEventListener("click", () => handleChoice(btn, choiceText));
    choiceListEl.appendChild(btn);
  });
}

// --- 選択肢をクリックしたときの処理 ---
function handleChoice(clickedBtn, choiceText) {
  if (state.answered) return; // 二重回答防止
  state.answered = true;

  const isCorrect = choiceText === state.correctAnswerText;
  if (isCorrect) state.score++;

  // 全ボタンを操作不可にしつつ、正解・不正解の色分け
  const allButtons = choiceListEl.querySelectorAll(".choice-btn");
  allButtons.forEach(btn => {
    btn.disabled = true;
    if (btn.textContent === state.correctAnswerText) {
      btn.classList.add("correct");
    } else if (btn === clickedBtn) {
      btn.classList.add("incorrect");
    }
  });

  feedbackEl.textContent = isCorrect ? "🎉 正解！" : "😢 不正解…";
  feedbackEl.classList.remove("hidden");
  feedbackEl.classList.toggle("feedback-correct", isCorrect);
  feedbackEl.classList.toggle("feedback-incorrect", !isCorrect);

  quizScoreEl.textContent = `正解数: ${state.score}`;

  // 最後の問題なら「採点へ」、それ以外は「次の問題へ」とボタンの文言を変える
  const isLastQuestion = state.currentIndex === state.questions.length - 1;
  btnNext.textContent = isLastQuestion ? "採点へ →" : "次の問題へ →";
  btnNext.classList.remove("hidden");
}

// --- 次の問題へ ---
btnNext.addEventListener("click", () => {
  state.currentIndex++;
  if (state.currentIndex < state.questions.length) {
    renderQuestion();
  } else {
    showResult();
  }
});

// --- 結果画面 ---
function showResult() {
  const total = state.questions.length;
  resultScoreEl.textContent = `${state.score} / ${total} 問正解`;

  const rate = state.score / total;
  let message;
  if (rate === 1) message = "パーフェクト！すごい！🏆";
  else if (rate >= 0.7) message = "なかなかの音楽通ですね！🎶";
  else if (rate >= 0.4) message = "もう少し！もう一度挑戦してみよう。";
  else message = "このジャンル、これから詳しくなろう！";
  resultMessageEl.textContent = message;

  // SNSシェア用のリンクを組み立てる
  const genre = QUIZ_DATA[state.genreKey];
  const shareText = `🎵音楽クイズ「${genre.name}」で ${state.score}/${total} 問正解しました！`;
  const shareUrl = location.href.split("#")[0];
  shareXEl.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=%E9%9F%B3%E6%A5%BD%E3%82%AF%E3%82%A4%E3%82%BA`;
  shareLineEl.href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  showScreen("result");
}

btnRetry.addEventListener("click", () => startQuiz(state.genreKey));
btnBackGenre.addEventListener("click", () => showScreen("genre"));

// --- 初期化 ---
renderGenreList();
showScreen("genre");
