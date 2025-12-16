import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('renders register page', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  
  // Check that some text from Register page exists
  const registerText = screen.getByText(/Register/i);
  expect(registerText).toBeInTheDocument();
});
