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
      this.currentIndex--;
      this.updateActiveImage();
    }
  }

  next() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.updateActiveImage();
    }
  }

  onKeyUp(event) {
    if (event.code === 'Escape') this.hide();
    if (event.code === 'ArrowLeft') this.prev();
    if (event.code === 'ArrowRight') this.next();
  }

  updateActiveImage() {
    this.images.forEach((img, i) => {
      if (i === this.currentIndex) {
        img.classList.add('active');
      } else {
        img.classList.remove('active');
      }
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
