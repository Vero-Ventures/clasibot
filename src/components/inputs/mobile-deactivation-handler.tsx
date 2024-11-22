'use client';

import React, { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';

import { makeCompanyIncactive } from '@/actions/backend-actions/database-functions/index';

import {
  DeactivateInfoModal,
  DeactivateConfirmModal,
  DeactivateErrorModal,
} from '@/components/modals/index';

interface DeactivationButtonProps {
  setShowModal: (newState: boolean) => void;
}

export const MobileDeactivationButton: React.FC<DeactivationButtonProps> = ({
  setShowModal,
}) => {
  // State trackers to indicate which modals should be displayed to the user.
  const [infoModalOpen, setInfoModalOpen] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  // Define wrappers of state setting functions to also set the mobile modals to be hidden.
  // Sets the modals to be hidden and the info modal to be shown.
  function closeConfirmModal() {
    setShowModal(false);
    setConfirmModalOpen(false);
    setInfoModalOpen(true);
  }

  function closeErrorModal() {
    setShowModal(false);
    setInfoModalOpen(false);
    setInfoModalOpen(true);
  }

  // Helper function to allow buttons to switch from info to confirmation modal through single call.
  function openConfirmationModal() {
    setInfoModalOpen(false);
    setConfirmModalOpen(true);
  }

  // Deactivate database Company object handler.
  async function deactivateCompany(switchCompany: boolean) {
    // Get the deactivation result and check for an error.
    const deactivationResult = await makeCompanyIncactive();

    if (deactivationResult.result === 'Error') {
      // Close the confirmation modal and open the error modal.
      setConfirmModalOpen(false);
      setErrorModalOpen(true);
    }

    // If the switch Company option was selected, redirect the user to Company selection.
    if (switchCompany) {
      signIn('quickbooks', { callbackUrl: '/home' });
    } else {
      // Otherwise, sign the user out.
      signOut({ callbackUrl: '/' });
    }
  }

  return (
    <>
      {
        <DeactivateInfoModal
          displayState={infoModalOpen}
          setDisplayState={setShowModal}
          switchToInfoModal={openConfirmationModal}></DeactivateInfoModal>
      }

      {
        <DeactivateConfirmModal
          displayState={confirmModalOpen}
          setDisplayState={closeConfirmModal}
          deactivateCompany={deactivateCompany}></DeactivateConfirmModal>
      }

      {
        <DeactivateErrorModal
          displayState={errorModalOpen}
          setDisplayState={closeErrorModal}></DeactivateErrorModal>
      }
    </>
  );
};
