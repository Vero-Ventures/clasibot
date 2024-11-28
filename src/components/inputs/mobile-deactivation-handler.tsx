'use client';

import React from 'react';
import { signOut } from 'next-auth/react';

import { makeCompanyIncactive } from '@/actions/connection-functions';

import {
  DeactivateInfoModal,
  DeactivateConfirmModal,
  DeactivateErrorModal,
} from '@/components/modals/index';

interface DeactivationButtonProps {
  setShowModal: (newState: boolean) => void;
  infoModalOpen: boolean;
  confirmModalOpen: boolean;
  errorModalOpen: boolean;
  setInfoModalOpen: (newState: boolean) => void;
  setConfirmModalOpen: (newState: boolean) => void;
  setErrorModalOpen: (newState: boolean) => void;
}

export const MobileDeactivationButton: React.FC<DeactivationButtonProps> = ({
  setShowModal,
  infoModalOpen,
  confirmModalOpen,
  errorModalOpen,
  setInfoModalOpen,
  setConfirmModalOpen,
  setErrorModalOpen,
}) => {
  // Helper function to close the modals and the info modal to closed as well.
  function hideModals(hideState: boolean) {
    setShowModal(hideState);
    setInfoModalOpen(hideState);
    setConfirmModalOpen(hideState);
    setErrorModalOpen(hideState);
  }

  // Helper function to allow buttons to switch from info to confirmation modal through single call.
  function openConfirmationModal() {
    setInfoModalOpen(false);
    setConfirmModalOpen(true);
  }

  // Deactivate database Company object handler.
  async function deactivateCompany() {
    // Get the deactivation result and check for an error.
    const deactivationResult = await makeCompanyIncactive();

    if (deactivationResult.result === 'Error') {
      // Close the confirmation modal and open the error modal.
      setConfirmModalOpen(false);
      setErrorModalOpen(true);
    } else {
      // If no error occured, sign the user out.
      signOut({ callbackUrl: '/' });
    }
  }

  return (
    <>
      {
        <DeactivateInfoModal
          displayState={infoModalOpen}
          setDisplayState={hideModals}
          switchToInfoModal={openConfirmationModal}></DeactivateInfoModal>
      }

      {
        <DeactivateConfirmModal
          displayState={confirmModalOpen}
          setDisplayState={hideModals}
          deactivateCompany={deactivateCompany}></DeactivateConfirmModal>
      }

      {
        <DeactivateErrorModal
          displayState={errorModalOpen}
          setDisplayState={hideModals}></DeactivateErrorModal>
      }
    </>
  );
};
