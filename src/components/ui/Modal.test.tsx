import '../../test/setup';
import { describe, expect, it } from 'bun:test';
import { render, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal Primitive', () => {
  it('does not render when isOpen is false', () => {
    const { queryByRole } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        Modal Content
      </Modal>
    );
    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders with dialog role, title and description when isOpen is true', () => {
    const { getByRole, getByText } = render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Mission Briefing"
        description="South Pole Operations"
      >
        Content details
      </Modal>
    );
    const dialog = getByRole('dialog', { name: 'Mission Briefing' });
    expect(dialog).toBeInTheDocument();
    expect(getByText('South Pole Operations')).toBeInTheDocument();
    expect(getByText('Content details')).toBeInTheDocument();
  });

  it('calls onClose when close icon button is clicked', () => {
    let closed = false;
    const { getByRole } = render(
      <Modal isOpen={true} onClose={() => { closed = true; }} title="Close Test">
        Body
      </Modal>
    );
    const closeBtn = getByRole('button', { name: 'Close dialog' });
    fireEvent.click(closeBtn);
    expect(closed).toBe(true);
  });

  it('calls onClose when Escape key is pressed', () => {
    let closed = false;
    render(
      <Modal isOpen={true} onClose={() => { closed = true; }} title="Escape Test">
        Body
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(closed).toBe(true);
  });
});
