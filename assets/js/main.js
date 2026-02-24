// Слайдер в баннере
(() => {
  const slider = document.getElementById("m2Slider");
  const out = document.getElementById("m2Val");

  const track = slider.querySelector(".banner_select__track");
  const fill  = slider.querySelector(".banner_select__fill");
  const thumb = slider.querySelector(".banner_select__thumb");

  // правь мин/макс тут или в data-атрибутах
  let MIN = Number(slider.dataset.min ?? 30);
  let MAX = Number(slider.dataset.max ?? 500);
  let value = Number(slider.dataset.value ?? 74);

  const minEl = slider.querySelector(".banner_select__min");
  const maxEl = slider.querySelector(".banner_select__max");
  minEl.textContent = `${MIN} м²`;
  maxEl.textContent = `${MAX} м²`;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const roundToInt = (v) => Math.round(v);

  function setValue(v, emit = true) {
    value = clamp(roundToInt(v), MIN, MAX);
    slider.dataset.value = String(value);
    out.textContent = `${value} м²`;

    // позиционирование
    const rect = track.getBoundingClientRect();
    const pct = (value - MIN) / (MAX - MIN || 1);
    const x = pct * rect.width;

    fill.style.width = `${pct * 100}%`;
    // thumb позиционируем по центру кнопки
    thumb.style.left = `${x}px`;
    thumb.style.transform = `translate(-50%, -50%)`;

    if (emit) {
      slider.dispatchEvent(new CustomEvent("banner_select:change", { detail: { value, min: MIN, max: MAX }}));
    }
  }

  function valueFromClientX(clientX) {
    const rect = track.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const pct = rect.width ? (x / rect.width) : 0;
    return MIN + pct * (MAX - MIN);
  }

  // drag
  let dragging = false;

  const onPointerDown = (e) => {
    dragging = true;
    thumb.setPointerCapture?.(e.pointerId);
    setValue(valueFromClientX(e.clientX));
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    setValue(valueFromClientX(e.clientX));
    e.preventDefault();
  };

  const onPointerUp = (e) => {
    if (!dragging) return;
    dragging = false;
    e.preventDefault();
  };

  // клики по треку + перетаскивание за кнопку
  track.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp, { passive: false });

  // клавиатура на кнопке (доступность)
  thumb.addEventListener("keydown", (e) => {
    const step = 1;
    if (e.key === "ArrowLeft")  { setValue(value - step); e.preventDefault(); }
    if (e.key === "ArrowRight") { setValue(value + step); e.preventDefault(); }
    if (e.key === "Home")       { setValue(MIN); e.preventDefault(); }
    if (e.key === "End")        { setValue(MAX); e.preventDefault(); }
  });

  // публичный метод, чтобы потом легко менять границы
  slider.bannerSelectSetRange = (min, max, newValue = value) => {
    MIN = Number(min);
    MAX = Number(max);
    minEl.textContent = `${MIN} м²`;
    maxEl.textContent = `${MAX} м²`;
    setValue(newValue);
  };

  // init (после того как DOM отрисован и есть размеры)
  requestAnimationFrame(() => setValue(value, false));
})();


// Кастомный селект
document.querySelectorAll('[data-select]').forEach(selectWrapper => {
  const nativeSelect = selectWrapper.querySelector('select');
  const trigger = selectWrapper.querySelector('.custom-select__trigger');
  const valueEl = selectWrapper.querySelector('.custom-select__value');
  const optionsContainer = selectWrapper.querySelector('.custom-options');

  // Заполняем кастомные options
  nativeSelect.querySelectorAll('option').forEach(option => {
    const div = document.createElement('div');
    div.classList.add('custom-option');
    div.textContent = option.textContent;
    div.dataset.value = option.value;

    if (option.selected) {
      div.classList.add('selected');
      valueEl.textContent = option.textContent;
    }

    optionsContainer.appendChild(div);
  });

  // Открытие
  trigger.addEventListener('click', () => {
    selectWrapper.classList.toggle('open');
  });

  // Выбор
  optionsContainer.addEventListener('click', e => {
    if (!e.target.classList.contains('custom-option')) return;

    const value = e.target.dataset.value;

    nativeSelect.value = value;
    nativeSelect.dispatchEvent(new Event('change'));

    valueEl.textContent = e.target.textContent;

    optionsContainer.querySelectorAll('.custom-option')
      .forEach(opt => opt.classList.remove('selected'));

    e.target.classList.add('selected');

    selectWrapper.classList.remove('open');
  });

  // Закрытие вне клика
  document.addEventListener('click', e => {
    if (!selectWrapper.contains(e.target)) {
      selectWrapper.classList.remove('open');
    }
  });
});


// Бегущая строка
(() => {
  const root = document.querySelector('.features');
  const track = root?.querySelector('.features__track');
  const content = root?.querySelector('.features__content');
  if (!root || !track || !content) return;

  // Гарантированно убираем любую CSS-анимацию, если она осталась
  track.style.animation = 'none';

  let contentWidth = 0;
  let x = 0;
  let rafId = 0;
  const speed = 80; // px/sec

  // Доклонировать контент, пока лента не станет >= 2 ширины контейнера
  function fill() {
    // удалить старые клоны
    [...track.children].forEach((node, i) => { if (i > 0) node.remove(); });

    contentWidth = content.getBoundingClientRect().width;
    if (contentWidth <= 0) return;

    const needCopies = Math.ceil((root.getBoundingClientRect().width * 2) / contentWidth) + 1;
    for (let i = 0; i < needCopies; i++) {
      track.appendChild(content.cloneNode(true));
    }

    // x держим в корректном диапазоне
    x = ((x % contentWidth) + contentWidth) % contentWidth;
  }

  function loop(now, last = now) {
    const dt = (now - last) / 1000;

    // если шрифты/лейаут изменили ширину — подстроимся на лету
    const w = content.getBoundingClientRect().width;
    if (w > 0 && Math.abs(w - contentWidth) > 1) {
      contentWidth = w;
      fill();
    }

    if (contentWidth > 0) {
      x = (x + speed * dt) % contentWidth;
      track.style.transform = `translate3d(${-x}px,0,0)`;
    }

    rafId = requestAnimationFrame((t) => loop(t, now));
  }

  function start() {
    cancelAnimationFrame(rafId);
    fill();
    rafId = requestAnimationFrame(loop);
  }

  // старт после загрузки шрифтов (иначе ширины меняются и создают “обрыв”)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    window.addEventListener('load', start, { once: true });
  }

  window.addEventListener('resize', start);
})();



// Счетчик в шапке
document.addEventListener("DOMContentLoaded", function () {
    const counter = document.getElementById("counter-number-head");

    // Убираем пробелы и получаем числовое значение
    const target = parseInt(counter.textContent.replace(/\s/g, ''), 10);

    const duration = 2000; // длительность анимации в мс
    const startTime = performance.now();

    function formatNumber(num) {
        return num.toLocaleString('ru-RU');
    }

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentValue = Math.floor(progress * target);
        counter.textContent = formatNumber(currentValue);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            counter.textContent = formatNumber(target);
        }
    }

    requestAnimationFrame(animate);
});


// Accordion
const accordionItemHeaders = document.querySelectorAll(".accordion-item-header");
accordionItemHeaders.forEach(accordionItemHeader => {
    accordionItemHeader.addEventListener("click", event => {
        
        const currentlyActiveAccordionItemHeader = document.querySelector(".accordion-item-header.active");
        if(currentlyActiveAccordionItemHeader && currentlyActiveAccordionItemHeader!==accordionItemHeader) {
        currentlyActiveAccordionItemHeader.classList.toggle("active");
        currentlyActiveAccordionItemHeader.nextElementSibling.style.maxHeight = 0;
        }

        accordionItemHeader.classList.toggle("active");
        const accordionItemBody = accordionItemHeader.nextElementSibling;
        if(accordionItemHeader.classList.contains("active")) {
        accordionItemBody.style.maxHeight = accordionItemBody.scrollHeight + "px";
        }
        else {
        accordionItemBody.style.maxHeight = 0;
        }
        
    });
});