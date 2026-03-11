// Слайдер в баннере
(() => {
  const slider = document.getElementById("m2Slider");
  const out = document.getElementById("m2Val");

  if (!slider || !out) return;

  const track = slider.querySelector(".banner_select__track");
  const fill = slider.querySelector(".banner_select__fill");
  const thumb = slider.querySelector(".banner_select__thumb");
  const minEl = slider.querySelector(".banner_select__min");
  const maxEl = slider.querySelector(".banner_select__max");

  if (!track || !fill || !thumb || !minEl || !maxEl) return;

  let MIN = Number(slider.dataset.min ?? 30);
  let MAX = Number(slider.dataset.max ?? 500);
  let value = Number(slider.dataset.value ?? 74);

  minEl.textContent = `${MIN} м²`;
  maxEl.textContent = `${MAX} м²`;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const roundToInt = (v) => Math.round(v);

  function setValue(v, emit = true) {
    value = clamp(roundToInt(v), MIN, MAX);
    slider.dataset.value = String(value);
    out.textContent = `${value} м²`;

    const rect = track.getBoundingClientRect();
    const pct = (value - MIN) / (MAX - MIN || 1);
    const x = pct * rect.width;

    fill.style.width = `${pct * 100}%`;
    thumb.style.left = `${x}px`;
    thumb.style.transform = `translate(-50%, -50%)`;

    thumb.setAttribute("aria-valuemin", MIN);
    thumb.setAttribute("aria-valuemax", MAX);
    thumb.setAttribute("aria-valuenow", value);

    if (emit) {
      slider.dispatchEvent(
        new CustomEvent("banner_select:change", {
          detail: { value, min: MIN, max: MAX }
        })
      );
    }
  }

  function valueFromClientX(clientX) {
    const rect = track.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const pct = rect.width ? x / rect.width : 0;
    return MIN + pct * (MAX - MIN);
  }

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

  track.addEventListener("pointerdown", onPointerDown);
  thumb.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp, { passive: false });

  thumb.addEventListener("keydown", (e) => {
    const step = 1;
    if (e.key === "ArrowLeft") {
      setValue(value - step);
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      setValue(value + step);
      e.preventDefault();
    }
    if (e.key === "Home") {
      setValue(MIN);
      e.preventDefault();
    }
    if (e.key === "End") {
      setValue(MAX);
      e.preventDefault();
    }
  });

  slider.bannerSelectSetRange = (min, max, newValue = value) => {
    MIN = Number(min);
    MAX = Number(max);
    minEl.textContent = `${MIN} м²`;
    maxEl.textContent = `${MAX} м²`;
    setValue(newValue);
  };

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
// открыть активный accordion при загрузке
document.addEventListener("DOMContentLoaded", () => {
    const activeHeader = document.querySelector(".accordion-item-header.active");
    
    if (activeHeader) {
        const body = activeHeader.nextElementSibling;
        body.style.maxHeight = body.scrollHeight + "px";
    }
});

// Mob menu
document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.header-burger');
  const mobMenu = document.querySelector('.mob-menu');
  const pageFilter = document.querySelector('.page-filter');

  const burgerOpener = document.querySelector('.header-burger-opener');
  const burgerClose = document.querySelector('.header-burger-close');

  if (!burger || !mobMenu || !pageFilter) return;

  function toggleMenu() {
    const isOpen = mobMenu.classList.toggle('active');
    pageFilter.classList.toggle('active', isOpen);

    document.body.classList.toggle('noscroll', isOpen);
    document.documentElement.classList.toggle('noscroll', isOpen);

    // ДОБАВЛЕНО
    burger.classList.toggle('closer', isOpen);

    if (burgerOpener && burgerClose) {
      burgerOpener.style.display = isOpen ? 'none' : 'block';
      burgerClose.style.display = isOpen ? 'block' : 'none';
    }
  }

  function closeMenu() {
    mobMenu.classList.remove('active');
    pageFilter.classList.remove('active');

    document.body.classList.remove('noscroll');
    document.documentElement.classList.remove('noscroll');

    // ДОБАВЛЕНО
    burger.classList.remove('closer');

    if (burgerOpener && burgerClose) {
      burgerOpener.style.display = 'block';
      burgerClose.style.display = 'none';
    }
  }

  burger.addEventListener('click', toggleMenu);
  pageFilter.addEventListener('click', closeMenu);
});
const navToggles = document.querySelectorAll('.mobile-nav__toggle');

navToggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const isActive = toggle.classList.contains('active');
    const activeToggle = document.querySelector('.mobile-nav__toggle.active');

    if (activeToggle && activeToggle !== toggle) {
      activeToggle.classList.remove('active');
      activeToggle.setAttribute('aria-expanded', 'false');
      activeToggle.nextElementSibling.style.maxHeight = 0;
    }

    toggle.classList.toggle('active');
    toggle.setAttribute('aria-expanded', String(!isActive));

    const body = toggle.nextElementSibling;
    if (!isActive) {
      body.style.maxHeight = body.scrollHeight + 'px';
    } else {
      body.style.maxHeight = 0;
    }
  });
});


//Modal
document.addEventListener('DOMContentLoaded', () => {
  const openers = document.querySelectorAll('[data-modal-open]');
  let activeModal = null;

  function openModal(modal) {
    if (!modal) return;

    // закрыть текущую, если есть
    if (activeModal && activeModal !== modal) closeModal(activeModal);

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    activeModal = modal;
  }

  function closeModal(modal) {
    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    if (activeModal === modal) activeModal = null;
  }

  // Открытие по клику на любой элемент с data-modal-open="id"
  openers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      // если это ссылка — чтобы не прыгала
      if (btn.tagName.toLowerCase() === 'a') e.preventDefault();

      const id = btn.getAttribute('data-modal-open');
      const modal = document.getElementById(id);
      openModal(modal);
    });
  });

  // Закрытие по клику на [data-modal-close] внутри модалки
  document.addEventListener('click', (e) => {
    const closeEl = e.target.closest('[data-modal-close]');
    if (!closeEl) return;

    const modal = closeEl.closest('.modal');
    closeModal(modal);
  });

  // Закрытие по Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeModal) {
      closeModal(activeModal);
    }
  });
});



// service__table toggle
(() => {
  const tables = document.querySelectorAll('.service__table');

  if (!tables.length) return;

  tables.forEach(root => {
    const btn = root.querySelector('.service__table-btn');
    const scroller = root.querySelector('.service__table__scroll');
    const fade = root.querySelector('.service__table__fade');

    if (!btn || !scroller) return;

    const syncControls = () => {
      const needsClamp = scroller.scrollHeight > 600;

      btn.style.display = needsClamp ? '' : 'none';

      if (fade) {
        fade.style.display = needsClamp ? '' : 'none';
      }
    };

    btn.addEventListener('click', () => {
      root.classList.add('is-open');
    });

    syncControls();
    window.addEventListener('resize', syncControls);
  });
})();


// Dropdown nav
const navLinks = document.querySelectorAll('.nav__link');
const dropdowns = document.querySelectorAll('.header_dropmenu');
const closeBtn = document.querySelector('.close-dropdown');

navLinks.forEach((link, index) => {

  if (link.tagName.toLowerCase() === 'div') {

    link.addEventListener('click', (e) => {

      e.stopPropagation();

      const isOpen = link.classList.contains('open');

      // закрыть всё
      navLinks.forEach(l => l.classList.remove('open'));
      dropdowns.forEach(d => d.classList.remove('active'));

      // если было закрыто — открыть
      if (!isOpen && dropdowns[index]) {
        link.classList.add('open');
        dropdowns[index].classList.add('active');
      }

    });

  }

});


// закрытие по кнопке
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    navLinks.forEach(l => l.classList.remove('open'));
    dropdowns.forEach(d => d.classList.remove('active'));
  });
}


// клик вне меню
document.addEventListener('click', (e) => {

  const clickedMenu = e.target.closest('.header_dropmenu');
  const clickedNav = e.target.closest('.nav__link');

  if (!clickedMenu && !clickedNav) {
    navLinks.forEach(l => l.classList.remove('open'));
    dropdowns.forEach(d => d.classList.remove('active'));
  }

});



//stars
const stars = document.querySelectorAll('.star');
const starsWrap = document.querySelector('.lower-rater-stars');

if (stars.length && starsWrap) {

  let selectedRating = null;

  stars.forEach((star, index) => {
    star.addEventListener('mouseover', () => {
      highlightStars(index);
    });

    star.addEventListener('click', () => {
      selectedRating = index;
      highlightStars(index);
    });
  });

  starsWrap.addEventListener('mouseleave', () => {
    if (selectedRating === null) {
      clearStars();
    } else {
      highlightStars(selectedRating);
    }
  });

  function highlightStars(index) {
    stars.forEach((star, i) => {
      star.classList.toggle('active', i <= index);
    });
  }

  function clearStars() {
    stars.forEach(star => star.classList.remove('active'));
  }

}





// Calc
document.addEventListener('DOMContentLoaded', function () {
  const steppers = document.querySelectorAll('[data-stepper]');

  steppers.forEach((stepper) => {
    const minusBtn = stepper.querySelector('[data-stepper-minus]');
    const plusBtn = stepper.querySelector('[data-stepper-plus]');
    const valueEl = stepper.querySelector('[data-stepper-value]');
    const inputEl = stepper.querySelector('[data-stepper-input]');

    if (!minusBtn || !plusBtn || !valueEl || !inputEl) return;

    const min = Number(stepper.dataset.min || 0);
    const max = Number(stepper.dataset.max || 9999);
    const step = Number(stepper.dataset.step || 1);
    const isInput = valueEl.tagName === 'INPUT';

    let holdTimeout = null;
    let holdInterval = null;
    let holdStarted = false;

    function autoResizeInput(input) {
      if (!input || input.tagName !== 'INPUT') return;
      input.style.width = Math.max(String(input.value).length, 1.1) + 'ch';
    }

    function clamp(value) {
      let newValue = value;
      if (newValue < min) newValue = min;
      if (newValue > max) newValue = max;
      return newValue;
    }

    function getValue() {
      const rawValue = isInput
        ? valueEl.value
        : (inputEl.value || valueEl.textContent);

      const value = Number(rawValue);
      return isNaN(value) ? min : value;
    }

    function setValue(value) {
      const newValue = clamp(value);

      if (isInput) {
        valueEl.value = newValue;
        autoResizeInput(valueEl);
      } else {
        valueEl.textContent = newValue;
      }

      inputEl.value = newValue;
    }

    function changeValue(direction) {
      let currentValue;

      if (isInput && valueEl.value === '') {
        currentValue = min;
      } else {
        currentValue = getValue();
      }

      setValue(currentValue + direction * step);
    }

    function startPress(direction) {
      holdStarted = false;

      holdTimeout = setTimeout(() => {
        holdStarted = true;
        holdInterval = setInterval(() => {
          changeValue(direction);
        }, 60);
      }, 350);
    }

    function stopPress(direction) {
      const hadHoldTimeout = holdTimeout;

      clearTimeout(holdTimeout);
      clearInterval(holdInterval);

      holdTimeout = null;
      holdInterval = null;

      if (!holdStarted && hadHoldTimeout) {
        changeValue(direction);
      }

      holdStarted = false;
    }

    plusBtn.addEventListener('mousedown', function (e) {
      e.preventDefault();
      startPress(1);
    });

    minusBtn.addEventListener('mousedown', function (e) {
      e.preventDefault();
      startPress(-1);
    });

    plusBtn.addEventListener('touchstart', function (e) {
      e.preventDefault();
      startPress(1);
    }, { passive: false });

    minusBtn.addEventListener('touchstart', function (e) {
      e.preventDefault();
      startPress(-1);
    }, { passive: false });

    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((eventName) => {
      plusBtn.addEventListener(eventName, function () {
        stopPress(1);
      });

      minusBtn.addEventListener(eventName, function () {
        stopPress(-1);
      });
    });

    document.addEventListener('mouseup', function () {
      clearTimeout(holdTimeout);
      clearInterval(holdInterval);
      holdTimeout = null;
      holdInterval = null;
      holdStarted = false;
    });

    document.addEventListener('touchend', function () {
      clearTimeout(holdTimeout);
      clearInterval(holdInterval);
      holdTimeout = null;
      holdInterval = null;
      holdStarted = false;
    });

    if (isInput) {
      valueEl.addEventListener('focus', function () {
        valueEl.select();
      });

      valueEl.addEventListener('input', function () {
        const cleaned = valueEl.value.replace(/[^\d]/g, '');
        valueEl.value = cleaned;
        inputEl.value = cleaned;
        autoResizeInput(valueEl);
      });

      valueEl.addEventListener('blur', function () {
        if (valueEl.value === '') {
          setValue(min);
          return;
        }

        setValue(Number(valueEl.value));
      });

      if (valueEl.value === '') {
        valueEl.value = inputEl.value || min;
      }

      autoResizeInput(valueEl);
    } else {
      setValue(getValue());
    }
  });

  const tabs = document.querySelector('[data-tabs]');

  if (tabs) {
    const buttons = tabs.querySelectorAll('[data-tab-btn]');
    const panels = tabs.querySelectorAll('[data-tab-panel]');

    buttons.forEach((button) => {
      button.addEventListener('click', function () {
        const tabName = button.dataset.tabBtn;

        buttons.forEach((btn) => btn.classList.remove('btn-def'));
        panels.forEach((panel) => panel.classList.remove('is-active'));

        button.classList.add('btn-def');

        const activePanel = tabs.querySelector(`[data-tab-panel="${tabName}"]`);
        if (activePanel) {
          activePanel.classList.add('is-active');
        }
      });
    });
  }
});


// Calc podskazka

document.addEventListener('click', function (e) {
    const minusBtn = e.target.closest('.calc-accord-item__btn--minus');
    const plusBtn = e.target.closest('.calc-accord-item__btn--plus');

    if (!minusBtn && !plusBtn) return;

    const item = e.target.closest('.calc-accord-item');
    const input = item.querySelector('.calc-accord-item__input');
    let value = parseInt(input.value, 10) || 0;

    if (plusBtn) {
        value += 1;
    }

    if (minusBtn) {
        value = Math.max(0, value - 1);
    }

    input.value = value;
});




// Table mob
document.addEventListener('DOMContentLoaded', function () {
  const serviceTables = document.querySelectorAll('.service__table');

  serviceTables.forEach(function (tableBlock) {
    const tabs = tableBlock.querySelectorAll('.service-tab');
    const table = tableBlock.querySelector('.service__table__grid');
    const scrollWrap = tableBlock.querySelector('.service__table__scroll');

    if (!tabs.length || !table) return;

    // Ищем активный таб по умолчанию
    let activeTab = tableBlock.querySelector('.service-tab.is-active');
    let activeCol = activeTab ? activeTab.dataset.col : '1';

    table.classList.remove('mobile-col-1', 'mobile-col-2', 'mobile-col-3', 'mobile-col-4');
    table.classList.add('mobile-col-' + activeCol);

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const col = this.dataset.col;

        tabs.forEach(function (btn) {
          btn.classList.remove('is-active');
        });

        this.classList.add('is-active');

        table.classList.remove(
          'mobile-col-1',
          'mobile-col-2',
          'mobile-col-3',
          'mobile-col-4'
        );

        table.classList.add('mobile-col-' + col);

        if (scrollWrap) {
          scrollWrap.scrollLeft = 0;
        }
      });
    });
  });
});