"use client";
import { useEffect } from "react";

export default function Stats() {
  useEffect(() => {
    // Ensure PureCounter is initialized after component mounts
    if (typeof window !== 'undefined' && window.PureCounter) {
      new window.PureCounter();
    }
  }, []);

  return (
    <>
      <section id="stats" className="stats section dark-background">
        <picture><img src="/img/Banner1.webp" alt="" data-aos="fade-in" /></picture>
        <div className="container position-relative" data-aos="fade-up" data-aos-delay={100}>
          <div className="row gy-4">
            <div className="col-lg-3 col-md-6">
              <div className="stats-item text-center w-100 h-100">
                <span data-purecounter-start={0} data-purecounter-end={1228} data-purecounter-duration={1} className="purecounter">0</span>
                <p>Khách hàng</p>
              </div>
            </div>
            {/* End Stats Item */}
            <div className="col-lg-3 col-md-6">
              <div className="stats-item text-center w-100 h-100">
                <span data-purecounter-start={0} data-purecounter-end={32000} data-purecounter-duration={1} className="purecounter">0</span>
                <p>Theo dõi</p>
              </div>
            </div>
            {/* End Stats Item */}
            <div className="col-lg-3 col-md-6">
              <div className="stats-item text-center w-100 h-100">
                <span data-purecounter-start={0} data-purecounter-end={375} data-purecounter-duration={1} className="purecounter">0</span>
                <p>Phản hồi tốt</p>
              </div>
            </div>
            {/* End Stats Item */}
            <div className="col-lg-3 col-md-6">
              <div className="stats-item text-center w-100 h-100">
                <span data-purecounter-start={0} data-purecounter-end={238} data-purecounter-duration={1} className="purecounter">0</span>
                <p>Đặt bàn/ngày</p>
              </div>
            </div>
            {/* End Stats Item */}
          </div>
        </div>
      </section>
      {/* /Stats Section */}
    </>
  );
}
