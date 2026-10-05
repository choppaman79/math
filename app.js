const MODES = [
  { id:'visual', icon:'👀', name:'みてたし算', desc:'キャラクターを数えて答えよう' },
  { id:'number', icon:'🔢', name:'すうじでたし算', desc:'数字だけでじっくり練習' },
  { id:'make10', icon:'🔟', name:'10をつくろう', desc:'10になる組み合わせを覚えよう' },
  { id:'story', icon:'📖', name:'おはなし算数', desc:'短いお話を読んで答えよう' },
  { id:'timed', icon:'⏱️', name:'タイムアタック', desc:'60秒で何問できるかな？' },
  { id:'auto', icon:'✨', name:'おまかせ練習', desc:'年齢と成績に合わせて自動出題' },
];

const state = {
  age: Number(localStorage.getItem('addition_age') || 5),
  mode: 'visual',
  qIndex: 0,
  total: 10,
  correct: 0,
  streak: Number(localStorage.getItem('addition_streak') || 0),
  stars: Number(localStorage.getItem('addition_stars') || 0),
  current: null,
  locked: false,
  timer: 60,
  timerId: null,
};

const $ = (s) => document.querySelector(s);
const homeScreen = $('#homeScreen'), gameScreen = $('#gameScreen'), resultScreen = $('#resultScreen');
const starsEl = $('#stars'), streakEl = $('#streak');
const ageButtons = $('#ageButtons'), modeGrid = $('#modeGrid');
const visualArea = $('#visualArea'), equation = $('#equation'), answerArea = $('#answerArea');
const instruction = $('#instruction'), feedback = $('#feedback'), nextBtn = $('#nextBtn');
const progressText = $('#progressText'), gameModeLabel = $('#gameModeLabel'), timerBox = $('#timerBox');

function init(){
  renderAges(); renderModes(); renderStats();
  $('#backBtn').onclick = goHome;
  $('#homeBtn').onclick = goHome;
  $('#retryBtn').onclick = () => startMode(state.mode);
  nextBtn.onclick = nextQuestion;
  $('#resetProgressBtn').onclick = () => {
    if(confirm('きろくをリセットしますか？')){
      state.stars=0; state.streak=0; localStorage.setItem('addition_stars','0'); localStorage.setItem('addition_streak','0'); renderStats();
    }
  };
}
function renderAges(){
  ageButtons.innerHTML='';
  for(let a=3;a<=9;a++){
    const b=document.createElement('button'); b.className='age-btn'+(state.age===a?' active':''); b.textContent=`${a}さい`;
    b.onclick=()=>{state.age=a; localStorage.setItem('addition_age',String(a)); renderAges();}; ageButtons.appendChild(b);
  }
}
function renderModes(){
  modeGrid.innerHTML='';
  MODES.forEach(m=>{const b=document.createElement('button'); b.className='mode-card'; b.innerHTML=`<div class="mode-icon">${m.icon}</div><div class="mode-name">${m.name}</div><div class="mode-desc">${m.desc}</div>`; b.onclick=()=>startMode(m.id); modeGrid.appendChild(b);});
}
function show(screen){[homeScreen,gameScreen,resultScreen].forEach(x=>x.classList.remove('active')); screen.classList.add('active');}
function startMode(mode){
  clearInterval(state.timerId); state.mode=mode; state.qIndex=0; state.correct=0; state.locked=false; state.total=mode==='timed'?999:10; state.timer=60;
  gameModeLabel.textContent=MODES.find(x=>x.id===mode).name; timerBox.classList.toggle('hidden',mode!=='timed');
  if(mode==='timed'){timerBox.textContent='60'; state.timerId=setInterval(()=>{state.timer--; timerBox.textContent=state.timer; if(state.timer<=0)finishGame();},1000)}
  show(gameScreen); nextQuestion(true);
}
function goHome(){clearInterval(state.timerId); show(homeScreen)}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function shuffle(arr){return [...arr].sort(()=>Math.random()-.5)}
function limits(){
  if(state.age<=3) return {maxA:3,maxB:2,maxSum:5};
  if(state.age===4) return {maxA:5,maxB:5,maxSum:10};
  if(state.age===5) return {maxA:7,maxB:7,maxSum:10};
  if(state.age===6) return {maxA:10,maxB:10,maxSum:20};
  if(state.age===7) return {maxA:20,maxB:15,maxSum:30};
  if(state.age===8) return {maxA:50,maxB:30,maxSum:80};
  return {maxA:70,maxB:50,maxSum:100};
}
function makePair(){
  const L=limits(); let a,b; do{a=rand(1,L.maxA); b=rand(1,L.maxB)}while(a+b>L.maxSum); return {a,b,answer:a+b};
}
function generateQuestion(){
  let mode=state.mode;
  if(mode==='auto') mode = state.age<=4 ? ['visual','visual','number'][rand(0,2)] : state.age<=6 ? ['visual','number','make10','story'][rand(0,3)] : ['number','story','timed'][rand(0,2)];
  if(mode==='make10') { const a=rand(1,9); return {type:'make10',a,b:10-a,answer:10-a}; }
  if(mode==='story'){ const p=makePair(); const subjects=['りんご','どんぐり','ふうせん','おもちゃ','ひよこ']; const s=subjects[rand(0,subjects.length-1)]; return {type:'story',...p,subject:s}; }
  const p=makePair(); return {type:mode==='visual'?'visual':'number',...p};
}
function nextQuestion(first=false){
  if(!first) state.qIndex++;
  if(state.mode!=='timed' && state.qIndex>=state.total){finishGame();return}
  state.current=generateQuestion(); state.locked=false; feedback.textContent=''; feedback.className='feedback'; nextBtn.classList.add('hidden');
  renderQuestion();
  progressText.textContent=state.mode==='timed'?`${state.correct}もん せいかい`:`${state.qIndex+1} / ${state.total}`;
}
function renderQuestion(){
  const q=state.current; visualArea.innerHTML=''; equation.innerHTML=''; answerArea.innerHTML='';
  if(q.type==='visual'){
    instruction.textContent='ぜんぶで いくつ？';
    visualArea.appendChild(makeGroup(q.a)); const plus=document.createElement('div'); plus.className='plus-sign'; plus.textContent='＋'; visualArea.appendChild(plus); visualArea.appendChild(makeGroup(q.b));
    equation.textContent=`${q.a} ＋ ${q.b} ＝ ?`; renderChoices(q.answer);
  } else if(q.type==='number'){
    instruction.textContent='こたえを えらぼう'; equation.textContent=`${q.a} ＋ ${q.b} ＝ ?`; renderChoices(q.answer);
  } else if(q.type==='make10'){
    instruction.textContent='10にするには あといくつ？';
    const frame=document.createElement('div'); frame.className='ten-frame'; for(let i=0;i<10;i++){const d=document.createElement('div'); d.className='dot'+(i<q.a?'':' empty'); frame.appendChild(d)} visualArea.appendChild(frame);
    equation.textContent=`${q.a} ＋ ? ＝ 10`; renderChoices(q.answer);
  } else if(q.type==='story'){
    instruction.textContent='おはなしを よんでみよう'; const box=document.createElement('div'); box.className='story-box'; box.textContent=`${q.subject}が ${q.a}こ ありました。あとから ${q.b}こ ふえました。ぜんぶで いくつ？`; visualArea.appendChild(box); equation.textContent=`${q.a} ＋ ${q.b} ＝ ?`; renderChoices(q.answer);
  }
}
function makeGroup(n){const g=document.createElement('div'); g.className='group'; for(let i=0;i<n;i++){const m=document.createElement('div'); m.className='mini-mascot'; g.appendChild(m)} return g;}
function renderChoices(answer){
  let vals=new Set([answer]); const spread=state.age<=5?2:5; while(vals.size<3){const v=Math.max(0,answer+rand(-spread,spread)); vals.add(v)}
  shuffle([...vals]).forEach(v=>{const b=document.createElement('button');b.className='answer-btn';b.textContent=v;b.onclick=()=>check(v);answerArea.appendChild(b)});
}
function check(v){
  if(state.locked) return; state.locked=true;
  const ok=v===state.current.answer; if(ok){state.correct++; state.streak++; state.stars+=2; feedback.textContent='せいかい！ 🌟'; feedback.className='feedback good'; beep(true)} else {state.streak=0; feedback.textContent=`おしい！ こたえは ${state.current.answer}`; feedback.className='feedback bad'; beep(false)}
  localStorage.setItem('addition_streak',String(state.streak)); localStorage.setItem('addition_stars',String(state.stars)); renderStats();
  if(state.mode==='timed'){setTimeout(()=>{state.qIndex++; nextQuestion(true)},450)} else nextBtn.classList.remove('hidden');
}
function finishGame(){
  clearInterval(state.timerId); show(resultScreen); $('#resultCorrect').textContent=state.correct;
  const rate=state.mode==='timed'?null:state.correct/state.total;
  $('#resultTitle').textContent=state.mode==='timed'?'タイムアップ！':rate>=.9?'すごい！':rate>=.7?'よくできました！':'またやってみよう！';
  $('#resultMessage').textContent=state.mode==='timed'?`60びょうで ${state.correct}もん せいかい！`: `${state.total}もん中 ${state.correct}もん正解でした。`;
}
function renderStats(){starsEl.textContent=state.stars; streakEl.textContent=state.streak}
function beep(good){
  try{const C=window.AudioContext||window.webkitAudioContext;const c=new C();const o=c.createOscillator();const g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=good?660:220;g.gain.value=.06;o.start();o.stop(c.currentTime+.12)}catch(e){}
}
init();
