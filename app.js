const MODEL_URL = "./";

const audioFiles = {
  "door": "door.mp3",
  "Door": "door.mp3",
  "chair": "chair.mp3",
  "Chair": "chair.mp3",
  "table": "table.mp3",
  "Table": "table.mp3",
  "stair": "stair.mp3",
  "Stair": "stair.mp3",
  "stairs": "stair.mp3",
  "Stairs": "stair.mp3",
  "unknown": "door.mp3"
};

let model, video, running = true;
let lastLabel = "", confirmedLabel = "", stableCount = 0;
let firstPredictionDone = false;
let soundEnabled = true; // 🔊 مفعّل افتراضيًا

async function init() {
  const modelURL = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";
  model = await tmImage.load(modelURL, metadataURL);

  document.getElementById("status").innerText = "يتم تهيئة الكاميرا...";

  video = document.getElementById("video");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    video.srcObject = stream;
    await video.play();
    document.getElementById("status").innerText = "التعرف جارٍ...";
  } catch (err) {
    alert("⚠️ لم يتم السماح بالوصول إلى الكاميرا.");
    console.error(err);
  }

  requestAnimationFrame(loop);
}

async function loop() {
  if (running && model && video.readyState === 4) await predict();
  requestAnimationFrame(loop);
}

async function predict() {
  const prediction = await model.predict(video);
  let top = prediction[0];
  for (let i = 1; i < prediction.length; i++) {
    if (prediction[i].probability > top.probability) top = prediction[i];
  }

  const label = top.className;
  const prob = top.probability;

  if (prob > 0.88) {
    if (label === lastLabel) {
      stableCount++;
      if (stableCount >= 2 && label !== confirmedLabel) {
        confirmedLabel = label;
        firstPredictionDone = true;
        document.getElementById("status").innerText =
          `تم التعرف: ${label} (${(prob * 100).toFixed(0)}%)`;
        playAudioFor(label);
        colorFeedback(label);
        flashEffect();
      }
    } else {
      stableCount = 0;
      lastLabel = label;
    }
  } else if (prob < 0.6 && firstPredictionDone) {
    document.getElementById("status").innerText = "جارٍ البحث...";
  }
}

function playAudioFor(label) {
  if (!soundEnabled) return; // 🔇 في حال تم كتم الصوت
  const file = audioFiles[label] || audioFiles["unknown"];
  const audio = new Audio(file);
  audio.play();

  if (label === "door" || label === "stair") {
    if (navigator.vibrate) navigator.vibrate(400);
  }
}

function colorFeedback(label) {
  if (label === "door") document.body.style.background = "#ffcccc";
  else if (label === "stair") document.body.style.background = "#fff2cc";
  else if (label === "chair") document.body.style.background = "#ccffcc";
  else if (label === "table") document.body.style.background = "#cce5ff";
  else document.body.style.background = "#f6f8fa";
}

function flashEffect() {
  document.body.animate([{ opacity: 0.8 }, { opacity: 1 }], { duration: 250 });
}

// 🔊 زر التحكم في الصوت
document.getElementById("soundToggle").addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("soundToggle");
  btn.textContent = soundEnabled ? "🔊" : "🔇";
  btn.title = soundEnabled ? "الصوت مفعّل" : "الصوت مغلق";
});

// 🕒 الساعة
setInterval(() => {
  const now = new Date();
  document.getElementById("clock").innerText =
    now.toLocaleTimeString("ar-AE", { hour: "2-digit", minute: "2-digit" }) +
    " — " +
    now.toLocaleDateString("ar-AE");
}, 1000);

init().catch(e => {
  console.error(e);
  document.getElementById("status").innerText =
    "❌ حدث خطأ أثناء تحميل النموذج.";
});
