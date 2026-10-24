(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const toast = $('#toast');
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // Opening the letter: visual animation, then gently move to the story.
  const envelopeStage = $('.envelope-stage');
  $('#openLetter').addEventListener('click', () => {
    envelopeStage.classList.add('opened');
    $('#letterCard').setAttribute('aria-label', 'Открытое письмо для Елены');
    showToast('Это письмо — только для тебя, любовь моя. ♡');
    window.setTimeout(() => $('#beginning').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' }), 600);
  });

  // Reveal sections as they enter the viewport.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion()) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -25px 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('visible'));
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Reading progress bar.
  const progress = $('#readingProgress');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const amount = max > 0 ? (window.scrollY / max) * 100 : 0;
      progress.style.width = `${Math.min(100, Math.max(0, amount))}%`;
      ticking = false;
    });
  }, { passive: true });

  // Relationship counter: local midnight avoids the UTC parsing trap for YYYY-MM-DD.
  const relationshipStart = new Date(2026, 6, 25, 0, 0, 0, 0);
  const pad = number => String(number).padStart(2, '0');
  function updateCounter() {
    let elapsed = Date.now() - relationshipStart.getTime();
    if (elapsed < 0) elapsed = 0;
    const totalSeconds = Math.floor(elapsed / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    $('#days').textContent = String(days).padStart(3, '0');
    $('#hours').textContent = pad(hours);
    $('#minutes').textContent = pad(minutes);
    $('#seconds').textContent = pad(seconds);
  }
  updateCounter();
  window.setInterval(updateCounter, 1000);

  // A short, gentle quiz using only confirmed details from the story.
  const questions = [
    { question: 'Где началась наша переписка?', subtitle: 'У каждой истории есть своё первое сообщение.', options: ['В Telegram', 'В кино', 'На прогулке'], correct: 0, success: 'Да — с сообщения, которое стало началом нашей истории. ♡', retry: 'Не страшно. У любой красивой истории есть своё начало. ♡' },
    { question: 'В каком месяце мы стали парой?', subtitle: 'Тот самый день, который теперь хочется помнить.', options: ['В мае', 'В июле', 'В сентябре'], correct: 1, success: '25 июля 2026 года — день, когда мы стали «мы». ♡', retry: 'Подсказка: это было в разгар лета. ♡' },
    { question: 'Какой момент особенно дорог мне с нашей первой встречи?', subtitle: 'Один маленький символ и очень настоящее чувство.', options: ['Поездка в кино', 'Совместный завтрак', 'Момент с кольцом'], correct: 2, success: 'Именно. Я хотел, чтобы этот момент был особенным — и чтобы он был нашим. ♥', retry: 'Подумай о маленьком символе, которому я хотел придать особое значение. ♡' }
  ];
  let questionIndex = 0;
  const questionTitle = $('#quizQuestion');
  const questionSubtitle = $('#quizSubtitle');
  const quizOptions = $('#quizOptions');
  const quizFeedback = $('#quizFeedback');
  const quizNext = $('#quizNext');
  const quizProgress = $('#quizProgress');

  function renderQuestion() {
    const question = questions[questionIndex];
    questionTitle.textContent = question.question;
    questionSubtitle.textContent = question.subtitle;
    quizProgress.textContent = `ВОПРОС 0${questionIndex + 1} / 03`;
    quizFeedback.textContent = '';
    quizNext.classList.add('hidden');
    quizOptions.innerHTML = '';
    question.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'quiz-option';
      button.type = 'button';
      button.textContent = option;
      button.addEventListener('click', () => answerQuestion(index, button));
      quizOptions.appendChild(button);
    });
  }

  function answerQuestion(answer, selectedButton) {
    const question = questions[questionIndex];
    $$('.quiz-option', quizOptions).forEach(button => { button.disabled = true; });
    if (answer === question.correct) {
      selectedButton.classList.add('correct');
      quizFeedback.textContent = question.success;
    } else {
      selectedButton.classList.add('incorrect');
      $$('.quiz-option', quizOptions)[question.correct].classList.add('correct');
      quizFeedback.textContent = question.retry;
    }
    quizNext.textContent = questionIndex === questions.length - 1 ? 'Завершить игру ♡' : 'Следующий вопрос ↗';
    quizNext.classList.remove('hidden');
  }

  quizNext.addEventListener('click', () => {
    if (questionIndex < questions.length - 1) {
      questionIndex += 1;
      renderQuestion();
    } else {
      questionTitle.textContent = 'Главный ответ уже известен.';
      questionSubtitle.textContent = 'Не нужно ничего доказывать — это просто маленькая игра о нашей истории.';
      quizOptions.innerHTML = '<div class="quiz-finish">Спасибо, что ты — часть этой истории. ♥</div>';
      quizFeedback.textContent = 'А впереди у нас ещё много воспоминаний.';
      quizProgress.textContent = 'ИГРА ЗАВЕРШЕНА';
      quizNext.classList.add('hidden');
    }
  });
  renderQuestion();

  // Secret message toggle.
  $('#revealSecret').addEventListener('click', event => {
    const secret = $('#secretMessage');
    const isHidden = secret.hidden;
    secret.hidden = !isHidden;
    event.currentTarget.querySelector('span:first-child').textContent = isHidden ? 'Спрятать послание' : 'Открыть секрет';
    event.currentTarget.querySelector('span:last-child').textContent = isHidden ? '♥' : '♡';
    if (isHidden) secret.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  });

  // Optional local music. The page intentionally does not autoplay sound.
  const audio = $('#backgroundAudio');
  const soundToggle = $('#soundToggle');
  const soundLabel = $('#soundLabel');
  let musicAttempted = false;
  soundToggle.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        musicAttempted = true;
        await audio.play();
        soundToggle.classList.add('playing');
        soundLabel.textContent = 'МУЗЫКА';
        soundToggle.setAttribute('aria-label', 'Выключить музыку');
      } catch (error) {
        soundLabel.textContent = 'НЕТ ТРЕКА';
        showToast('Добавь музыкальный файл с именем music.mp3 рядом с index.html.');
      }
    } else {
      audio.pause();
      soundToggle.classList.remove('playing');
      soundLabel.textContent = 'ТИШИНА';
      soundToggle.setAttribute('aria-label', 'Включить музыку');
    }
  });
  audio.addEventListener('error', () => {
    if (musicAttempted) showToast('Положи свой музыкальный файл music.mp3 рядом с index.html — и кнопка заработает.');
    soundToggle.classList.remove('playing');
    soundLabel.textContent = 'ТИШИНА';
  });
  audio.addEventListener('ended', () => {
    soundToggle.classList.remove('playing');
    soundLabel.textContent = 'ТИШИНА';
  });

  // Back to top, with a reset envelope animation.
  $('#restart').addEventListener('click', () => {
    envelopeStage.classList.remove('opened');
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    showToast('Начнём нашу историю снова, любимая. ♡');
  });
})();
