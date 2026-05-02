import { render, screen } from '@testing-library/react'
import { CardSkeleton, TableSkeleton, PageSkeleton } from '../components/Skeleton'

describe('Skeleton components', () => {
  it('renders CardSkeleton with animated elements', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders TableSkeleton with correct row count', () => {
    const { container } = render(<TableSkeleton rows={5} cols={4} />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(5)
  })

  it('renders PageSkeleton with spinner', () => {
    const { container } = render(<PageSkeleton />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
