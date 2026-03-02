"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import Image from "next/image";
import "swiper/css";
import "swiper/css/pagination";

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Lê Dương Bảo Lâm",
      role: "Kỹ sư",
      content: "Không gian sạch sẽ, nhân viên thân thiện. Mì cay cấp độ 3 là vừa đủ, ăn ngon mà không bị quá gắt.",
      image: "/img/testimonials/testimonials-1.jpg",
      rating: 4
    },
    {
      id: 2,
      name: "Huỳnh Em Ty Pi",
      role: "Doanh nhân",
      content: "Topping đầy đủ, nước dùng đậm đà. Mình đi nhóm 4 người ai cũng gọi thêm nước vì quá ngon.",
      image: "/img/testimonials/testimonials-2.jpg",
      rating: 5
    },
    {
      id: 3,
      name: "Trần Tuấn Phương",
      role: "Ca sĩ",
      content: "Giá hơi nhỉnh hơn mấy quán khác nhưng chất lượng thì xứng đáng. Mình sẽ quay lại",
      image: "/img/testimonials/testimonials-3.jpg",
      rating: 4
    },
    {
      id: 4,
      name: "Nguyễn Thiên An",
      role: "Sinh viên",
      content: "Giá hơi nhỉnh hơn mấy quán khác nhưng chất lượng thì xứng đáng. Mình sẽ quay lại",
      image: "/img/testimonials/testimonials-4.jpg",
      rating: 5
    }
  ];

  const swiperConfig = {
    modules: [Pagination, Autoplay],
    pagination: { clickable: true },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    spaceBetween: 30,
    className: "mySwiper"
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="stars">
        {[...Array(rating)].map((_, index) => (
          <i key={index} className="bi bi-star-fill" />
        ))}
      </div>
    );
  };

  const TestimonialItem = ({ testimonial }) => (
    <div className="testimonial-item">
      <div className="row gy-4 justify-content-center">
        <div className="col-lg-6">
          <div className="testimonial-content">
            <p>
              <i className="bi bi-quote quote-icon-left" />
              <span>{testimonial.content}</span>
              <i className="bi bi-quote quote-icon-right" />
            </p>
            <h3>{testimonial.name}</h3>
            <h4>{testimonial.role}</h4>
            <StarRating rating={testimonial.rating} />
          </div>
        </div>
        <div className="col-lg-2 text-center">
          <Image
            src={testimonial.image}
            className="img-fluid testimonial-img"
            alt={`Ảnh của ${testimonial.name}`}
            width={100}
            height={100}
          />
        </div>
      </div>
    </div>
  );

  return (
    <section id="testimonials" className="testimonials section light-background">
      {/* Section Title */}
      <div className="container section-title" data-aos="fade-up">
        <p>
          <span className="description-title">Cảm nhận khách hàng</span>
        </p>
        <h2>Khách hàng nói gì về Sincay</h2>
      </div>

      <div className="container" data-aos="fade-up" data-aos-delay={100}>
        <Swiper {...swiperConfig}>
          {testimonials.map((testimonial) => (
            <SwiperSlide key={testimonial.id}>
              <TestimonialItem testimonial={testimonial} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}