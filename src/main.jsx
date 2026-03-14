import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary' // นำเข้า
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary> {/* หุ้ม App ไว้ */}
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)