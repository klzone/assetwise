import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Toast, ToastTitle, ToastDescription, ToastClose, ToastProvider, ToastViewport } from '../toast'

describe('Toast Components', () => {
  const TestToastProvider = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      {children}
      <ToastViewport />
    </ToastProvider>
  )

  describe('Toast', () => {
    it('renders with default variant', () => {
      render(
        <TestToastProvider>
          <Toast open={true}>
            <ToastTitle>Test Title</ToastTitle>
            <ToastDescription>Test Description</ToastDescription>
          </Toast>
        </TestToastProvider>
      )

      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
    })

    it('renders with success variant', () => {
      render(
        <TestToastProvider>
          <Toast open={true} variant="success">
            <ToastTitle>Success</ToastTitle>
          </Toast>
        </TestToastProvider>
      )

      const toast = screen.getByText('Success').closest('[data-state="open"]')
      expect(toast).toHaveClass('border-green-200')
    })

    it('renders with destructive variant', () => {
      render(
        <TestToastProvider>
          <Toast open={true} variant="destructive">
            <ToastTitle>Error</ToastTitle>
          </Toast>
        </TestToastProvider>
      )

      const toast = screen.getByText('Error').closest('[data-state="open"]')
      expect(toast).toHaveClass('destructive')
    })

    it('renders with warning variant', () => {
      render(
        <TestToastProvider>
          <Toast open={true} variant="warning">
            <ToastTitle>Warning</ToastTitle>
          </Toast>
        </TestToastProvider>
      )

      const toast = screen.getByText('Warning').closest('[data-state="open"]')
      expect(toast).toHaveClass('border-yellow-200')
    })
  })

  describe('ToastClose', () => {
    it('renders close button', () => {
      render(
        <TestToastProvider>
          <Toast open={true}>
            <ToastTitle>Test</ToastTitle>
            <ToastClose />
          </Toast>
        </TestToastProvider>
      )

      const closeButton = screen.getByRole('button')
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveAttribute('toast-close', '')
    })

    it('calls onOpenChange when clicked', () => {
      const onOpenChange = jest.fn()
      
      render(
        <TestToastProvider>
          <Toast open={true} onOpenChange={onOpenChange}>
            <ToastTitle>Test</ToastTitle>
            <ToastClose />
          </Toast>
        </TestToastProvider>
      )

      const closeButton = screen.getByRole('button')
      fireEvent.click(closeButton)
      
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('ToastTitle', () => {
    it('renders title text', () => {
      render(
        <TestToastProvider>
          <Toast open={true}>
            <ToastTitle>Custom Title</ToastTitle>
          </Toast>
        </TestToastProvider>
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(
        <TestToastProvider>
          <Toast open={true}>
            <ToastTitle className="custom-class">Title</ToastTitle>
          </Toast>
        </TestToastProvider>
      )

      expect(screen.getByText('Title')).toHaveClass('custom-class')
    })
  })

  describe('ToastDescription', () => {
    it('renders description text', () => {
      render(
        <TestToastProvider>
          <Toast open={true}>
            <ToastDescription>Custom Description</ToastDescription>
          </Toast>
        </TestToastProvider>
      )

      expect(screen.getByText('Custom Description')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(
        <TestToastProvider>
          <Toast open={true}>
            <ToastDescription className="custom-desc">Description</ToastDescription>
          </Toast>
        </TestToastProvider>
      )

      expect(screen.getByText('Description')).toHaveClass('custom-desc')
    })
  })

  describe('ToastProvider and ToastViewport', () => {
    it('renders viewport container', () => {
      const { container } = render(
        <TestToastProvider>
          <Toast open={true}>
            <ToastTitle>Test</ToastTitle>
          </Toast>
        </TestToastProvider>
      )

      // ToastViewport should be rendered - check for the viewport element
      const viewport = container.querySelector('[data-radix-toast-viewport]') ||
                      container.querySelector('[role="region"]') ||
                      container.querySelector('.fixed')
      expect(viewport).toBeTruthy()
    })
  })
})
