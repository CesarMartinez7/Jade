import ReactDOM from 'react-dom/client';
import Aurora from './ui/aurora/Aurora';
import App from './App';
import { Toaster } from 'react-hot-toast';
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <>
     <div className="z-0 fixed">
      <Aurora
        colorStops={['#27272a', '#00d1b2', '#11181b']}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />
    </div>
    <Toaster
      toastOptions={{
        className: 'bg-zinc-700! text-white!',
      }}
    />
    <App />
    
    </>
  );
}
