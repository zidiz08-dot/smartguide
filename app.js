const MODEL_URL = "./";
const audioFiles = {
  "door": "door.mp3",
  "chair": "chair.mp3",
  "stair": "stair.mp3",
};

let model, video, running = false;

async function init() {
  const modelURL = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";
  model = await tmImage.load(modelURL, metadataURL);

  document.getElementById("status").innerText = "جاهز. اضغط 'ابدأ التعرف' لبدء.";

  // ✅ تشغيل الكاميرا وإظهارها
  video = document.getElementById("video");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" } // استخدام الكاميرا الخلفية إن وجدت
    });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    alert("⚠️ لم يتم السماح بالوصول إلى الكاميرا أو حدث خطأ.");
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

  if (prob > 0.7) {
    document.getElementById("status").innerText =
      `تم التعرف: ${label} (${(prob * 100).toFixed(0)}%)`;
    playAudioFor(label);
    running = false;
    document.getElementById("startBtn").innerText = "ابدأ التعرف";
  }
}

function playAudioFor(label) {
  const file = audioFiles[label] || audioFiles["unknown"];
  const audio = new Audio(file);
  audio.play();
}

document.getElementById("startBtn").addEventListener("click", () => {
  running = !running;
  document.getElementById("startBtn").innerText = running ? "إيقاف" : "ابدأ التعرف";
  document.getElementById("status").innerText = running
    ? "التعرف جارٍ..."
    : "متوقف.";
});

init().catch(e => {
  console.error(e);
  document.getElementById("status").innerText =
    "❌ حدث خطأ أثناء تحميل النموذج.";
});
