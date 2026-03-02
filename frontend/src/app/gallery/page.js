"use client";
import Image from "next/image";
import { EffectCoverflow, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

export default function Gallery() {
  const galleryImages = [
    { src: "/img/gallery/gallery-1.jpg", width: 450, height: 400 },
    { src: "/img/gallery/gallery-2.jpg", width: 450, height: 400 },
    { src: "/img/gallery/gallery-3.jpg", width: 450, height: 400 },
    { src: "/img/gallery/gallery-4.jpg", width: 450, height: 400 },
    { src: "/img/gallery/gallery-5.jpg", width: 450, height: 400 },
    { src: "/img/gallery/gallery-1.jpg", width: 450, height: 400 },
    { src: "/img/gallery/gallery-2.jpg", width: 450, height: 400 },
    { src: "/img/gallery/gallery-3.jpg", width: 450, height: 400 },
    { src: "/img/gallery/gallery-4.jpg", width: 450, height: 400 },
  ];

  const swiperConfig = {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    coverflowEffect: {
      rotate: 50,
      stretch: 0,
      depth: 100,
      modifier: 1,
    },
    pagination: true,
    modules: [EffectCoverflow, Pagination],
    className: "mySwiper"
  };

  return (
    <section id="gallery" className="gallery section light-background">
      {/* Section Title */}
      <div className="container section-title" data-aos="fade-up">
        <p>
          <span className="description-title">Không gian</span>
        </p>
        <h2>Không gian tại Sincay</h2>
      </div>

      {/* Gallery Slider */}
      <Swiper {...swiperConfig}>
        {galleryImages.map((image, index) => (
          <SwiperSlide key={`${image.src}-${index}`}>
            <Image
              src={image.src}
              className="img-fluid"
              alt={`Không gian Sincay ${index + 1}`}
              width={image.width}
              height={image.height}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}