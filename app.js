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
let lastLabel = "";

async function init() {
  const modelURL = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";
  model = await tmImage.load(modelURL, metadataURL);

  document.getElementById("status").innerText =
    "جاهز. اضغط 'ابدأ التعرف' لبدء.";

  video = document.getElementById("video");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    alert("⚠️ لم يتم السماح بالوصول إلى الكاميرا.");
    console.error(err);
  }

  requestAnimationFrame(loop);
}

async function loop() {
  if (running) await predict();
  requestAnimationFrame(loop);
}

async function predict() {
  if (!model || !video) return;
  const prediction = await model.predict(video);
  let top = prediction[0];
  for (let i = 1; i < prediction.length; i++) {
    if (prediction[i].probability > top.probability) top = prediction[i];
  }

  const label = top.className;
  const prob = top.probability;

  if (prob > 0.75 && label !== lastLabel) {
    lastLabel = label;
    document.getElementById("status").innerText =
      `تم التعرف: ${label} (${(prob * 100).toFixed(0)}%)`;
    playAudioFor(label);
    colorFeedback(label);
  }
}

function playAudioFor(label) {
  const file = audioFiles[label] || audioFiles["unknown"];
  const audio = new Audio(file);
  audio.play();

  // ✅ اهتزاز لأصحاب الهمم عند الخطر
  if (label === "door" || label === "stair") {
    if (navigator.vibrate) navigator.vibrate(400);
  }
}

// ✅ تغيير لون الخلفية حسب النوع
function colorFeedback(label) {
  if (label === "door") document.body.style.background = "#ffcccc";
  else if (label === "stair") document.body.style.background = "#fff2cc";
  else if (label === "chair") document.body.style.background = "#ccffcc";
  else if (label === "table") document.body.style.background = "#cce5ff";
  else document.body.style.background = "#f6f8fa";
}

// ✅ زر التشغيل/الإيقاف
document.getElementById("startBtn").addEventListener("click", () => {
  running = !running;
  document.getElementById("startBtn").innerText = running ? "إيقاف" : "ابدأ التعرف";
  document.getElementById("status").innerText = running
    ? "التعرف جارٍ..."
    : "تم الإيقاف.";
});

init().catch(e => {
  console.error(e);
  document.getElementById("status").innerText =
    "❌ حدث خطأ أثناء تحميل النموذج.";
});
