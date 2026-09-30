import { DigitalTwin } from '@/components/DigitalTwin';
import { ControlPanel } from '@/components/ControlPanel';

export default function Home() {
  return (
    <main className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-box">RF6</div>
          <div className="header-titles">
            <h1>ROBOFEST 6.0</h1>
            <h2>MAGNETIC HULL CUTTING ROBOT</h2>
          </div>
        </div>
        
        <div className="header-center">
          <span className="digital-twin-label">DIGITAL TWIN</span>
          <span className="placeholder-warning">PHASE 1 — PLACEHOLDER MECHANICAL MODEL</span>
        </div>

        <div className="header-status">
          <span className="status-label">Status:</span>
          <div className="status-badge phase-1">
            <span className="pulse-dot"></span> SIMULATION MODE
          </div>
        </div>
      </header>
      
      <div className="workspace">
        <section className="visualization-section">
          <DigitalTwin />
        </section>
        
        <aside className="control-section">
          <ControlPanel />
        </aside>
      </div>
    </main>
  );
}
