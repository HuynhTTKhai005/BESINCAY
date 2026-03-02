export default function WhyUs() {
  return (
    <section id="why-us" className="why-us section light-background">
      <div className="container">
        <div className="row gy-4">
          {/* Why Box */}
          <div className="col-lg-4" data-aos="fade-up" data-aos-delay={100}>
            <div className="why-box h-100">
              <h3>Tại sao chọn Sincay</h3>
              <p>
                Thưởng thức hương vị cay nồng đậm đà, chuẩn vị Hàn Quốc ngay giữa lòng Sài Gòn.
                Mỗi tô mì là một trải nghiệm ẩm thực đầy cảm xúc, từ sợi mì dai ngon đến nước dùng đậm đà khó quên.
                Mỗi cấp độ là một trải nghiệm khác biệt, đầy kích thích. Kết hợp 3 vị nước dùng riêng biệt.
              </p>
              <div className="text-center">
                <a href="#about" className="more-btn">
                  <span>Khám phá ngay</span>
                  <i className="bi bi-chevron-right" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="col-lg-8 d-flex align-items-stretch">
            <div className="row gy-4" data-aos="fade-up" data-aos-delay={200}>
              {/* Feature 1 - Spice Levels */}
              <div className="col-xl-4">
                <div className="icon-box d-flex flex-column justify-content-center align-items-center">
                  <i className="bi bi-fire" aria-hidden="true" />
                  <h4>Cấp độ cay đa dạng</h4>
                  <p>
                    Từ cấp độ 0 đến cấp độ 7, bạn có thể chọn độ cay phù hợp với khẩu vị
                    hoặc thử thách bản thân với những cấp độ cao hơn. Cứ thoải mái thử thách bản thân.
                  </p>
                </div>
              </div>

              {/* Feature 2 - Fast Service */}
              <div className="col-xl-4" data-aos="fade-up" data-aos-delay={300}>
                <div className="icon-box d-flex flex-column justify-content-center align-items-center">
                  <i className="bi bi-lightning" aria-hidden="true" />
                  <h4>Phục vụ nhanh chóng</h4>
                  <p>
                    Dù bạn đến một mình hay cùng nhóm bạn, chúng tôi luôn phục vụ nhanh chóng,
                    chu đáo để bạn có trải nghiệm trọn vẹn nhất.
                  </p>
                </div>
              </div>

              {/* Feature 3 - Modern Space */}
              <div className="col-xl-4" data-aos="fade-up" data-aos-delay={400}>
                <div className="icon-box d-flex flex-column justify-content-center align-items-center">
                  <i className="bi bi-buildings" aria-hidden="true" />
                  <h4>Không gian hiện đại</h4>
                  <p>
                    Thiết kế trẻ trung, sạch sẽ, phù hợp cho cả hẹn hò, gặp gỡ bạn bè hay làm việc.
                    Sincay không chỉ là nhà hàng, mà là nơi bạn muốn quay lại.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}