// ضع هنا رابط مجلد نموذج Teachable Machine (مثال: "https://<username>.github.io/repo/tm-model/")
const MODEL_URL = "./tm-model/"; // لو رفعت النموذج في نفس المجلد (اختبار محلي)
const audioFiles = {
  "door": "audio/door.mp3",
  "chair": "audio/chair.mp3",
  "table": "audio/table.mp3",
  "stairs": "audio/stairs.mp3",
  "unknown": "audio/unknown.mp3"
};

let model, webcam, maxPredictions;

async function init() {
  const modelURL = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  const flip = true; // عند استخدام الكاميرا الأمامية
  webcam = new tmImage.Webcam(640, 480, flip);
  await webcam.setup();
  await webcam.play();
  window.requestAnimationFrame(loop);
  document.getElementById("video").srcObject = webcam.webcam.video;
  document.getElementById("status").innerText = "جاهز. اضغط 'ابدأ التعرف' لبدء.";
}

async function loop(timestamp) {
  webcam.update();
  if (running) {
    await predict();
  }
  window.requestAnimationFrame(loop);
}

let running = false;
document.getElementById("startBtn").addEventListener("click", () => {
  running = !running;
  document.getElementById("startBtn").innerText = running ? "إيقاف" : "ابدأ التعرف";
  document.getElementById("status").innerText = running ? "التعرف جارٍ..." : "متوقف";
});

async function predict() {
  const prediction = await model.predict(webcam.canvas);
  // إيجاد أعلى فئة احتمالية
  let top = prediction[0];
  for (let i=1; i<prediction.length; i++){
    if (prediction[i].probability > top.probability) top = prediction[i];
  }
  const label = top.className;
  const prob = top.probability;
  // عتبة ثقة
  if (prob > 0.70) {
    document.getElementById("status").innerText = `تم التعرف: ${label} (${(prob*100).toFixed(0)}%)`;
    playAudioFor(label);
    // نمنع التشغيل المتكرر السريع
    running = false;
    document.getElementById("startBtn").innerText = "ابدأ التعرف";
  } else {
    document.getElementById("status").innerText = "لم تتأكد النتيجة. قرب الكاميرا أكثر.";
  }
}

function playAudioFor(label) {
  const file = audioFiles[label] || audioFiles["unknown"];
  const audio = new Audio(file);
  audio.play();
}

// بدء التحميل
init().catch(e => {
  console.error(e);
  document.getElementById("status").innerText = "حدث خطأ أثناء تحميل النموذج. تأكد من مسار MODEL_URL.";
});
