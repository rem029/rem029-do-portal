import Modal, { ModalProps } from "../modal";

const ModalHowTo = ({ isOpen, onClose }: Omit<ModalProps, "children">) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How to use this offer?">
      <div className="p-4 flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <h6 className="text-secondary">Inform the staff</h6>
          <p>That’s their cue you’re claiming your perk.</p>
        </div>

        <div className="flex flex-col gap-2">
          <h6 className="text-secondary">Let them enter the code.</h6>
          <p>When you see the confirmation, your discount is locked in—enjoy!</p>
        </div>

        <div className="w-full min-h-6"></div>
      </div>
    </Modal>
  );
};

export default ModalHowTo;
