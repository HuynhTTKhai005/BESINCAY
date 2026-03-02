import Image from "next/image";

export default function About() {
  return (
    <>
      <section id="about" className="about section">
        {/* Section Title */}
        <div className="container section-title" data-aos="fade-up">
          <p>
            <span className="description-title">Về chúng tôi</span>
          </p>
          <h2>Nhiều hơn về chúng tôi</h2>
        </div>

        <div className="container">
          <div className="row gy-4">
            {/* Image Column */}
            <div className="col-lg-7" data-aos="fade-up" data-aos-delay={100}>
              <Image
                src="/img/cb2.webp"
                width={710}
                height={559} style={{ width: "100%", height: "auto" }}
                className="img-fluid object-fit-contain rounded"
                alt="Nhà hàng Sincay"
                priority
              />
              <div className="book-a-table">
                <h3>Đặt bàn</h3>
                <p>+84 982 348 293</p>
              </div>
            </div>

            {/* Content Column */}
            <div className="col-lg-5" data-aos="fade-up" data-aos-delay={250}>
              <div className="content ps-0 ps-lg-5">
                <p className="fst-italic">
                  Sincay là chuỗi thương hiệu ẩm thực Hàn Quốc ra mắt vào năm 2025 và đã trở thành
                  một trong những lựa chọn hàng đầu của giới trẻ Việt Nam khi muốn thưởng thức
                  mì cay hương vị Hàn Quốc.
                </p>

                <ul>
                  <li>
                    <i className="bi bi-check-circle-fill" />
                    <span>Mì cay 7 cấp độ hấp dẫn bởi độ cay thách thức kết hợp với vị ngon đậm đà.</span>
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill" />
                    <span>7 cấp độ được sử dụng như một phép ẩn dụ, với mỗi cấp độ đại diện cho một bước nhỏ hướng tới mục tiêu cuối cùng.</span>
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill" />
                    <span>Mức độ cay thứ 7 là nơi chúng ta mong muốn đạt tới</span>
                  </li>
                </ul>

                <p>
                  Sincay muốn là thương hiệu luôn ủng hộ những người trẻ đạt được thành công và
                  chia sẻ thành công này với những người thân yêu của họ.
                </p>

                <div className="position-relative mt-4">
                  <Image
                    src="/img/panchan.webp"
                    width={500}
                    height={300}
                    className="img-fluid"
                    alt="Món ăn kèm Panchan"
                  />
                  <a
                    href="https://youtu.be/MsGIf7yjvVY?si=vPe4rflnyE9mNtKE"
                    className="glightbox pulsating-play-btn"
                    aria-label="Xem video giới thiệu"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}