import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-raised)',
            color: 'var(--color-fg)',
            border: '2px solid var(--color-ink)',
            borderRadius: '10px',
            boxShadow: '4px 4px 0 var(--color-shadow)',
            fontWeight: 700,
            fontSize: '13px',
          },
        }}
      />
      <App />
    </>,
  );
}
