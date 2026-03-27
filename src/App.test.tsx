/**
 * Setup Tests - Verify React components basic rendering
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders rover management dashboard', () => {
  render(<App />);
  const titleElement = screen.getByText(/Rover Management/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders dashboard header text', () => {
  render(<App />);
  const subtitleElement = screen.getByText(/Manage and monitor your rover fleet/i);
  expect(subtitleElement).toBeInTheDocument();
});
