// ==================== إعداد المسار ====================
const MODEL_URL = "./"; // النموذج والصوت في نفس المجلد
const audioFiles = {
  "door": "door.mp3",
  "chair": "chair.mp3",
  "table": "table.mp3",
  "stair": "stair.mp3",
  "unknown": "door.mp3"
};

let model, video, running = false;

// ==================== تحميل النموذج ====================
async function init() {
  const modelURL = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";
  model = await tmImage.load(modelURL, metadataURL);
  document.getElementById("status").innerText = "جاهز. اضغط 'ابدأ التعرف' لبدء.";

  // تشغيل الكاميرا
  video = document.getElementById("video");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
  } catch (err) {
    alert("⚠️ لم يتم السماح بالوصول إلى الكاميرا.");
    console.error(err);
  }

  // بدء التكرار
  requestAnimationFrame(loop);
}

async function loop() {
  if (running) {
    await predict();
  }
  requestAnimationFrame(loop);
}

// ==================== التعرف ====================
async function predict() {
  if (!model || !video) return;

  const prediction = await model.predict(video);
  let top = prediction[0];
  for (let i = 1; i < prediction.length; i++) {
    if (prediction[i].probability > top.probability) top = prediction[i];
  }

  const label = top.className;
  const prob = top.probability;

  if (prob > 0.7) {
    document.getElementById("status").innerText = `تم التعرف: ${label} (${(prob * 100).toFixed(0)}%)`;
    playAudioFor(label);
    running = false;
    document.getElementById("startBtn").innerText = "ابدأ التعرف";
  }
}

// ==================== الأصوات ====================
function playAudioFor(label) {
  const file = audioFiles[label] || audioFiles["unknown"];
  const audio = new Audio(file);
  audio.play();
}

// ==================== زر التشغيل ====================
document.getElementById("startBtn").addEventListener("click", () => {
  running = !running;
  document.getElementById("startBtn").innerText = running ? "إيقاف" : "ابدأ التعرف";
  document.getElementById("status").innerText = running ? "التعرف جارٍ..." : "متوقف";
});

// تشغيل عند الفتح
init().catch(e => {
  console.error(e);
  document.getElementById("status").innerText = "❌ حدث خطأ أثناء تحميل النموذج.";
});
