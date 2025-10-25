const MODEL_URL = "./"; // النموذج في نفس المجلد
const audioFiles = {
  "door": "door.mp3",
  "chair": "chair.mp3",
  "table": "table.mp3",
  "stair": "stair.mp3", // ← تأكد الاسم مطابق لما يظهر في النص
  "unknown": "door.mp3"
};
let model, webcam, maxPredictions;

async function init() {
  const modelURL = MODEL_URL + "model.json";
  const metadataURL = MODEL_URL + "metadata.json";
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  const flip = true;
  webcam = new tmImage.Webcam(640, 480, flip);
  await webcam.setup();
  await webcam.play();
  window.requestAnimationFrame(loop);

  // ✅ هذا هو السطر المعدّل الذي يجعل الفيديو يظهر فعلياً
  document.getElementById("video").srcObject = webcam.stream;

  document.getElementById("status").innerText = "جاهز. اضغط 'ابدأ التعرف' لبدء.";

}

async function loop() {
  webcam.update();
  if (running) await predict();
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
  } else {
    document.getElementById("status").innerText = "لم تتأكد النتيجة. قرب الكاميرا أكثر.";
  }
}

function playAudioFor(label) {
  const file = audioFiles[label] || audioFiles["unknown"];
  const audio = new Audio(file);
  audio.play();
}

init().catch(e => {
  console.error(e);
  document.getElementById("status").innerText = "حدث خطأ أثناء تحميل النموذج. تأكد من المسار.";
});






