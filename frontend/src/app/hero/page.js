"use client";
import "aos/dist/aos.css";
import Image from "next/image";
export default function Hero() {


  return (
    <>
      <section id="hero" className="hero section light-background">
        <div className="container">
          <div className="row gy-4 justify-content-center justify-content-lg-between">
            <div className="col-lg-5 order-2 order-lg-1 d-flex flex-column justify-content-center">
              <h2 className="heroTitle" data-aos="fade-up" data-aos-delay={500}>
                Mì cay chuẩn vị Hàn Quốc
              </h2>
              <p data-aos="fade-up" data-aos-delay={1000} className="mb-5">
                Từ cay nồng đến ngọt ngào <br /> Một hành trình vị giác đầy cảm
                xúc!
              </p>
              <div className="d-flex" data-aos="fade-up" data-aos-delay={2000}>
                <a href="#book-a-table" className="btn-get-started">
                  Đặt bàn
                </a>
                <a
                  href="https://youtu.be/MsGIf7yjvVY?si=vPe4rflnyE9mNtKE"
                  className="glightbox btn-watch-video d-flex align-items-center">
                  <i className="bi bi-play-circle" />
                  <span>Xem Video</span>
                </a>
              </div>
            </div>
            <div
              className="col-lg-5 order-1 order-lg-2 hero-img"
              data-aos="zoom-out">
              <Image
                src="/img/NoNe.png"
                alt="Hero"
                width={600}
                height={400}
                className="img-fluid animated  "
                priority
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}