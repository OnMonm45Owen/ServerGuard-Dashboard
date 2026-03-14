import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // 💡 แก้ไขจุดนี้เพื่อลบ ESLint Error
  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-[2rem] border-4 border-rose-600 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-rose-600 mb-4 uppercase">System Crash</h1>
            <p className="text-slate-600 font-bold mb-6">พบข้อผิดพลาดบางอย่างในระบบ ServerGuard</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase"
            >
              Restart System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;