import { useCrt } from '../crt';
import Panel from '../panel';

const Settings = () => {
  const { crt, setCrt } = useCrt();

  return (
    <Panel title="SETTINGS">
      <div className="setting">
        <span>CRT EFFECT</span>

        <button type="button" className="btn" role="switch" aria-checked={crt} onClick={() => setCrt(!crt)}>
          {crt ? 'ON' : 'OFF'}
        </button>
      </div>

      <p className="panel-note">Scanlines and a soft glow, like the monitors this was first played on.</p>
    </Panel>
  );
};

export default Settings;
