"use client";
import { usePathname } from "next/navigation";
import Footer from "./component/footer";
import FloatingChatBox from "./component/FloatingChatBox";
import Header from "./component/header";

export default function LayoutWrapper({ children }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <>
            {!isAdmin && <Header />}
            <main>{children}</main>
            {!isAdmin && <Footer />}
            {!isAdmin && <FloatingChatBox />}

            {!isAdmin && (
                <a
                    href="#hero"
                    id="scroll-top"
                    className="scroll-top d-flex align-items-center justify-content-center"
                    aria-label="Cuộn lên đầu trang"
                >
                    <i className="bi bi-arrow-up-short" aria-hidden="true" />
                </a>
            )}
        </>
    );
}
