import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import styles from './App.module.scss';
import { Header } from './Header';
import { CheckoutPage } from './pages/CheckoutPage';

export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className={styles.wrapper}>
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to="/checkout" replace />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
