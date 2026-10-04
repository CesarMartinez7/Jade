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
            border: '1px solid var(--color-line-strong)',
            borderRadius: '12px',
            fontSize: '12px',
          },
        }}
      />
      <App />
    </>,
  );
}
