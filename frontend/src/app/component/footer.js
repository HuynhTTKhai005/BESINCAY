export default function Footer() {
  return (
    <footer id="footer" className="footer dark-background">
      <div className="container">
        <div className="row gy-3">
          {/* Address */}
          <div className="col-lg-3 col-md-6 d-flex">
            <i className="bi bi-geo-alt icon" aria-hidden="true" />
            <div className="address">
              <h4>Địa chỉ</h4>
              <p>12 D. Trịnh Đình Thảo, Hòa Thạnh</p>
              <p>Tân Phú, Hồ Chí Minh</p>
            </div>
          </div>

          {/* Contact */}
          <div className="col-lg-3 col-md-6 d-flex">
            <i className="bi bi-telephone icon" aria-hidden="true" />
            <div>
              <h4>Liên hệ</h4>
              <p>
                <strong>Số điện thoại:</strong> +84 982 348 293<br />
                <strong>Email:</strong> mycaysincay@gmail.com
              </p>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="col-lg-3 col-md-6 d-flex">
            <i className="bi bi-clock icon" aria-hidden="true" />
            <div>
              <h4>Giờ mở cửa</h4>
              <p>
                <strong>Thứ 2 - Thứ 7:</strong> 11:00 - 23:00<br />
                <strong>Chủ nhật:</strong> Đóng cửa
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="col-lg-3 col-md-6">
            <h4>Theo dõi chúng tôi</h4>
            <div className="social-links d-flex">
              <a href="#" className="twitter" aria-label="Twitter">
                <i className="bi bi-twitter-x" aria-hidden="true" />
              </a>
              <a href="#" className="facebook" aria-label="Facebook">
                <i className="bi bi-facebook" aria-hidden="true" />
              </a>
              <a href="#" className="instagram" aria-label="Instagram">
                <i className="bi bi-instagram" aria-hidden="true" />
              </a>
              <a href="#" className="linkedin" aria-label="LinkedIn">
                <i className="bi bi-linkedin" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="container copyright text-center mt-4">
        <p>
          © <span>Copyright</span>{" "}
          <strong className="px-1 sitename">Sincay</strong>{" "}
          <span>All Rights Reserved</span>
        </p>
        <div className="credits">
          Designed by <a href="https://www.facebook.com/huynhTTkhai">KhaiHuynh</a>{" "}
          
        </div>
      </div>
    </footer>
  );
}