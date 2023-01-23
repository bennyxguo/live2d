/*
 * Live2D Widget
 * https://github.com/stevenjoezhang/live2d-widget
 */

let firstEnter = true;
let startTime = Date.now();
let AUDIO_CONFIG = {
  audioPath: '',
  messagePath: ''
};

function loadWidget(config) {
  let { waifuPath, apiPath, cdnPath, audioPath, messagePath } = config;
  let useCDN = false,
    modelList;

  if (typeof cdnPath === 'string') {
    useCDN = true;
    if (!cdnPath.endsWith('/')) cdnPath += '/';
  } else if (typeof apiPath === 'string') {
    if (!apiPath.endsWith('/')) apiPath += '/';
  } else {
    console.error('Invalid initWidget argument!');
    return;
  }

  if (typeof audioPath !== 'string' || typeof messagePath !== 'string') {
    console.error('Invalid initWidget argument!');
    return;
  }

  AUDIO_CONFIG = {
    audioPath: audioPath,
    messagePath: messagePath
  };

  localStorage.removeItem('waifu-display');
  sessionStorage.removeItem('waifu-text');
  document.body.insertAdjacentHTML(
    'beforeend',
    `<div id="waifu">
			<div id="waifu-tips"></div>
			<canvas id="live2d" width="800" height="800"></canvas>
			<div id="waifu-tool">
				<span class="fa fa-lg fa-comment"></span>
				<span class="fa fa-lg fa-paper-plane"></span>
				<span class="fa fa-lg fa-user-circle"></span>
				<span class="fa fa-lg fa-street-view"></span>
				<span class="fa fa-lg fa-camera-retro"></span>
				<span class="fa fa-lg fa-info-circle"></span>
				<span class="fa fa-lg fa-times"></span>
			</div>
		</div>`
  );
  // https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element
  setTimeout(() => {
    document.getElementById('waifu').style.bottom = 0;
  }, 0);

  function randomSelection(obj, requireIndex = false) {
    const index = Math.floor(Math.random() * obj.length);
    const result = Array.isArray(obj) ? obj[index] : obj;
    if (requireIndex) {
      return {
        result: result,
        index: index
      };
    }
    return result;
  }

  // 检测用户活动状态，并在空闲时显示消息
  let userAction = false,
    userActionTimer,
    messageTimer,
    messageArray = [
      '喜欢主人的，<span>关注一下他吧</span> <3',
      'QQ群里面有“<span>模组清单</span>”哦～',
      '祝大家“<span>新年快乐</span>”～',
      '我是你们钻姐! <3',
      // 'playAudio',
      'showTime'
      // 'welcomeMessage',
      // 'showHitokoto',
    ];

  window.addEventListener('mousemove', () => (userAction = true));
  window.addEventListener('keydown', () => (userAction = true));

  userActionTimer = setInterval(() => {
    // 如果是主页
    showMessage(randomSelection(messageArray), 6000, 9);
  }, 30000);

  setInterval(() => {
    requestAnimationFrame(simulateMouseMove);
  }, 30000);

  let lastX = 0,
    lastY = 0,
    moves = 0,
    maxMoves = 3,
    index = 0;

  function simulateMouseMove(a) {
    const noiseX = (noise.simplex3(2, 0, a * 0.0005) + 1) / 2;
    const noiseY = (noise.simplex3(10, 0, a * 0.0005) + 1) / 2;
    const x = Math.ceil(noiseX * innerWidth);
    const y = Math.ceil(noiseY * innerHeight);

    const distToX = x - lastX;
    const distToY = y - lastY;
    const directionX = distToX < 0 ? -1 : 1;
    const directionY = distToY < 0 ? -1 : 1;

    let randomSpeed = Math.random() * (16 - 8) + 8;

    while (lastX != x && lastY != y) {
      lastX = lastX + directionX;
      lastY = lastY + directionY;
      index++;
      moveMouse(lastX, lastY, index, randomSpeed);
    }

    moves++;
    if (moves < maxMoves) {
      requestAnimationFrame(simulateMouseMove);
    } else {
      moves = 0;
      index = 0;
    }
  }

  function moveMouse(x, y, index) {
    setTimeout(() => {
      document.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: x,
          clientY: y,
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
    }, 16 * index);
  }

  (function registerEventListener() {
    document.querySelector('#waifu-tool .fa-comment').addEventListener('click', showHitokoto);
    document.querySelector('#waifu-tool .fa-paper-plane').addEventListener('click', () => {
      if (window.Asteroids) {
        if (!window.ASTEROIDSPLAYERS) window.ASTEROIDSPLAYERS = [];
        window.ASTEROIDSPLAYERS.push(new Asteroids());
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/stevenjoezhang/asteroids/asteroids.js';
        document.head.appendChild(script);
      }
    });
    document.querySelector('#waifu-tool .fa-user-circle').addEventListener('click', loadOtherModel);
    document.querySelector('#waifu-tool .fa-street-view').addEventListener('click', loadRandModel);
    document.querySelector('#waifu-tool .fa-camera-retro').addEventListener('click', () => {
      showMessage('照好了嘛，是不是很可爱呢？', 6000, 9);
      Live2D.captureName = 'photo.png';
      Live2D.captureFrame = true;
    });
    document.querySelector('#waifu-tool .fa-info-circle').addEventListener('click', () => {
      open('https://github.com/stevenjoezhang/live2d-widget');
    });
    document.querySelector('#waifu-tool .fa-times').addEventListener('click', () => {
      localStorage.setItem('waifu-display', Date.now());
      showMessage('愿你有一天能与重要的人重逢。', 2000, 11);
      document.getElementById('waifu').style.bottom = '-500px';
      setTimeout(() => {
        document.getElementById('waifu').style.display = 'none';
        document.getElementById('waifu-toggle').classList.add('waifu-toggle-active');
      }, 3000);
    });
    const devtools = () => {};
    console.log('%c', devtools);
    devtools.toString = () => {
      showMessage('哈哈，你打开了控制台，是想要看看我的小秘密吗？', 6000, 9);
    };
    window.addEventListener('copy', () => {
      showMessage('你都复制了些什么呀，转载要记得加上出处哦！', 6000, 9);
    });
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) showMessage('哇，你终于回来了～', 6000, 9);
    });
  })();

  function welcomeMessage() {
    let text;
    if (!firstEnter) {
      // 如果是主页
      const now = new Date().getHours();
      if (now >= 5 && now <= 7) text = '早上好！一日之计在于晨，美好的一天就要开始了。';
      else if (now > 7 && now <= 11) text = '上午好！工作顺利嘛，不要久坐，多起来走动走动哦！';
      else if (now > 11 && now <= 13) text = '中午了，工作了一个上午，现在是午餐时间！';
      else if (now > 13 && now <= 17) text = '午后很容易犯困呢，今天的运动目标完成了吗？';
      else if (now > 17 && now <= 19) text = '傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红～';
      else if (now > 19 && now <= 21) text = '晚上好，今天过得怎么样？';
      else if (now > 21 && now <= 23)
        text = ['已经这么晚了呀，早点休息吧，晚安～', '深夜时要爱护眼睛呀！'];
      else text = '你是夜猫子呀？这么晚还不睡觉，明天起的来嘛？';
    } else if (document.referrer !== '') {
      const referrer = new URL(document.referrer),
        domain = referrer.hostname.split('.')[1];
      if (location.hostname === referrer.hostname)
        text = `欢迎来到<span>「${document.title.split(' - ')[0]}」</span>`;
      else if (domain === 'baidu')
        text = `Hello！来自 百度搜索 的朋友<br>你是搜索 <span>${
          referrer.search.split('&wd=')[1].split('&')[0]
        }</span> 找到的我吗？`;
      else if (domain === 'so')
        text = `Hello！来自 360搜索 的朋友<br>你是搜索 <span>${
          referrer.search.split('&q=')[1].split('&')[0]
        }</span> 找到的我吗？`;
      else if (domain === 'google')
        text = `Hello！来自 谷歌搜索 的朋友<br>欢迎阅读<span>「${
          document.title.split(' - ')[0]
        }」</span>`;
      else text = `Hello！来自 <span>${referrer.hostname}</span> 的朋友`;

      firstEnter = false;
    } else {
      text = `欢迎来到<span>「${document.title.split(' - ')[0]}」</span>`;
      firstEnter = false;
    }
    showMessage(text, 7000, 8);
  }

  function showHitokoto() {
    // 增加 hitokoto.cn 的 API
    fetch('https://v1.hitokoto.cn')
      .then((response) => response.json())
      .then((result) => {
        showMessage(result.hitokoto, 6000, 9);
      });
  }

  function playAudio() {
    if (!AUDIO_CONFIG) return;

    const { audioPath, messagePath } = AUDIO_CONFIG;
    const playChoice = randomSelection([('greetings', 'randoms')]);

    function greetingTime() {
      const now = new Date().getHours();
      if (now >= 5 && now <= 11) return '5_11';
      else if (now > 11 && now <= 14) return '11_14';
      else if (now >= 17 && now <= 21) return '17_21';
      else if (now > 21 || now < 5) return '21_5';
      else return 'other';
    }

    fetch(messagePath)
      .then((response) => response.json())
      .then((result) => {
        let text = '';
        let audio = null;

        const timeIndex = greetingTime();
        if (playChoice === 'greetings' && result.greetings.texts[timeIndex]) {
          const outputChoice = randomSelection(result.greetings.texts[timeIndex], true);
          text = outputChoice.result;
          audio = new Audio(
            `${audioPath}${result.greetings.voices[timeIndex][outputChoice.index]}`
          );
        } else {
          const outputChoice = randomSelection(result.texts, true);
          text = outputChoice.result;
          audio = new Audio(`${audioPath}${result.voices[outputChoice.index]}`);
        }

        if (text && audio) {
          setTimeout(function () {
            showMessage(text, 9000, 9);
          }, 200);
          audio.play();
        }
      });
  }

  function showTime() {
    const duration = (Date.now() - startTime) / 1000;
    const hours = Math.floor(duration / 3600) % 24;
    const minutes = Math.floor(duration / 60) % 60;
    const startFrom = new Date(startTime).toLocaleTimeString('zh-CN');
    const text = `掐指一算，主人已直播了 <span>${hours}</span> 个小时，<span>${minutes}</span> 分钟咯。辛苦啦！～`;
    showMessage(text, 9000, 8);
  }

  function showMessage(text, timeout, priority) {
    if (
      !text ||
      (sessionStorage.getItem('waifu-text') && sessionStorage.getItem('waifu-text') > priority)
    )
      return;

    if (messageTimer) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }

    if (text === 'showTime') {
      showTime();
      return;
    }

    if (text === 'showHitokoto') {
      showHitokoto();
      return;
    }

    if (text === 'welcomeMessage') {
      welcomeMessage();
      return;
    }

    if (text === 'playAudio') {
      playAudio();
      return;
    }

    text = randomSelection(text);
    sessionStorage.setItem('waifu-text', priority);
    const tips = document.getElementById('waifu-tips');
    tips.innerHTML = text;
    tips.classList.add('waifu-tips-active');
    messageTimer = setTimeout(() => {
      sessionStorage.removeItem('waifu-text');
      tips.classList.remove('waifu-tips-active');
    }, timeout);
  }

  function setInitialModel() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const modelId = urlParams.get('modelId');
    const modelTexturesId = urlParams.get('modelTexturesId');

    if (modelId) localStorage.setItem('modelId', modelId);
    if (modelTexturesId) localStorage.setItem('modelTexturesId', modelTexturesId);

    const setStartTime = urlParams.get('startTime');
    const currentDate = new Date(startTime);

    if (setStartTime)
      startTime = Date.parse(
        `${currentDate.getFullYear()}-${
          currentDate.getMonth() + 1
        }-${currentDate.getDate()} ${setStartTime}`
      );
  }

  (function initModel() {
    setInitialModel();
    let modelId = localStorage.getItem('modelId'),
      modelTexturesId = localStorage.getItem('modelTexturesId');
    if (modelId === null) {
      // 首次访问加载 指定模型 的 指定材质
      modelId = 6; // 模型 ID
      modelTexturesId = 10; // 材质 ID
    }
    loadModel(modelId, modelTexturesId);
    fetch(waifuPath)
      .then((response) => response.json())
      .then((result) => {
        window.addEventListener('mouseover', (event) => {
          for (let { selector, text } of result.mouseover) {
            if (!event.target.matches(selector)) continue;
            text = randomSelection(text);
            text = text.replace('{text}', event.target.innerText);
            showMessage(text, 4000, 8);
            return;
          }
        });
        window.addEventListener('click', (event) => {
          for (let { selector, text } of result.click) {
            if (!event.target.matches(selector)) continue;
            text = randomSelection(text);
            text = text.replace('{text}', event.target.innerText);
            showMessage(text, 4000, 8);
            return;
          }
        });
        result.seasons.forEach(({ date, text }) => {
          const now = new Date(),
            after = date.split('-')[0],
            before = date.split('-')[1] || after;
          if (
            after.split('/')[0] <= now.getMonth() + 1 &&
            now.getMonth() + 1 <= before.split('/')[0] &&
            after.split('/')[1] <= now.getDate() &&
            now.getDate() <= before.split('/')[1]
          ) {
            text = randomSelection(text);
            text = text.replace('{year}', now.getFullYear());
            //showMessage(text, 7000, true);
            messageArray.push(text);
          }
        });
        welcomeMessage();
      });
  })();

  async function loadModelList() {
    const response = await fetch(`${cdnPath}model_list.json`);
    modelList = await response.json();
  }

  async function loadModel(modelId, modelTexturesId, message) {
    localStorage.setItem('modelId', modelId);
    localStorage.setItem('modelTexturesId', modelTexturesId);
    console.log('modelId', modelId, 'modelTexturesId', modelTexturesId);
    showMessage(message, 4000, 10);
    if (useCDN) {
      if (!modelList) await loadModelList();
      const target = randomSelection(modelList.models[modelId]);
      // loadlive2d('live2d', `${cdnPath}model/${target}/index.json`);
      loadlive2d('live2d', `${cdnPath}get/?id=${modelId}-${modelTexturesId}`);
    } else {
      loadlive2d('live2d', `${apiPath}get/?id=${modelId}-${modelTexturesId}`);
      console.log(`Live2D 模型 ${modelId}-${modelTexturesId} 加载完成`);
    }
  }

  async function loadRandModel() {
    const modelId = localStorage.getItem('modelId'),
      modelTexturesId = localStorage.getItem('modelTexturesId');
    if (useCDN) {
      if (!modelList) await loadModelList();
      const target = randomSelection(modelList.models[modelId]);
      loadlive2d('live2d', `${cdnPath}model/${target}/index.json`);
      showMessage('我的新衣服好看嘛？', 4000, 10);
    } else {
      // 可选 "rand"(随机), "switch"(顺序)
      fetch(`${apiPath}rand_textures/?id=${modelId}-${modelTexturesId}`)
        .then((response) => response.json())
        .then((result) => {
          if (result.textures.id === 1 && (modelTexturesId === 1 || modelTexturesId === 0))
            showMessage('我还没有其他衣服呢！', 4000, 10);
          else loadModel(modelId, result.textures.id, '我的新衣服好看嘛？');
        });
    }
  }

  async function loadOtherModel() {
    let modelId = localStorage.getItem('modelId');
    if (useCDN) {
      if (!modelList) await loadModelList();
      const index = ++modelId >= modelList.models.length ? 0 : modelId;
      loadModel(index, 0, modelList.messages[index]);
    } else {
      fetch(`${apiPath}switch/?id=${modelId}`)
        .then((response) => response.json())
        .then((result) => {
          loadModel(result.model.id, 0, result.model.message);
        });
    }
  }
}

function initWidget(config, apiPath) {
  if (typeof config === 'string') {
    config = {
      waifuPath: config,
      apiPath
    };
  }
  document.body.insertAdjacentHTML(
    'beforeend',
    `<div id="waifu-toggle">
			<span>看板娘</span>
		</div>`
  );
  const toggle = document.getElementById('waifu-toggle');
  toggle.addEventListener('click', () => {
    toggle.classList.remove('waifu-toggle-active');
    if (toggle.getAttribute('first-time')) {
      loadWidget(config);
      toggle.removeAttribute('first-time');
    } else {
      localStorage.removeItem('waifu-display');
      document.getElementById('waifu').style.display = '';
      setTimeout(() => {
        document.getElementById('waifu').style.bottom = 0;
      }, 0);
    }
  });
  if (
    localStorage.getItem('waifu-display') &&
    Date.now() - localStorage.getItem('waifu-display') <= 86400000
  ) {
    toggle.setAttribute('first-time', true);
    setTimeout(() => {
      toggle.classList.add('waifu-toggle-active');
    }, 0);
  } else {
    loadWidget(config);
  }
}
