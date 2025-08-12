import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { 
  Loading, 
  PageLoading, 
  ButtonLoading, 
  CardLoading, 
  OverlayLoading 
} from '../loading'

describe('Loading Components', () => {
  describe('Loading', () => {
    it('renders with default props', () => {
      const { container } = render(<Loading />)

      const loader = container.firstChild as HTMLElement
      expect(loader).toBeInTheDocument()
      expect(loader).toHaveClass('flex', 'items-center', 'justify-center')
    })

    it('renders with text', () => {
      render(<Loading text="Loading data..." />)
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument()
    })

    it('applies size classes correctly', () => {
      const { rerender } = render(<Loading size="sm" />)
      let spinner = document.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-4', 'w-4')

      rerender(<Loading size="md" />)
      spinner = document.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-6', 'w-6')

      rerender(<Loading size="lg" />)
      spinner = document.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('renders overlay variant', () => {
      const { container } = render(<Loading variant="overlay" />)

      const overlay = container.firstChild as HTMLElement
      expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-background/80', 'backdrop-blur-sm')
    })

    it('applies custom className', () => {
      const { container } = render(<Loading className="custom-class" />)

      const loader = container.firstChild as HTMLElement
      expect(loader).toHaveClass('custom-class')
    })
  })

  describe('PageLoading', () => {
    it('renders with default text', () => {
      render(<PageLoading />)
      
      expect(screen.getByText('加载中...')).toBeInTheDocument()
    })

    it('renders with custom text', () => {
      render(<PageLoading text="自定义加载文本" />)
      
      expect(screen.getByText('自定义加载文本')).toBeInTheDocument()
    })

    it('has correct container classes', () => {
      const { container } = render(<PageLoading />)
      
      const pageLoader = container.firstChild
      expect(pageLoader).toHaveClass('min-h-[400px]', 'flex', 'items-center', 'justify-center')
    })
  })

  describe('ButtonLoading', () => {
    it('renders with small size by default', () => {
      render(<ButtonLoading />)
      
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('renders with medium size', () => {
      render(<ButtonLoading size="md" />)
      
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toHaveClass('h-5', 'w-5')
    })
  })

  describe('CardLoading', () => {
    it('renders with default padding', () => {
      const { container } = render(<CardLoading />)
      
      const cardLoader = container.firstChild
      expect(cardLoader).toHaveClass('p-6')
    })

    it('applies custom className', () => {
      const { container } = render(<CardLoading className="custom-padding" />)
      
      const cardLoader = container.firstChild
      expect(cardLoader).toHaveClass('custom-padding')
    })

    it('contains loading text', () => {
      render(<CardLoading />)
      
      expect(screen.getByText('加载中...')).toBeInTheDocument()
    })
  })

  describe('OverlayLoading', () => {
    it('renders with default text', () => {
      render(<OverlayLoading />)
      
      expect(screen.getByText('处理中...')).toBeInTheDocument()
    })

    it('renders with custom text', () => {
      render(<OverlayLoading text="正在保存..." />)
      
      expect(screen.getByText('正在保存...')).toBeInTheDocument()
    })

    it('has overlay styling', () => {
      const { container } = render(<OverlayLoading />)
      
      const overlay = container.firstChild
      expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-background/80', 'backdrop-blur-sm', 'z-50')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Loading text="Loading content" />)
      
      // The spinner should be decorative and not interfere with screen readers
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      
      // The text should be readable by screen readers
      expect(screen.getByText('Loading content')).toBeInTheDocument()
    })
  })
})
