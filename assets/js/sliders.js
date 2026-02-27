document.addEventListener("DOMContentLoaded", () => {
  const sliderEl = document.querySelector(".js-howtoslider");
  const tabsWrap = document.getElementById("howtoTabs");
  if (!sliderEl) return;

  const tabs = tabsWrap
    ? Array.from(tabsWrap.querySelectorAll(".howto__tab"))
    : [];

  const slider = new Swiper(sliderEl, {
    speed: 600,
    allowTouchMove: true,
    navigation: {
      nextEl: ".howtoslider__next",
      prevEl: ".howtoslider__prev",
    },

    breakpoints: {
      0: {
        loop: true,
        autoHeight: true,      // ✅ каждый слайд своей высоты
      },
      992: {
        loop: false,
        autoHeight: false,     // ✅ возвращаем “обычную” высоту
      },
    },

    on: {
      slideChange: (sw) => {
        if (window.innerWidth >= 992) setActiveTab(sw.activeIndex);
      },
      // на всякий случай, чтобы пересчитывалось после картинок/контента
      imagesReady: (sw) => {
        if (window.innerWidth < 992) sw.updateAutoHeight(0);
      },
    },
  });

  function setActiveTab(index) {
    tabs.forEach((btn, i) => btn.classList.toggle("is-active", i === index));
  }

  if (tabsWrap) {
    tabsWrap.addEventListener("click", (e) => {
      if (window.innerWidth < 992) return;
      const btn = e.target.closest(".howto__tab");
      if (!btn) return;

      const index = Number(btn.dataset.slide);
      slider.slideTo(index);
      setActiveTab(index);
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const sliderEl = document.querySelector(".js-sale-slider");
  if (!sliderEl) return;

  const prevBtn = document.querySelector(".sale-slider__prev");
  const nextBtn = document.querySelector(".sale-slider__next");

  let slider = null;

  const mediaQuery = window.matchMedia("(min-width: 992px)");

  function initSwiper() {
    slider = new Swiper(sliderEl, {
      loop: true,
      speed: 600,
      spaceBetween: 16,
      slidesPerView: 3,
      autoHeight: false,

      navigation: {
        nextEl: ".sale-slider__next",
        prevEl: ".sale-slider__prev",
      },

      on: {
        init: (sw) => toggleSaleNav(sw),
        resize: (sw) => toggleSaleNav(sw),
        slidesLengthChange: (sw) => toggleSaleNav(sw),
        snapGridLengthChange: (sw) => toggleSaleNav(sw),
      },
    });
  }

  function destroySwiper() {
    if (slider) {
      slider.destroy(true, true);
      slider = null;
    }

    if (prevBtn) prevBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "none";
  }

  function getCurrentSlidesPerView(sw) {
    const spv = sw.params.slidesPerView;

    if (spv === "auto") {
      const slideW = sw.slides?.[0]?.getBoundingClientRect().width || 1;
      return Math.max(1, Math.floor(sw.width / slideW));
    }

    return Number(spv) || 1;
  }

  function toggleSaleNav(sw) {
    const total = sw.slides.length;
    const spv = getCurrentSlidesPerView(sw);

    const canScroll = total > spv;

    if (prevBtn) prevBtn.style.display = canScroll ? "" : "none";
    if (nextBtn) nextBtn.style.display = canScroll ? "" : "none";

    if (sw.navigation) {
      if (canScroll) sw.navigation.enable();
      else sw.navigation.disable();
    }
  }

  function handleBreakpoint(e) {
    if (e.matches) {
      // >= 992px
      if (!slider) initSwiper();
    } else {
      // < 992px
      destroySwiper();
    }
  }

  // initial check
  handleBreakpoint(mediaQuery);

  // listen changes
  mediaQuery.addEventListener("change", handleBreakpoint);
});