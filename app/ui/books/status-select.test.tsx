import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StatusState } from '@/app/lib/actions'
import StatusSelect from './status-select'

const { updateBookStatus } = vi.hoisted(() => ({
  updateBookStatus:
    vi.fn<(id: number, prevState: StatusState, formData: FormData) => Promise<StatusState>>(),
}))

vi.mock('@/app/lib/actions', () => ({ updateBookStatus }))

describe('StatusSelect', () => {
  beforeEach(() => {
    updateBookStatus.mockReset()
  })

  it('submits the chosen status', async () => {
    updateBookStatus.mockResolvedValue({ message: null })
    const user = userEvent.setup()
    render(<StatusSelect id={7} title="Dune" status="reading" />)

    const select = screen.getByRole('combobox', { name: 'Status of Dune' })
    expect(select).toHaveDisplayValue('Reading')

    await user.selectOptions(select, 'read')

    await vi.waitFor(() => expect(updateBookStatus).toHaveBeenCalledTimes(1))
    const [id, , formData] = updateBookStatus.mock.calls[0]
    expect(id).toBe(7)
    expect(formData.get('status')).toBe('read')
  })

  it('shows the error and the saved status when saving fails', async () => {
    let fail!: (state: StatusState) => void
    updateBookStatus.mockReturnValue(
      new Promise<StatusState>((resolve) => {
        fail = resolve
      }),
    )
    const user = userEvent.setup()
    render(<StatusSelect id={7} title="Dune" status="reading" />)

    const select = screen.getByRole('combobox', { name: 'Status of Dune' })
    await user.selectOptions(select, 'read')

    // While the save is pending the select shows the chosen status.
    expect(select).toHaveDisplayValue('Read')

    fail({ message: 'Could not save the status. Please try again.' })

    expect(
      await screen.findByText('Could not save the status. Please try again.'),
    ).toBeInTheDocument()
    expect(select).toHaveDisplayValue('Reading')
    expect(select).toHaveValue('reading')
  })
})
