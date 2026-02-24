document.addEventListener("DOMContentLoaded", () => {
  const sliderEl = document.querySelector(".js-howtoslider");
  const tabsWrap = document.getElementById("howtoTabs");
  if (!sliderEl || !tabsWrap) return;

  const tabs = Array.from(tabsWrap.querySelectorAll(".howto__tab"));

  const slider = new Swiper(sliderEl, {
    loop: false,
    speed: 600,
    allowTouchMove: true,
    navigation: {
      nextEl: ".howtoslider__next",
      prevEl: ".howtoslider__prev",
    },
    on: {
      slideChange: (sw) => setActiveTab(sw.activeIndex),
    },
  });

  function setActiveTab(index) {
    tabs.forEach((btn, i) => btn.classList.toggle("is-active", i === index));
  }

  tabsWrap.addEventListener("click", (e) => {
    const btn = e.target.closest(".howto__tab");
    if (!btn) return;
    const index = Number(btn.dataset.slide);
    slider.slideTo(index);
    setActiveTab(index);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const sliderEl = document.querySelector(".js-sale-slider");
  if (!sliderEl) return;

  const prevBtn = document.querySelector(".sale-slider__prev");
  const nextBtn = document.querySelector(".sale-slider__next");

  const slider = new Swiper(sliderEl, {
    loop: true,
    speed: 600,
    spaceBetween: 16,
    slidesPerView: 3,

    navigation: {
      nextEl: ".sale-slider__next",
      prevEl: ".sale-slider__prev",
    },

    on: {
      init: (sw) => toggleSaleNav(sw),
      resize: (sw) => toggleSaleNav(sw),
      breakpoint: (sw) => toggleSaleNav(sw),
      slidesLengthChange: (sw) => toggleSaleNav(sw),
      snapGridLengthChange: (sw) => toggleSaleNav(sw),
    },
  });

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
});