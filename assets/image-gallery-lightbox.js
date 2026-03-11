class ImageGalleryLightbox extends HTMLElement {
  constructor() {
    super();
    this.images = this.querySelectorAll('.image-gallery-lightbox__image-wrapper');
    this.prevButton = this.querySelector('.image-gallery-lightbox__nav--prev');
    this.nextButton = this.querySelector('.image-gallery-lightbox__nav--next');
    this.closeButton = this.querySelector('.image-gallery-lightbox__close');
    this.counterCurrent = this.querySelector('.image-gallery-lightbox__counter-current');
    this.counterTotal = this.querySelector('.image-gallery-lightbox__counter-total');
    this.currentIndex = 0;

    this.closeButton.addEventListener('click', this.hide.bind(this));
    this.prevButton?.addEventListener('click', this.prev.bind(this));
    this.nextButton?.addEventListener('click', this.next.bind(this));
    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.querySelector('.image-gallery-lightbox__overlay').addEventListener('click', this.hide.bind(this));

    // Drag/swipe state
    this.content = this.querySelector('.image-gallery-lightbox__content');
    this.swipeStartX = 0;
    this.swipeStartY = 0;
    this.swipeDeltaX = 0;
    this.swiping = false;
    this.swipeLocked = false;
    this.dragClicked = false;

    // Touch events
    this.content.addEventListener('touchstart', this.onDragStart.bind(this), { passive: true });
    this.content.addEventListener('touchmove', this.onDragMove.bind(this), { passive: false });
    this.content.addEventListener('touchend', this.onDragEnd.bind(this), { passive: true });
    this.content.addEventListener('touchcancel', this.onDragEnd.bind(this), { passive: true });

    // Mouse events
    this.content.addEventListener('mousedown', this.onDragStart.bind(this));
    this.content.addEventListener('mousemove', this.onDragMove.bind(this));
    this.content.addEventListener('mouseup', this.onDragEnd.bind(this));
    this.content.addEventListener('mouseleave', this.onDragEnd.bind(this));

    // Prevent image dragging
    this.content.addEventListener('dragstart', (e) => e.preventDefault());
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    const sectionId = this.id;
    document.body.appendChild(this);

    document.querySelectorAll(`[data-lightbox-target="#${sectionId}"]`).forEach((button) => {
      button.addEventListener('click', () => {
        this.openedBy = button;
        this.show(parseInt(button.dataset.lightboxIndex, 10));
      });
    });
  }

  show(index = 0) {
    this.currentIndex = index;
    this.images.forEach((img, i) => img.classList.toggle('active', i === this.currentIndex));
    this.updateControls();
    this.classList.add('is-open');
    document.body.classList.add('overflow-hidden');
    trapFocus(this, this.closeButton);
  }

  hide() {
    this.classList.remove('is-open');
    document.body.classList.remove('overflow-hidden');
    removeTrapFocus(this.openedBy);
  }

  prev() {
    if (this.currentIndex > 0) {
      this.classList.add('is-swiping');
      const fromIndex = this.currentIndex;
      this.currentIndex--;
      this.slideTransition(fromIndex, this.currentIndex, 1);
    }
  }

  next() {
    if (this.currentIndex < this.images.length - 1) {
      this.classList.add('is-swiping');
      const fromIndex = this.currentIndex;
      this.currentIndex++;
      this.slideTransition(fromIndex, this.currentIndex, -1);
    }
  }

  slideTransition(fromIndex, toIndex, direction) {
    const from = this.images[fromIndex];
    const to = this.images[toIndex];
    const distance = window.innerWidth;

    // Position incoming off-screen
    to.style.transition = 'none';
    to.style.transform = `translateX(${-direction * distance}px)`;
    to.style.opacity = '0.3';

    // Force reflow so the starting position applies before transition
    to.offsetHeight;

    const duration = '0.4s';
    from.style.transition = `transform ${duration} ease, opacity ${duration} ease`;
    to.style.transition = `transform ${duration} ease, opacity ${duration} ease`;

    from.style.transform = `translateX(${direction * distance}px)`;
    from.style.opacity = '0';
    to.style.transform = 'translateX(0)';
    to.style.opacity = '1';

    const cleanup = () => {
      this.classList.remove('is-swiping');
      this.images.forEach((img, i) => {
        img.style.transition = '';
        img.style.transform = '';
        img.style.opacity = '';
        img.style.pointerEvents = '';
        img.classList.toggle('active', i === this.currentIndex);
      });
      from.removeEventListener('transitionend', cleanup);
    };
    from.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 450);

    this.updateControls();
  }

  onKeyUp(event) {
    if (event.code === 'Escape') this.hide();
    if (event.code === 'ArrowLeft') this.prev();
    if (event.code === 'ArrowRight') this.next();
  }

  getPointerX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  getPointerY(e) {
    return e.touches ? e.touches[0].clientY : e.clientY;
  }

  getEndPointerX(e) {
    return e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
  }

  onDragStart(e) {
    // Only left mouse button
    if (e.button !== undefined && e.button !== 0) return;
    this.swipeStartX = this.getPointerX(e);
    this.swipeStartY = this.getPointerY(e);
    this.swipeDeltaX = 0;
    this.swiping = true;
    this.swipeLocked = false;
    this.dragClicked = true;
    this.classList.add('is-swiping');
    this.images.forEach((img) => {
      img.style.transition = 'none';
    });
  }

  onDragMove(e) {
    if (!this.swiping) return;

    const deltaX = this.getPointerX(e) - this.swipeStartX;
    const deltaY = this.getPointerY(e) - this.swipeStartY;

    // Determine direction lock on first significant movement
    if (!this.swipeLocked && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        this.swiping = false;
        this.resetSwipePosition();
        return;
      }
      this.swipeLocked = true;
    }

    if (!this.swipeLocked) return;

    if (e.preventDefault) e.preventDefault();
    this.dragClicked = false;
    this.swipeDeltaX = deltaX;

    const threshold = window.innerWidth * 0.2;
    const progress = Math.min(Math.abs(deltaX) / threshold, 1);

    // Rubber-band at edges
    const atStart = this.currentIndex === 0 && deltaX > 0;
    const atEnd = this.currentIndex === this.images.length - 1 && deltaX < 0;
    const translate = (atStart || atEnd) ? deltaX * 0.3 : deltaX;

    // Current image: fades as it approaches threshold
    const current = this.images[this.currentIndex];
    current.style.transform = `translateX(${translate}px)`;
    current.style.opacity = `${1 - progress * 0.4}`;

    // Incoming image: slides in, fades in as it approaches threshold
    const nextIndex = deltaX < 0 ? this.currentIndex + 1 : this.currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < this.images.length) {
      const incoming = this.images[nextIndex];
      const offset = deltaX < 0 ? window.innerWidth : -window.innerWidth;
      incoming.style.transform = `translateX(${translate + offset}px)`;
      incoming.style.opacity = `${0.3 + progress * 0.7}`;
      incoming.style.pointerEvents = 'none';
    }
  }

  onDragEnd(e) {
    if (!this.swiping && !this.swipeLocked) return;
    this.swiping = false;

    const threshold = window.innerWidth * 0.2;
    const shouldAdvance = Math.abs(this.swipeDeltaX) > threshold;

    if (shouldAdvance && this.swipeDeltaX < 0 && this.currentIndex < this.images.length - 1) {
      this.swipeTransition(this.currentIndex, this.currentIndex + 1, this.swipeDeltaX);
      this.currentIndex++;
    } else if (shouldAdvance && this.swipeDeltaX > 0 && this.currentIndex > 0) {
      this.swipeTransition(this.currentIndex, this.currentIndex - 1, this.swipeDeltaX);
      this.currentIndex--;
    } else {
      this.resetSwipePosition();
    }

    this.updateControls();
  }

  swipeTransition(fromIndex, toIndex, deltaX) {
    const from = this.images[fromIndex];
    const to = this.images[toIndex];
    const direction = deltaX < 0 ? -1 : 1;

    const duration = '0.3s';
    from.style.transition = `transform ${duration} ease, opacity ${duration} ease`;
    to.style.transition = `transform ${duration} ease, opacity ${duration} ease`;

    from.style.transform = `translateX(${direction * window.innerWidth}px)`;
    from.style.opacity = '0';
    to.style.transform = 'translateX(0)';
    to.style.opacity = '1';

    const cleanup = () => {
      this.classList.remove('is-swiping');
      this.images.forEach((img, i) => {
        img.style.transition = '';
        img.style.transform = '';
        img.style.opacity = '';
        img.style.pointerEvents = '';
        img.classList.toggle('active', i === this.currentIndex);
      });
      from.removeEventListener('transitionend', cleanup);
    };
    from.addEventListener('transitionend', cleanup, { once: true });
    setTimeout(cleanup, 350);
  }

  resetSwipePosition() {
    const currentImg = this.images[this.currentIndex];
    // Snap current image back with transition
    currentImg.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    currentImg.style.transform = '';
    currentImg.style.opacity = '';

    // Hide all other images immediately (no transition) to prevent flash
    this.images.forEach((img, i) => {
      if (i !== this.currentIndex) {
        img.style.transition = 'none';
        img.style.transform = '';
        img.style.opacity = '';
        img.style.pointerEvents = '';
      }
    });

    setTimeout(() => {
      this.classList.remove('is-swiping');
      this.images.forEach((img) => {
        img.style.transition = '';
      });
    }, 300);
  }

  updateActiveImage() {
    this.images.forEach((img, i) => {
      img.style.transform = '';
      img.style.opacity = '';
      img.style.transition = '';
      img.style.pointerEvents = '';
      img.classList.toggle('active', i === this.currentIndex);
    });
    this.updateControls();
  }

  updateControls() {
    if (this.counterCurrent) {
      this.counterCurrent.textContent = this.currentIndex + 1;
    }
    if (this.prevButton) {
      this.prevButton.toggleAttribute('disabled', this.currentIndex === 0);
    }
    if (this.nextButton) {
      this.nextButton.toggleAttribute('disabled', this.currentIndex === this.images.length - 1);
    }
  }
}

customElements.define('image-gallery-lightbox', ImageGalleryLightbox);
