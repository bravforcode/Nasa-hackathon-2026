import '../../test/setup';
import { describe, expect, it } from 'bun:test';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input Primitive', () => {
  it('links label to input via auto-generated id', () => {
    const { getByLabelText } = render(<Input label="Transmitter Frequency" placeholder="GHz" />);
    const input = getByLabelText('Transmitter Frequency');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'GHz');
  });

  it('renders error and sets aria-invalid + aria-describedby', () => {
    const { getByLabelText, getByRole } = render(<Input label="Relay ID" error="Invalid relay node identifier" />);
    const input = getByLabelText('Relay ID');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const errorMsg = getByRole('alert');
    expect(errorMsg).toHaveTextContent('Invalid relay node identifier');
  });

  it('handles typing and onChange events', async () => {
    let val = '';
    const { getByLabelText } = render(<Input label="Target Lat" onChange={(e) => { val = e.target.value; }} />);
    const input = getByLabelText('Target Lat');
    await userEvent.type(input, '89');
    expect(val).toBe('89');
  });
});
