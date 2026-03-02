"use client";

import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { useRef, useEffect } from "react";
import Image from "next/image";

export default function Events() {
  const mainRef = useRef(null);
  const thumbsRef = useRef(null);

  useEffect(() => {
    if (mainRef.current && thumbsRef.current) {
      mainRef.current.sync(thumbsRef.current.splide);
    }
  }, []);

  const events = [
    {
      id: 1,
      type: "Tin tức",
      title: "Ra mắt MEMBERSHIP",
      description: "CHÍNH THỨC RA MẮT CHƯƠNG TRÌNH MEMBERSHIP",
      mainImage: "/img/events_1.jpg",
      thumbImage: "/img/events_1.jpg"
    },
    {
      id: 2,
      type: "Sự kiện",
      title: "Ưu đãi",
      description: "Mì Tương Đen Chuẩn Vị Hàn – Ưu Đãi Từ 59K, Ăn Là Mê!",
      mainImage: "/img/events_2.png",
      thumbImage: "/img/events_2.png"
    },
    {
      id: 3,
      type: "Tin tức",
      title: "Ra mắt",
      description: "Thử ngay kẻo lỡ thực đơn Hàn Quốc mới toanh 'sang xịn mịn'",
      mainImage: "/img/events_3.jpg",
      thumbImage: "/img/events_3.jpg"
    }
  ];

  const duplicatedEvents = [...events, ...events];

  return (
    <section id="events" className="events section">
      {/* Section Title */}
      <div className="container section-title" data-aos="fade-up">
        <p>
          <span className="description-title">Sự kiện</span>
        </p>
        <h2>Sự kiện tại Sincay</h2>
      </div>

      {/* Events Carousel */}
      <div className="container mt-5">
        <div className="row g-4 d-flex">
          {/* Main Carousel */}
          <div className="col-lg-7 col-md-7 overflow-hidden">
            <Splide
              ref={mainRef}
              options={{
                type: "fade",
                pagination: false,
                height: "500px",
                arrows: false,
              }}
              aria-label="Sự kiện chính"
            >
              {duplicatedEvents.map((event, index) => (
                <SplideSlide key={`main-${event.id}-${index}`}>
                  <div
                    className="event-item d-flex flex-column justify-content-end p-4"
                    style={{
                      backgroundImage: `url(${event.mainImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      height: "100%",
                    }}
                  >
                    <h3>{event.type}</h3>
                    <div className="tit align-self-start">{event.title}</div>
                    <p className="description">{event.description}</p>
                  </div>
                </SplideSlide>
              ))}
            </Splide>
          </div>

          {/* Thumbnail Carousel */}
          <div className="col-lg-5 col-md-5">
            <Splide
              ref={thumbsRef}
              options={{
                fixedHeight: 180,
                gap: 10,
                direction: "ttb",
                height: "500px",
                pagination: false,
                cover: true,
                isNavigation: true,
                arrows: true
              }}
              aria-label="Danh sách sự kiện"
            >
              {duplicatedEvents.map((event, index) => (
                <SplideSlide key={`thumb-${event.id}-${index}`}>
                  <div className="card d-flex flex-row h-100">
                    <div className="cardimg">
                      <Image
                        src={event.thumbImage}
                        alt={event.title}
                        width={200}
                        height={175}
                        className="object-fit-cover"
                      />
                    </div>
                    <div className="card-body h-100 w-75">
                      <h5 className="card-title">{event.title}</h5>
                      <p className="card-text">{event.description}</p>
                    </div>
                  </div>
                </SplideSlide>
              ))}
            </Splide>
          </div>
        </div>
      </div>
    </section>
  );
}