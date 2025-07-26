import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple test to verify our testing framework works
describe('Testing Framework Setup', () => {
  it('should have access to testing utilities', () => {
    expect(render).toBeDefined();
    expect(screen).toBeDefined();
  });

  it('should support custom matchers', () => {
    const element = document.createElement('div');
    element.textContent = 'Hello World';
    document.body.appendChild(element);
    
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Hello World');
    
    document.body.removeChild(element);
  });

  it('should handle DOM manipulation', () => {
    const div = document.createElement('div');
    div.className = 'test-class';
    div.textContent = 'Test content';
    
    expect(div).toHaveClass('test-class');
    expect(div).toHaveTextContent('Test content');
  });
}); 