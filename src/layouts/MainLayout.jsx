import Navbar from "../components/Navbar";

function MainLayout({ children }) {
    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Navbar />

            <div style={{
                padding: "40px",
                maxWidth: "1200px",
                margin: "0 auto"
            }}>
                {children}
            </div>
        </div>
    );
}

export default MainLayout;